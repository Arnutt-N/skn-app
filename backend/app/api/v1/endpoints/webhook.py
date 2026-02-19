from fastapi import APIRouter, Request, HTTPException, Header, BackgroundTasks
from linebot.v3.exceptions import InvalidSignatureError
from linebot.v3.webhooks import (
    MessageEvent,
    TextMessageContent,
    PostbackEvent,
    FollowEvent,
    UnfollowEvent
)
from linebot.v3.messaging import TextMessage, FlexMessage
import re
from app.core.line_client import parser
from app.services.line_service import line_service
from app.services.friend_service import friend_service
from app.services.response_parser import parse_response
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, literal
from app.models.message import MessageDirection
from app.models.auto_reply import AutoReply
from app.models.intent import IntentCategory, IntentKeyword, IntentResponse, MatchType
from app.models.service_request import ServiceRequest
from app.services.flex_messages import build_request_status_list
from sqlalchemy.orm import selectinload
from app.core.websocket_manager import ws_manager
from app.core.redis_client import redis_client
from app.schemas.ws_events import WSEventType
from app.core.config import settings
from app.services.handoff_service import handoff_service
from app.services.live_chat_service import live_chat_service
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Webhook event deduplication cache key prefix
WEBHOOK_EVENT_KEY_PREFIX = "webhook:event:"

