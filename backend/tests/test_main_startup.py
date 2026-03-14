"""Startup validation tests for application lifespan."""
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.main import app


def test_startup_fails_without_encryption_key_in_production():
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("app.services.credential_service.settings.ENVIRONMENT", "production")
        mp.setattr("app.services.credential_service.settings.ENCRYPTION_KEY", "")
        mp.setattr("app.main.redis_client.connect", AsyncMock())
        mp.setattr("app.main.ws_manager.initialize", AsyncMock())
        mp.setattr("app.main.start_cleanup_task", AsyncMock())
        mp.setattr("app.main.stop_cleanup_task", AsyncMock())
        mp.setattr("app.main.pubsub_manager.disconnect", AsyncMock())
        mp.setattr("app.main.redis_client.disconnect", AsyncMock())

        with pytest.raises(RuntimeError, match="ENCRYPTION_KEY must be set"):
            with TestClient(app):
                pass
