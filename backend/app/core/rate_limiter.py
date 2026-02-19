"""WebSocket rate limiting using sliding window algorithm"""
import time
from typing import Dict, List
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class WebSocketRateLimiter:
    """
    Rate limiter for WebSocket messages using sliding window algorithm.

    Tracks message timestamps per client and allows/denies based on
    configured limits (WS_RATE_LIMIT_MESSAGES per WS_RATE_LIMIT_WINDOW seconds).
    """

    def __init__(self):
        self.buckets: Dict[str, List[float]] = {}
        self.max_messages = settings.WS_RATE_LIMIT_MESSAGES
        self.window = settings.WS_RATE_LIMIT_WINDOW

    def is_allowed(self, client_id: str) -> bool:
        """
        Check if client is allowed to send a message.

        Args:
            client_id: Unique identifier for the client (admin_id)

        Returns:
            True if within rate limit, False if exceeded
        """
        now = time.time()

        # Get or create bucket for client
        if client_id not in self.buckets:
            self.buckets[client_id] = []

        bucket = self.buckets[client_id]

        # Remove timestamps outside the window
        cutoff = now - self.window
        bucket = [t for t in bucket if t > cutoff]

        # Check if within limit
        if len(bucket) >= self.max_messages:
            logger.warning(f"Rate limit exceeded for client {client_id}: {len(bucket)}/{self.max_messages}")
            self.buckets[client_id] = bucket
            return False

        # Add current timestamp and allow
        bucket.append(now)
        self.buckets[client_id] = bucket
        return True

    def get_remaining(self, client_id: str) -> int:
        """Get remaining messages allowed in current window."""
        now = time.time()
        cutoff = now - self.window

        if client_id not in self.buckets:
            return self.max_messages

        bucket = [t for t in self.buckets[client_id] if t > cutoff]
        return max(0, self.max_messages - len(bucket))

    def reset(self, client_id: str):
        """Reset rate limit for a client (on disconnect)."""
        self.buckets.pop(client_id, None)

    def cleanup_stale(self, max_age: int = 3600):
        """Remove buckets that haven't been updated in max_age seconds."""
        now = time.time()
        stale_clients = []

        for client_id, bucket in self.buckets.items():
            if not bucket or (now - max(bucket)) > max_age:
                stale_clients.append(client_id)

        for client_id in stale_clients:
            del self.buckets[client_id]

        if stale_clients:
            logger.info(f"Cleaned up {len(stale_clients)} stale rate limit buckets")


# Singleton instance
ws_rate_limiter = WebSocketRateLimiter()