@router.post("/webhook")
async def line_webhook(request: Request, background_tasks: BackgroundTasks, x_line_signature: str = Header(None)):
    if x_line_signature is None:
        raise HTTPException(status_code=400, detail="Missing X-Line-Signature header")

    body = await request.body()
    body_str = body.decode('utf-8')

    try:
        events = parser.parse(body_str, x_line_signature)
    except InvalidSignatureError:
        logger.error(f"Invalid signature. Body: {body_str}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Use BackgroundTasks to process events asynchronously
    background_tasks.add_task(process_webhook_events, events)

    return "OK"

async def process_webhook_events(events):
    """Process webhook events with deduplication support."""
    async with AsyncSessionLocal() as db:
        for event in events:
            # Deduplication check using webhookEventId
            event_id = getattr(event, 'webhook_event_id', None)
            if event_id:
                cache_key = f"{WEBHOOK_EVENT_KEY_PREFIX}{event_id}"
                if await redis_client.exists(cache_key):
                    logger.info(f"Duplicate webhook event {event_id}, skipping")
                    continue
                # Mark as processed with TTL
                await redis_client.setex(
                    cache_key, 
                    settings.WEBHOOK_EVENT_TTL, 
                    "1"
                )
                logger.debug(f"Marked event {event_id} as processed")
            
            # Process the event
            if isinstance(event, MessageEvent):
                await handle_message_event(event, db)
            elif isinstance(event, PostbackEvent):
                await handle_postback_event(event, db)
            elif isinstance(event, FollowEvent):
                await handle_follow_event(event, db)
            elif isinstance(event, UnfollowEvent):
                await handle_unfollow_event(event, db)


async def handle_follow_event(event: FollowEvent, db: AsyncSession):
    """Handle when a user adds the LINE OA as friend"""
    line_user_id = event.source.user_id
    logger.info(f"User {line_user_id} followed the OA")

    # Create user record and log follow event
    await friend_service.get_or_create_user(line_user_id, db)
    await friend_service.handle_follow(line_user_id, db)


async def handle_unfollow_event(event: UnfollowEvent, db: AsyncSession):
    """Handle when a user blocks/unfollows the LINE OA"""
    line_user_id = event.source.user_id
    logger.info(f"User {line_user_id} unfollowed the OA")

    await friend_service.handle_unfollow(line_user_id, db)


async def handle_message_event(event: MessageEvent, db: AsyncSession):
    # Check for LINE Verify dummy token
    if event.reply_token == "00000000000000000000000000000000":
        logger.info("Received Verify Event (dummy token). Skipping reply.")
        return

    line_user_id = event.source.user_id

    # Ensure User record exists (critical for live chat to show this user)
    user = await friend_service.get_or_create_user(line_user_id, db)
    user = await friend_service.refresh_profile(line_user_id, db, force=False, stale_after_hours=24) or user

    # Update last_message_at for conversation sorting
    user.last_message_at = datetime.utcnow()
    await db.commit()

    if isinstance(event.message, TextMessageContent):
        text = event.message.text.strip()

        # 1. Save User Message (Incoming)
        saved_message = await line_service.save_message(
            db=db,
            line_user_id=line_user_id,
            direction=MessageDirection.INCOMING,
            message_type="text",
            content=text
        )

        # Broadcast to WebSocket clients in room (for operators viewing this conversation)
        room_id = ws_manager.get_room_id(line_user_id)
        await ws_manager.broadcast_to_room(room_id, {
            "type": WSEventType.NEW_MESSAGE.value,
            "payload": {
                "id": saved_message.id,
                "line_user_id": line_user_id,
                "direction": "INCOMING",
                "content": text,
                "message_type": "text",
                "sender_role": "USER",
                "created_at": saved_message.created_at.isoformat()
            },
            "timestamp": datetime.utcnow().isoformat()
        })

        # Send conversation updates per admin with personalized unread counts.
        room_id = ws_manager.get_room_id(line_user_id)
        for admin_id in ws_manager.get_connected_admin_ids():
            if await ws_manager.is_admin_in_room_global(admin_id, room_id):
                await ws_manager.mark_conversation_read(
                    admin_id,
                    line_user_id,
                    saved_message.created_at if saved_message.created_at else datetime.utcnow(),
                )
                unread_count = 0
            else:
                unread_count = await live_chat_service.get_unread_count(
                    line_user_id=line_user_id,
                    admin_id=admin_id,
                    db=db,
                )

            await ws_manager.send_to_admin(admin_id, {
                "type": WSEventType.CONVERSATION_UPDATE.value,
                "payload": {
                    "line_user_id": line_user_id,
                    "display_name": user.display_name or "LINE User",
                    "picture_url": user.picture_url,
                    "chat_mode": user.chat_mode.value if user.chat_mode else "BOT",
                    "last_message": {
                        "content": text,
                        "created_at": saved_message.created_at.isoformat()
                    },
                    "unread_count": unread_count,
                },
                "timestamp": datetime.utcnow().isoformat()
            })

        # 2. Show Loading Animation
        await line_service.show_loading_animation(line_user_id)

        # --- HANDOFF KEYWORD DETECTION ---
        # Check for handoff keywords before intent matching
        if await handoff_service.check_handoff_keywords(text, user, event.reply_token, db):
            # Handoff initiated - skip bot response
            await db.commit()
            return
        # -----------------------------------

        # --- SPECIAL COMMAND: CHECK STATUS ---
        if text == "ติดตาม" or text == "สถานะ":
            await handle_check_status(line_user_id, event.reply_token, db)
            return
            
        # Check if text is a phone number (0xxxxxxxxx)
        if re.match(r"^0\d{9}$", text):
            await handle_bind_phone(text, line_user_id, event.reply_token, db)
            return
        # -------------------------------------

        # 3. Find Intent (Hierarchical)
        # We look for keywords, get the category, and then get all active responses
        # Match EXACT first
        stmt = select(IntentKeyword).options(
            selectinload(IntentKeyword.category).selectinload(IntentCategory.responses.and_(IntentResponse.is_active == True))
        ).filter(
            IntentKeyword.keyword == text,
            IntentKeyword.match_type == MatchType.EXACT
        )
        result = await db.execute(stmt)
        keyword_match = result.scalars().first()
        
        if not keyword_match:
            # Fallback to legacy AutoReply for backward compatibility during migration
            stmt = select(AutoReply).filter(AutoReply.keyword == text, AutoReply.is_active == True)
            result = await db.execute(stmt)
            rule = result.scalars().first()
            
            if not rule:
                # Try contains: User text must CONTAIN the keyword (e.g. "Price please" contains "Price")
                # Syntax: 'User Text' ILIKE '%' + AutoReply.keyword + '%'
                stmt = select(AutoReply).filter(
                    select(1).where(
                        literal(text).ilike(func.concat('%', AutoReply.keyword, '%'))
                    ).exists(),
                    AutoReply.is_active == True
                ).limit(1)
                
                # Note: The above SQL logic can be complex in pure string form depending on DB.
                # Simpler robust approach for small tables:
                # But since we use IntentKeyword mostly now, let's fix IntentKeyword logic first.
                pass 
            
            # RE-CHECK IntentKeyword with Correct Logic
            # User Text: "ขอราคาหน่อยครับ" (Long)
            # DB Keyword: "ราคา" (Short)
            # Logic: "ขอราคาหน่อยครับ" LIKE "%" + "ราคา" + "%"
            
            from sqlalchemy import literal
            stmt = select(IntentKeyword).options(
                selectinload(IntentKeyword.category).selectinload(IntentCategory.responses.and_(IntentResponse.is_active == True))
            ).filter(
                literal(text).ilike(func.concat('%', IntentKeyword.keyword, '%')),
                IntentKeyword.match_type == MatchType.CONTAINS
            ).limit(1)
            result = await db.execute(stmt)
            keyword_match = result.scalars().first()
            
            if not keyword_match and not rule:
                 # Last resort: Legacy Contains
                 stmt = select(AutoReply).filter(
                    literal(text).ilike(func.concat('%', AutoReply.keyword, '%')),
                    AutoReply.is_active == True
                 ).limit(1)
                 result = await db.execute(stmt)
                 rule = result.scalars().first()

            if not rule:
                logger.info(f"No auto-reply or intent found for: {text}")
                return
            
            # Pack rule into a pseudo-responses list for the logic below
            responses = [{
                "reply_type": rule.reply_type,
                "text_content": rule.text_content,
                "payload": rule.payload,
                "keyword": rule.keyword
            }]
            cat_name = "Legacy"
        else:
            category = keyword_match.category
            if not category or not category.is_active:
                logger.info(f"Category '{category.name if category else 'N/A'}' is inactive.")
                return
            
            responses = category.responses
            cat_name = category.name

        if not responses:
            logger.info(f"No active responses found for category: {cat_name}")
            return

        # 4. Build and send all responses
        all_messages = []
        
        for res in responses:
            # Check for max 5 messages (LINE limit)
            if len(all_messages) >= 5:
                break
                
            reply_type = res.reply_type if isinstance(res, IntentResponse) else res["reply_type"]
            text_content = res.text_content if isinstance(res, IntentResponse) else res["text_content"]
            payload = res.payload if isinstance(res, IntentResponse) else res["payload"]
            
            try:
                if payload:
                    # Flex/Complex Payload
                    from linebot.v3.messaging import FlexMessage, FlexContainer
                    from app.utils.url_utils import resolve_payload_urls, strip_flex_body
                    
                    resolved_payload = resolve_payload_urls(payload)
                    stripped_payload = strip_flex_body(resolved_payload)
                    container = FlexContainer.from_dict(stripped_payload)
                    
                    if text_content:
                        all_messages.append(TextMessage(text=text_content))
                    
                    # Ensure we don't exceed 5
                    if len(all_messages) < 5:
                        keyword_label = keyword_match.keyword if keyword_match else res.get("keyword", "Bot")
                        all_messages.append(FlexMessage(alt_text=keyword_label, contents=container))
                else:
                    # Text or Object Reference
                    msgs = await parse_response(text_content or "", db)
                    if msgs:
                        # Extend but keep limit 5
                        for m in msgs:
                            if len(all_messages) < 5:
                                all_messages.append(m)
                    elif text_content:
                        # Simple text fallback
                        all_messages.append(TextMessage(text=text_content))
            except Exception as e:
                logger.error(f"Error building response in category {cat_name}: {e}")

        if all_messages:
            try:
                await line_service.reply_messages(event.reply_token, all_messages)
                
                # 5. Save Bot Reply (Outgoing)
                await line_service.save_message(
                    db=db,
                    line_user_id=line_user_id,
                    direction=MessageDirection.OUTGOING,
                    message_type="multi",
                    content=f"Sent {len(all_messages)} messages for intent '{cat_name}'"
                )
            except Exception as e:
                logger.error(f"Failed to send all messages: {e}")
                await line_service.reply_text(event.reply_token, "ขออภัย เกิดข้อผิดพลาดในการส่งข้อมูล")


    else:
        message_type, content, payload = await _extract_non_text_message(event.message)
        if not message_type:
            logger.info("Unsupported non-text message type: %s", getattr(event.message, "type", "unknown"))
            return

        saved_message = await line_service.save_message(
            db=db,
            line_user_id=line_user_id,
            direction=MessageDirection.INCOMING,
            message_type=message_type,
            content=content,
            payload=payload,
            sender_role="USER",
        )

        room_id = ws_manager.get_room_id(line_user_id)
        await ws_manager.broadcast_to_room(room_id, {
            "type": WSEventType.NEW_MESSAGE.value,
            "payload": {
                "id": saved_message.id,
                "line_user_id": line_user_id,
                "direction": "INCOMING",
                "content": content,
                "message_type": message_type,
                "payload": payload,
                "sender_role": "USER",
                "created_at": saved_message.created_at.isoformat()
            },
            "timestamp": datetime.utcnow().isoformat()
        })

        for admin_id in ws_manager.get_connected_admin_ids():
            if await ws_manager.is_admin_in_room_global(admin_id, room_id):
                await ws_manager.mark_conversation_read(
                    admin_id,
                    line_user_id,
                    saved_message.created_at if saved_message.created_at else datetime.utcnow(),
                )
                unread_count = 0
            else:
                unread_count = await live_chat_service.get_unread_count(
                    line_user_id=line_user_id,
                    admin_id=admin_id,
                    db=db,
                )

            await ws_manager.send_to_admin(admin_id, {
                "type": WSEventType.CONVERSATION_UPDATE.value,
                "payload": {
                    "line_user_id": line_user_id,
                    "display_name": user.display_name or "LINE User",
                    "picture_url": user.picture_url,
                    "chat_mode": user.chat_mode.value if user.chat_mode else "BOT",
                    "last_message": {
                        "content": content,
                        "created_at": saved_message.created_at.isoformat()
                    },
                    "unread_count": unread_count,
                },
                "timestamp": datetime.utcnow().isoformat()
            })


async def _extract_non_text_message(message):
    message_type = getattr(message, "type", None)
    line_message_id = getattr(message, "id", None)

    if message_type == "image":
        media = await line_service.persist_line_media(
            message_id=str(line_message_id),
            media_type="image",
        ) if line_message_id else {"url": None, "preview_url": None, "content_type": None, "size": None}
        return "image", "[Image]", {
            "line_message_id": line_message_id,
            "preview_url": media.get("preview_url"),
            "url": media.get("url"),
            "content_type": media.get("content_type"),
            "size": media.get("size"),
        }

    if message_type == "sticker":
        package_id = str(getattr(message, "package_id", ""))
        sticker_id = str(getattr(message, "sticker_id", ""))
        return "sticker", f"[Sticker {package_id}/{sticker_id}]", {
            "line_message_id": line_message_id,
            "package_id": package_id,
            "sticker_id": sticker_id,
            "sticker_resource_type": getattr(message, "sticker_resource_type", None),
        }

    if message_type == "file":
        file_name = getattr(message, "file_name", None)
        file_size = getattr(message, "file_size", None)
        media = await line_service.persist_line_media(
            message_id=str(line_message_id),
            media_type="file",
            file_name=file_name,
        ) if line_message_id else {"url": None, "preview_url": None, "content_type": None, "size": None}
        return "file", file_name or "[File]", {
            "line_message_id": line_message_id,
            "file_name": media.get("file_name") or file_name,
            "size": media.get("size") if media.get("size") is not None else file_size,
            "url": media.get("url"),
            "content_type": media.get("content_type"),
        }

    if message_type in {"video", "audio"}:
        media = await line_service.persist_line_media(
            message_id=str(line_message_id),
            media_type=message_type,
        ) if line_message_id else {"url": None, "preview_url": None, "content_type": None, "size": None}
        return message_type, "[Video]" if message_type == "video" else "[Audio]", {
            "line_message_id": line_message_id,
            "url": media.get("url"),
            "content_type": media.get("content_type"),
            "size": media.get("size"),
        }

    return None, "", {}


async def handle_postback_event(event: PostbackEvent, db: AsyncSession):
    line_user_id = event.source.user_id
    data = event.postback.data

    await line_service.show_loading_animation(line_user_id)

    if data == "action=track_requests":
        await handle_check_status(line_user_id, event.reply_token, db)
    elif data.startswith("csat|"):
        await handle_csat_response(line_user_id, data, event.reply_token, db)
    else:
        # Handle other postbacks if any
        pass


async def handle_csat_response(line_user_id: str, data: str, reply_token: str, db: AsyncSession):
    """Handle CSAT survey postback: csat|{session_id}|{score}"""
    try:
        parts = data.split("|")
        if len(parts) != 3:
            logger.warning(f"Invalid CSAT postback data: {data}")
            return

        session_id = int(parts[1])
        score = int(parts[2])

        if not 1 <= score <= 5:
            logger.warning(f"Invalid CSAT score: {score}")
            return

        from app.services.csat_service import csat_service
        response = await csat_service.record_response(
            session_id=session_id,
            line_user_id=line_user_id,
            score=score,
            feedback=None,
            db=db
        )

        thank_you = csat_service.get_thank_you_message(score)
        await line_service.reply_text(reply_token, thank_you)

    except (ValueError, IndexError) as e:
        logger.error(f"Error parsing CSAT postback '{data}': {e}")
    except Exception as e:
        logger.error(f"Error recording CSAT response: {e}")

async def handle_check_status(line_user_id: str, reply_token: str, db: AsyncSession):
    """Fetch latest 5 requests and reply with Flex Message or ask for Phone"""
    try:
        # Fetch requests
        stmt = (
            select(ServiceRequest)
            .where(ServiceRequest.line_user_id == line_user_id)
            .order_by(ServiceRequest.created_at.desc())
            .limit(5)
        )
        result = await db.execute(stmt)
        requests = result.scalars().all()
        
        if not requests:
            # Not found by LINE ID -> Ask for Phone
            msg = (
                "⚠️ ไม่พบประวัติคำร้องที่ผูกกับ LINE ของคุณ\n\n"
                "หากท่านเคยยื่นเรื่องไว้ กรุณาพิมพ์ **เบอร์โทรศัพท์** (10 หลัก) "
                "เพื่อค้นหาและเชื่อมโยงข้อมูลครับ"
            )
            await line_service.reply_text(reply_token, msg)
            return

        # Build Flex Message
        flex_content = build_request_status_list(requests)
        
        # Send Reply
        await line_service.reply_flex(reply_token, "สถานะคำร้องของคุณ", flex_content)
        
    except Exception as e:
        logger.error(f"Error checking status for {line_user_id}: {e}")
        await line_service.reply_text(reply_token, "ขออภัย ไม่สามารถดึงข้อมูลสถานะได้ในขณะนี้")


async def handle_bind_phone(phone_number: str, line_user_id: str, reply_token: str, db: AsyncSession):
    """Search by phone, bind LINE ID, and show status"""
    try:
        # 1. Search for requests with this phone number
        # Optional: We could check if they already have a line_user_id to prevent stealing, 
        # but per requirement "Option B", we allow binding.
        
        stmt = select(ServiceRequest).where(ServiceRequest.phone_number == phone_number)
        result = await db.execute(stmt)
        requests = result.scalars().all()
        
        if not requests:
            await line_service.reply_text(reply_token, f"❌ ไม่พบข้อมูลคำร้องของเบอร์ {phone_number} ครับ")
            return
            
        # 2. Update line_user_id for these requests
        # We update ALL requests matching this phone to the new LINE ID
        from sqlalchemy import update
        update_stmt = (
            update(ServiceRequest)
            .where(ServiceRequest.phone_number == phone_number)
            .values(line_user_id=line_user_id)
        )
        await db.execute(update_stmt)
        await db.commit()
        
        # 3. Fetch updated list (Top 5)
        stmt_latest = (
            select(ServiceRequest)
            .where(ServiceRequest.line_user_id == line_user_id)
            .order_by(ServiceRequest.created_at.desc())
            .limit(5)
        )
        result_latest = await db.execute(stmt_latest)
        latest_requests = result_latest.scalars().all()
        
        # 4. Success Reply
        flex_content = build_request_status_list(latest_requests)
        
        # Add a text message saying "Linked successfully" before the Flex? 
        # LineService.reply_flex sends one message. We can't easily send two unless we modify it.
        # For simplicity, just sending the list implies success. OR we assume build_request_status_list handles it.
        # Let's send a success text then the flex? No, reply token used once.
        # We'll just send the Flex. The user will see their data.
        
        await line_service.reply_flex(reply_token, "สถานะคำร้องของคุณ", flex_content)
        
    except Exception as e:
        logger.error(f"Error binding phone {phone_number}: {e}")
        await line_service.reply_text(reply_token, "ขออภัย เกิดข้อผิดพลาดในการเชื่อมโยงข้อมูล")
