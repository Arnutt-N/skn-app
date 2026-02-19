"""Handoff service for detecting and processing human agent requests."""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, ChatMode
from app.services.live_chat_service import live_chat_service
import logging

logger = logging.getLogger(__name__)

# Configurable keywords - can be moved to database/settings later
HANDOFF_KEYWORDS_EN = [
    "agent", "human", "operator", "representative",
    "support", "help desk", "live person", "real person",
    "talk to someone", "speak to agent", "customer service",
    "need help", "talk to human", "connect to agent"
]

HANDOFF_KEYWORDS_TH = [
    "พูดกับเจ้าหน้าที่", "ติดต่อเจ้าหน้าที่", "คุยกับคน",
    "ขอคน", "ต้องการคน", "เจ้าหน้าที่", "ขอติดต่อแอดมิน",
    "ต้องการความช่วยเหลือ", "ขอความช่วยเหลือ", "ช่วยด้วย",
    "ติดต่อเจ้าหน้าที่", "คุยกับเจ้าหน้าที่", "ต้องการเจ้าหน้าที่",
    "ขอสาย", "ต่อสาย", "คุยสด", "เจ้าหน้าที่ให้คำปรึกษา"
]

HANDOFF_KEYWORDS = HANDOFF_KEYWORDS_EN + HANDOFF_KEYWORDS_TH


class HandoffService:
    """Service for handling bot-to-human handoff requests."""
    
    async def check_handoff_keywords(
        self,
        text: str,
        user: User,
        reply_token: str,
        db: AsyncSession
    ) -> bool:
        """
        Check if message contains handoff keywords.
        Returns True if handoff was initiated.
        
        Args:
            text: The message text from user
            user: The User model instance
            reply_token: LINE reply token for response
            db: Database session
            
        Returns:
            True if handoff was initiated, False otherwise
        """
        if not text:
            return False
            
        text_lower = text.strip().lower()
        
        # Check if any keyword matches
        matched_keyword = None
        for keyword in HANDOFF_KEYWORDS:
            if keyword in text_lower:
                matched_keyword = keyword
                break
        
        if not matched_keyword:
            return False
        
        # Only initiate if user is currently in BOT mode
        if user.chat_mode != ChatMode.BOT:
            logger.debug(f"User {user.line_user_id} already in {user.chat_mode} mode, skipping handoff")
            return False
        
        logger.info(f"Handoff keyword detected: '{matched_keyword}' for user {user.line_user_id}")
        
        # Initiate handoff
        try:
            await live_chat_service.initiate_handoff(user, reply_token, db)
            return True
        except Exception as e:
            logger.error(f"Failed to initiate handoff for user {user.line_user_id}: {e}")
            return False
    
    async def get_configurable_keywords(self, db: AsyncSession) -> list[str]:
        """
        Get keywords from database settings (future enhancement).
        
        Args:
            db: Database session
            
        Returns:
            List of handoff keywords
        """
        # TODO: Load from SystemSettings table
        # For now, return hardcoded list
        return HANDOFF_KEYWORDS
    
    def add_custom_keyword(self, keyword: str) -> None:
        """
        Add a custom keyword to the list (runtime only).
        
        Args:
            keyword: New keyword to add
        """
        keyword_lower = keyword.lower().strip()
        if keyword_lower not in [k.lower() for k in HANDOFF_KEYWORDS]:
            HANDOFF_KEYWORDS.append(keyword_lower)
            logger.info(f"Added custom handoff keyword: {keyword}")


# Global handoff service instance
handoff_service = HandoffService()
