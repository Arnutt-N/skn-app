from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc, func
from app.models.user import User, ChatMode
from app.models.chat_session import ChatSession, SessionStatus, ClosedBy
from app.models.message import Message, MessageDirection
from app.models.chat_analytics import ChatAnalytics
from app.services.line_service import line_service
from app.services.telegram_service import telegram_service
from app.core.config import settings
from typing import List, Optional, Any

class LiveChatService:
    async def initiate_handoff(
        self,
        user: User,
        reply_token: str,
        db: AsyncSession,
        background_tasks=None # Kept for compatibility but unused
    ):
        """Initiate human handoff for a user"""
        # 1. Update user mode
        user.chat_mode = ChatMode.HUMAN

        # 2. Create chat session
        session = ChatSession(
            line_user_id=user.line_user_id,
            status=SessionStatus.WAITING,
            started_at=datetime.utcnow()
        )
        db.add(session)

        # 3. Send auto-greeting
        greeting = "เจ้าหน้าที่จะติดต่อกลับในไม่ช้า กรุณารอสักครู่"
        await line_service.reply_text(reply_token, greeting)

        # 4. Telegram notification
        recent_msgs = await self.get_recent_messages(user.line_user_id, 3, db)
        admin_url = f"{settings.ADMIN_URL}/admin/live-chat?user={user.line_user_id}"

        # Send directly (async)
        await telegram_service.send_handoff_notification(
            user.display_name or "Unknown",
            user.picture_url,
            recent_msgs,
            admin_url,
            db
        )

        await db.commit()
        return session

    async def claim_session(
        self,
        line_user_id: str,
        operator_id: int,
        db: AsyncSession
    ):
        """Operator claims a chat session"""
        session = await self.get_active_session(line_user_id, db)
        if session and session.status == SessionStatus.WAITING:
            session.operator_id = operator_id
            session.status = SessionStatus.ACTIVE
            session.claimed_at = datetime.utcnow()
            await db.commit()
        return session

    async def close_session(
        self,
        line_user_id: str,
        closed_by: ClosedBy,
        db: AsyncSession
    ):
        """Close a chat session and return to bot mode"""
        session = await self.get_active_session(line_user_id, db)
        if session:
            session.status = SessionStatus.CLOSED
            session.closed_at = datetime.utcnow()
            session.closed_by = closed_by

        # Return user to bot mode
        result = await db.execute(select(User).where(User.line_user_id == line_user_id))
        user = result.scalar_one_or_none()
        if user:
            user.chat_mode = ChatMode.BOT

        await db.commit()
        return session

    async def get_recent_messages(
        self,
        line_user_id: str,
        limit: int,
        db: AsyncSession
    ):
        """Get recent messages for a user"""
        result = await db.execute(
            select(Message)
            .where(Message.line_user_id == line_user_id)
            .order_by(desc(Message.created_at))
            .limit(limit)
        )
        return list(reversed(result.scalars().all()))

    async def get_active_session(self, line_user_id: str, db: AsyncSession):
        """Get active session for user"""
        result = await db.execute(
            select(ChatSession)
            .where(ChatSession.line_user_id == line_user_id)
            .where(ChatSession.status.in_([SessionStatus.WAITING, SessionStatus.ACTIVE]))
            .order_by(desc(ChatSession.started_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_conversations(
        self,
        status: Optional[str],
        db: AsyncSession
    ):
        """Get all conversations for inbox"""
        # Subquery to get last message for each user
        last_msg_subquery = (
            select(
                Message.line_user_id,
                func.max(Message.created_at).label("max_created")
            )
            .group_by(Message.line_user_id)
            .subquery()
        )

        # Join to get the full last message details
        # We need to be careful with joins if there are no messages
        
        # Main query for users
        query = (
            select(User, ChatSession)
            .outerjoin(ChatSession, (User.line_user_id == ChatSession.line_user_id) & 
                       (ChatSession.status.in_([SessionStatus.WAITING, SessionStatus.ACTIVE])))
            .where(User.line_user_id != None)
        )

        if status == "WAITING":
            query = query.where(ChatSession.status == SessionStatus.WAITING)
        elif status == "ACTIVE":
            query = query.where(ChatSession.status == SessionStatus.ACTIVE)
        elif status == "BOT":
            query = query.where(User.chat_mode == ChatMode.BOT)

        query = query.order_by(desc(User.last_message_at))
        
        result = await db.execute(query)
        rows = result.all()

        conversations = []
        for user, session in rows:
            # Get last message for this user separately for simplicity in async
            last_msg_stmt = select(Message).where(Message.line_user_id == user.line_user_id).order_by(desc(Message.created_at)).limit(1)
            last_msg = (await db.execute(last_msg_stmt)).scalar_one_or_none()
            
            conversations.append({
                "line_user_id": user.line_user_id,
                "display_name": user.display_name,
                "picture_url": user.picture_url,
                "friend_status": user.friend_status or "ACTIVE",
                "chat_mode": user.chat_mode or "BOT",
                "session": session,
                "last_message": {
                    "content": last_msg.content,
                    "created_at": last_msg.created_at
                } if last_msg else None,
                "unread_count": 0
            })

        waiting_count = await db.scalar(select(func.count(ChatSession.id)).where(ChatSession.status == SessionStatus.WAITING))
        active_count = await db.scalar(select(func.count(ChatSession.id)).where(ChatSession.status == SessionStatus.ACTIVE))

        return {
            "conversations": conversations,
            "total": len(conversations),
            "waiting_count": waiting_count or 0,
            "active_count": active_count or 0
        }

    async def get_conversation_detail(self, line_user_id: str, db: AsyncSession):
        """Get full chat history with a user"""
        result = await db.execute(select(User).where(User.line_user_id == line_user_id))
        user = result.scalar_one_or_none()
        if not user:
            return None
            
        session = await self.get_active_session(line_user_id, db)
        messages = await self.get_recent_messages(line_user_id, 50, db)
        
        return {
            "line_user_id": user.line_user_id,
            "display_name": user.display_name,
            "picture_url": user.picture_url,
            "friend_status": user.friend_status or "ACTIVE",
            "chat_mode": user.chat_mode or "BOT",
            "session": session,
            "messages": messages,
            "unread_count": 0
        }

    async def send_message(self, line_user_id: str, text: str, operator_id: int, db: AsyncSession):
        """Send message from operator to user via LINE"""
        from linebot.v3.messaging import TextMessage

        # Get operator name
        operator_result = await db.execute(select(User).where(User.id == operator_id))
        operator = operator_result.scalar_one_or_none()
        operator_name = operator.display_name if operator else "Admin"

        await line_service.reply_messages_push(line_user_id, [TextMessage(text=text)])

        await line_service.save_message(
            db=db,
            line_user_id=line_user_id,
            direction=MessageDirection.OUTGOING,
            message_type="text",
            content=text,
            sender_role="ADMIN",
            operator_name=operator_name
        )

        session = await self.get_active_session(line_user_id, db)
        if session:
            session.message_count += 1
            if not session.first_response_at:
                session.first_response_at = datetime.utcnow()

        await db.commit()
        return {"success": True}

    async def set_chat_mode(self, line_user_id: str, mode: ChatMode, db: AsyncSession):
        """Toggle chat mode"""
        result = await db.execute(select(User).where(User.line_user_id == line_user_id))
        user = result.scalar_one_or_none()
        if user:
            user.chat_mode = mode
            await db.commit()
            return True
        return False

    async def get_analytics(
        self,
        from_date: Optional[str],
        to_date: Optional[str],
        operator_id: Optional[int],
        db: AsyncSession
    ):
        """Get chat analytics dashboard data"""
        query = select(ChatAnalytics)
        
        if from_date:
            query = query.where(ChatAnalytics.date >= from_date)
        if to_date:
            query = query.where(ChatAnalytics.date <= to_date)
        if operator_id:
            query = query.where(ChatAnalytics.operator_id == operator_id)
            
        result = await db.execute(query.order_by(ChatAnalytics.date))
        rows = result.scalars().all()
        
        # Aggregate totals
        total_sessions = sum(r.total_sessions or 0 for r in rows)
        total_messages = sum(r.total_messages_sent or 0 for r in rows)
        
        # Calculate averages weighted by sessions? Or just simple average of averages?
        # Simple average for now
        avg_response = 0
        avg_resolution = 0
        if rows:
            valid_response_times = [r.avg_response_time_seconds for r in rows if r.avg_response_time_seconds]
            valid_resolution_times = [r.avg_resolution_time_seconds for r in rows if r.avg_resolution_time_seconds]
            
            if valid_response_times:
                avg_response = sum(valid_response_times) / len(valid_response_times)
            if valid_resolution_times:
                avg_resolution = sum(valid_resolution_times) / len(valid_resolution_times)
                
        return {
            "summary": {
                "total_sessions": total_sessions,
                "total_messages": total_messages,
                "avg_response_time": round(avg_response, 1),
                "avg_resolution_time": round(avg_resolution, 1)
            },
            "daily_stats": rows
        }

    async def get_operator_analytics(
        self,
        from_date: Optional[str],
        to_date: Optional[str],
        db: AsyncSession
    ):
        """Get per-operator performance metrics"""
        # Join with User to get names
        query = (
            select(
                ChatAnalytics.operator_id,
                User.display_name,
                func.sum(ChatAnalytics.total_sessions).label("total_sessions"),
                func.avg(ChatAnalytics.avg_response_time_seconds).label("avg_response"),
                func.avg(ChatAnalytics.avg_resolution_time_seconds).label("avg_resolution")
            )
            .join(User, ChatAnalytics.operator_id == User.id)
            .group_by(ChatAnalytics.operator_id, User.display_name)
        )

        if from_date:
            query = query.where(ChatAnalytics.date >= from_date)
        if to_date:
            query = query.where(ChatAnalytics.date <= to_date)
            
        result = await db.execute(query)
        rows = result.all()
        
        stats = []
        for r in rows:
            stats.append({
                "operator_id": r.operator_id,
                "operator_name": r.display_name,
                "total_sessions": r.total_sessions,
                "avg_response_time": round(r.avg_response, 1) if r.avg_response else 0,
                "avg_resolution_time": round(r.avg_resolution, 1) if r.avg_resolution else 0
            })
            
        return stats

live_chat_service = LiveChatService()
