"""
Unit tests for live_chat_service.py:
- claim_session logic
- close_session logic
- get_active_session logic
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone
from fastapi import HTTPException

from app.services.live_chat_service import LiveChatService
from app.models.chat_session import SessionStatus, ClosedBy


@pytest.fixture
def live_chat_service():
    return LiveChatService()


class TestClaimSession:
    """Test claim_session method"""

    @pytest.mark.asyncio
    async def test_claim_waiting_session(self, live_chat_service):
        """Should claim WAITING session and set to ACTIVE"""
        # Create mock session
        mock_session = MagicMock()
        mock_session.id = 10
        mock_session.status = SessionStatus.WAITING
        mock_session.operator_id = None
        mock_session.claimed_at = None

        # Mock DB
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.rowcount = 1
        mock_db.execute.return_value = mock_result
        mock_db.get.return_value = mock_session

        with patch.object(live_chat_service, 'get_active_session', new_callable=AsyncMock) as mock_get, \
             patch('app.services.live_chat_service.sla_service') as mock_sla:
            mock_sla.check_queue_wait_on_claim = AsyncMock()
            mock_get.return_value = mock_session
            result = await live_chat_service.claim_session("Utest", 1, mock_db)

            assert result == mock_session
            mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_claim_nonexistent_session(self, live_chat_service):
        """Should return None if no session exists"""
        mock_db = AsyncMock()

        with patch.object(live_chat_service, 'get_active_session', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = None
            result = await live_chat_service.claim_session("Utest", 1, mock_db)

            assert result is None
            mock_db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_claim_already_active_session(self, live_chat_service):
        """Should raise conflict for already ACTIVE session"""
        # Create mock session that is already ACTIVE
        mock_session = MagicMock()
        mock_session.status = SessionStatus.ACTIVE
        mock_session.operator_id = 5
        mock_session.claimed_at = datetime.now(timezone.utc)

        mock_db = AsyncMock()

        with patch.object(live_chat_service, 'get_active_session', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_session
            with pytest.raises(HTTPException) as exc:
                await live_chat_service.claim_session("Utest", 1, mock_db)
            assert exc.value.status_code == 409


class TestCloseSession:
    """Test close_session method"""

    @pytest.mark.asyncio
    async def test_close_active_session(self, live_chat_service):
        """Should close session and set CLOSED status"""
        mock_session = MagicMock()
        mock_session.status = SessionStatus.ACTIVE
        mock_session.closed_at = None
        mock_session.closed_by = None

        mock_user = MagicMock()
        mock_user.chat_mode = "HUMAN"

        mock_db = AsyncMock()

        # Mock execute for user query
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_db.execute.return_value = mock_result

        with patch.object(live_chat_service, 'get_active_session', new_callable=AsyncMock) as mock_get, \
             patch('app.services.live_chat_service.sla_service') as mock_sla:
            mock_sla.check_resolution_on_close = AsyncMock()
            mock_get.return_value = mock_session
            with patch('app.services.csat_service.csat_service') as mock_csat:
                mock_csat.send_survey = AsyncMock()
                result = await live_chat_service.close_session("Utest", ClosedBy.OPERATOR, mock_db)

            assert result == mock_session
            assert mock_session.status == SessionStatus.CLOSED
            assert mock_session.closed_at is not None
            assert mock_session.closed_by == ClosedBy.OPERATOR

    @pytest.mark.asyncio
    async def test_close_nonexistent_session(self, live_chat_service):
        """Should handle case where no active session exists"""
        mock_user = MagicMock()
        mock_user.chat_mode = "HUMAN"

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_db.execute.return_value = mock_result

        with patch.object(live_chat_service, 'get_active_session', new_callable=AsyncMock) as mock_get, \
             patch('app.services.live_chat_service.sla_service') as mock_sla:
            mock_sla.check_resolution_on_close = AsyncMock()
            mock_get.return_value = None
            result = await live_chat_service.close_session("Utest", ClosedBy.OPERATOR, mock_db)

            assert result is None
            # User chat_mode still updated via db.execute
            mock_db.execute.assert_called()


class TestGetActiveSession:
    """Test get_active_session method"""

    @pytest.mark.asyncio
    async def test_returns_waiting_session(self, live_chat_service):
        """Should return WAITING session"""
        mock_session = MagicMock()
        mock_session.status = SessionStatus.WAITING

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_session
        mock_db.execute.return_value = mock_result

        result = await live_chat_service.get_active_session("Utest", mock_db)

        assert result == mock_session

    @pytest.mark.asyncio
    async def test_returns_active_session(self, live_chat_service):
        """Should return ACTIVE session"""
        mock_session = MagicMock()
        mock_session.status = SessionStatus.ACTIVE

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_session
        mock_db.execute.return_value = mock_result

        result = await live_chat_service.get_active_session("Utest", mock_db)

        assert result == mock_session

    @pytest.mark.asyncio
    async def test_returns_none_when_no_session(self, live_chat_service):
        """Should return None when no active session"""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await live_chat_service.get_active_session("Utest", mock_db)

        assert result is None


class TestSearchMessages:
    """Test search_messages method"""

    @pytest.mark.asyncio
    async def test_search_messages_returns_formatted_items(self, live_chat_service):
        mock_message = MagicMock()
        mock_message.id = 101
        mock_message.line_user_id = "Uabc"
        mock_message.content = "hello world"
        mock_message.direction = MagicMock(value="INCOMING")
        mock_message.sender_role = None
        mock_message.created_at = datetime.now(timezone.utc)

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = [(mock_message, "Tester")]
        mock_db.execute.return_value = mock_result

        items = await live_chat_service.search_messages("hello", mock_db)
        assert len(items) == 1
        assert items[0]["id"] == 101
        assert items[0]["line_user_id"] == "Uabc"
        assert items[0]["display_name"] == "Tester"


class TestUnreadCount:
    """Test unread count helper"""

    @pytest.mark.asyncio
    async def test_unread_count_uses_read_marker(self, live_chat_service):
        mock_db = AsyncMock()
        mock_db.scalar.return_value = 3

        with patch('app.services.live_chat_service.redis_client.get', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = datetime.now(timezone.utc).isoformat()
            count = await live_chat_service.get_unread_count("Utest", 1, mock_db)
            assert count == 3
            mock_db.scalar.assert_called_once()

    @pytest.mark.asyncio
    async def test_unread_count_without_read_marker(self, live_chat_service):
        mock_db = AsyncMock()
        mock_db.scalar.return_value = 5

        with patch('app.services.live_chat_service.redis_client.get', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = None
            count = await live_chat_service.get_unread_count("Utest", 1, mock_db)
            assert count == 5

