from linebot.v3.messaging import (
    AsyncMessagingApi,
    ReplyMessageRequest,
    TextMessage,
    FlexMessage,
    FlexContainer,
    ShowLoadingAnimationRequest
)
from app.core.line_client import line_bot_api
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.message import Message, MessageDirection

class LineService:
    def __init__(self, api: AsyncMessagingApi):
        self.api = api

    async def reply_text(self, reply_token: str, text: str):
        await self.api.reply_message(
            ReplyMessageRequest(
                reply_token=reply_token,
                messages=[TextMessage(text=text)]
            )
        )

    async def reply_flex(self, reply_token: str, alt_text: str, contents: dict):
        container = FlexContainer.from_dict(contents)
        await self.api.reply_message(
            ReplyMessageRequest(
                reply_token=reply_token,
                messages=[FlexMessage(alt_text=alt_text, contents=container)]
            )
        )

    async def reply_messages(self, reply_token: str, messages: list):
        """
        Reply with multiple messages at once (max 5 per LINE API).
        
        Args:
            reply_token: LINE reply token
            messages: List of LINE message objects (TextMessage, FlexMessage, etc.)
        """
        if not messages:
            return
        
        # LINE API limit: max 5 messages per reply
        await self.api.reply_message(
            ReplyMessageRequest(
                reply_token=reply_token,
                messages=messages[:5]
            )
        )

    async def show_loading_animation(self, chat_id: str, loading_seconds: int = 20):
        try:
            await self.api.show_loading_animation(
                ShowLoadingAnimationRequest(chatId=chat_id, loadingSeconds=loading_seconds)
            )
        except Exception as e:
            # Helper: Log but don't crash if loading animation fails (e.g. rate limit)
            print(f"Error showing loading animation: {e}")

    async def save_message(self, db: AsyncSession, line_user_id: str, direction: MessageDirection, message_type: str, content: str, payload: dict = None):
        message = Message(
            line_user_id=line_user_id,
            direction=direction,
            message_type=message_type,
            content=content,
            payload=payload
        )
        db.add(message)
        await db.commit()
        await db.refresh(message)
        return message

# Singleton instance
line_service = LineService(line_bot_api)
