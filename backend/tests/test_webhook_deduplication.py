"""Tests for webhook event deduplication."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from app.api.v1.endpoints.webhook import process_webhook_events, WEBHOOK_EVENT_KEY_PREFIX
from app.core.redis_client import RedisClient


class TestWebhookDeduplication:
    """Test webhook event deduplication logic."""

    @pytest.fixture
    def mock_redis(self):
        """Mock Redis client."""
        with patch('app.api.v1.endpoints.webhook.redis_client') as mock:
            mock.exists = AsyncMock(return_value=False)
            mock.setex = AsyncMock()
            yield mock

    @pytest.fixture
    def mock_event_with_id(self):
        """Create a mock event with webhook_event_id."""
        event = MagicMock()
        event.webhook_event_id = "test-event-id-12345"
        return event

    @pytest.fixture
    def mock_event_without_id(self):
        """Create a mock event without webhook_event_id."""
        event = MagicMock()
        event.webhook_event_id = None
        return event

    @pytest.mark.asyncio
    async def test_duplicate_event_skipped(self, mock_redis, mock_event_with_id):
        """Test that duplicate events are skipped."""
        # Arrange: Redis returns True (key exists)
        mock_redis.exists.return_value = True
        
        events = [mock_event_with_id]
        
        # Act
        await process_webhook_events(events)
        
        # Assert: Event should be skipped (no setex call for this event)
        mock_redis.exists.assert_called_once_with(f"{WEBHOOK_EVENT_KEY_PREFIX}test-event-id-12345")

    @pytest.mark.asyncio
    async def test_new_event_processed(self, mock_redis, mock_event_with_id):
        """Test that new events are processed and cached."""
        # Arrange: Redis returns False (key doesn't exist)
        mock_redis.exists.return_value = False
        
        events = [mock_event_with_id]
        
        # Act
        with patch('app.api.v1.endpoints.webhook.handle_follow_event') as mock_handler:
            await process_webhook_events(events)
            
            # Assert
            mock_redis.setex.assert_called_once()
            cache_key = mock_redis.setex.call_args[0][0]
            assert "test-event-id-12345" in cache_key

    @pytest.mark.asyncio
    async def test_event_without_id_processed(self, mock_redis, mock_event_without_id):
        """Test that events without ID are still processed."""
        events = [mock_event_without_id]
        
        # Act
        await process_webhook_events(events)
        
        # Assert: Redis should not be called for events without ID
        mock_redis.exists.assert_not_called()
        mock_redis.setex.assert_not_called()

    @pytest.mark.asyncio
    async def test_multiple_events_mixed(self, mock_redis):
        """Test processing mix of duplicate and new events."""
        # Arrange
        event1 = MagicMock()  # Duplicate
        event1.webhook_event_id = "duplicate-id"
        
        event2 = MagicMock()  # New
        event2.webhook_event_id = "new-id"
        
        event3 = MagicMock()  # No ID
        event3.webhook_event_id = None
        
        async def mock_exists(key):
            return "duplicate" in key
        
        mock_redis.exists.side_effect = mock_exists
        events = [event1, event2, event3]
        
        # Act
        await process_webhook_events(events)
        
        # Assert: Only event2 should be cached
        assert mock_redis.setex.call_count == 1
        cache_key = mock_redis.setex.call_args[0][0]
        assert "new-id" in cache_key


class TestRedisClient:
    """Test Redis client functionality."""

    @pytest.fixture
    def redis_client(self):
        """Create Redis client instance."""
        return RedisClient()

    @pytest.mark.asyncio
    async def test_exists_with_no_connection(self, redis_client):
        """Test exists() returns False when not connected."""
        result = await redis_client.exists("any-key")
        assert result is False

    @pytest.mark.asyncio
    async def test_setex_with_no_connection(self, redis_client):
        """Test setex() silently fails when not connected."""
        # Should not raise exception
        await redis_client.setex("key", 300, "value")

    @pytest.mark.asyncio
    async def test_is_connected_property(self, redis_client):
        """Test is_connected property."""
        assert redis_client.is_connected is False
