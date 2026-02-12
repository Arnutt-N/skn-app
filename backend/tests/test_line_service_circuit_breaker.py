"""Tests for LINE API circuit breaker behavior."""
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import pytest

from app.services.line_service import LineService


@pytest.mark.asyncio
async def test_circuit_opens_after_failure_threshold_and_fast_fails():
    service = LineService()
    service._cb_failure_threshold = 2
    service._cb_recovery_timeout_seconds = 60
    service._api = AsyncMock()
    service._api.reply_message = AsyncMock(side_effect=RuntimeError("line down"))

    with pytest.raises(RuntimeError):
        await service.reply_text("token", "hello")
    with pytest.raises(RuntimeError):
        await service.reply_text("token", "hello")

    # Third call should fast-fail without invoking API again.
    with pytest.raises(RuntimeError, match="circuit is open"):
        await service.reply_text("token", "hello")

    assert service._api.reply_message.await_count == 2
    assert service._cb_open_until is not None


@pytest.mark.asyncio
async def test_circuit_recovers_after_timeout_and_success():
    service = LineService()
    service._cb_failure_threshold = 1
    service._cb_recovery_timeout_seconds = 1
    service._api = AsyncMock()
    service._api.reply_message = AsyncMock(side_effect=RuntimeError("line down"))

    with pytest.raises(RuntimeError):
        await service.reply_text("token", "hello")

    service._cb_open_until = datetime.now(timezone.utc) - timedelta(seconds=1)
    service._api.reply_message = AsyncMock(return_value=None)
    await service.reply_text("token", "hello")

    assert service._cb_open_until is None
    assert service._cb_failures == 0

