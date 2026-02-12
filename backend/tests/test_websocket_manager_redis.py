import pytest
from datetime import datetime, timedelta, timezone

from app.core.redis_client import redis_client
from app.core.websocket_manager import ConnectionManager


class FakeRedis:
    def __init__(self):
        self.sets: dict[str, set[str]] = {}
        self.kv: dict[str, str] = {}
        self.expiry: dict[str, int] = {}
        self.zsets: dict[str, dict[str, float]] = {}

    async def sadd(self, key: str, *members: str):
        self.sets.setdefault(key, set()).update(str(m) for m in members)

    async def srem(self, key: str, *members: str):
        values = self.sets.get(key, set())
        for m in members:
            values.discard(str(m))
        self.sets[key] = values

    async def smembers(self, key: str):
        return set(self.sets.get(key, set()))

    async def sismember(self, key: str, member: str):
        return str(member) in self.sets.get(key, set())

    async def scard(self, key: str):
        return len(self.sets.get(key, set()))

    async def expire(self, key: str, ttl: int):
        self.expiry[key] = ttl

    async def delete(self, key: str):
        self.sets.pop(key, None)
        self.kv.pop(key, None)

    async def setex(self, key: str, _ttl: int, value: str):
        self.kv[key] = value

    async def zadd(self, _key: str, _mapping: dict[str, float]):
        return None

    async def zrem(self, _key: str, _member: str):
        return None

    async def set(self, key: str, value: str, nx: bool = False):
        if nx and key in self.kv:
            return None
        self.kv[key] = value

    async def get(self, key: str):
        return self.kv.get(key)

    async def zincrby(self, _key: str, _amount: float, _member: str):
        bucket = self.zsets.setdefault(_key, {})
        bucket[_member] = bucket.get(_member, 0.0) + float(_amount)
        return bucket[_member]


@pytest.mark.asyncio
async def test_is_admin_in_room_global_uses_server_room_sets():
    manager = ConnectionManager()
    manager.server_id = "srv-a"
    fake = FakeRedis()

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(redis_client, "_redis", fake)
        admin_id = "42"
        room_id = "conversation:U123"
        await fake.sadd(f"{manager.REDIS_ADMIN_SERVERS_PREFIX}:{admin_id}", "srv-a", "srv-b")
        await fake.sadd(f"{manager.REDIS_ADMIN_ROOMS_PREFIX}:{admin_id}:srv-b", room_id)

        assert await manager.is_admin_in_room_global(admin_id, room_id) is True


@pytest.mark.asyncio
async def test_server_scoped_room_membership_does_not_remove_other_servers():
    manager = ConnectionManager()
    manager.server_id = "srv-a"
    fake = FakeRedis()

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(redis_client, "_redis", fake)
        admin_id = "42"
        room_id = "conversation:U123"
        room_key = f"{manager.REDIS_ROOM_PREFIX}:{room_id}"

        await manager._redis_add_room_membership(admin_id, room_id)
        await fake.sadd(room_key, f"{admin_id}:srv-b")

        assert f"{admin_id}:srv-a" in await fake.smembers(room_key)
        assert f"{admin_id}:srv-b" in await fake.smembers(room_key)

        await manager._redis_remove_room_membership(admin_id, room_id)
        remaining = await fake.smembers(room_key)

        assert f"{admin_id}:srv-a" not in remaining
        assert f"{admin_id}:srv-b" in remaining


@pytest.mark.asyncio
async def test_mark_operator_offline_aggregates_same_day_availability():
    manager = ConnectionManager()
    fake = FakeRedis()

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(redis_client, "_redis", fake)
        admin_id = "7"
        started_at = datetime.now(timezone.utc) - timedelta(hours=2)
        await fake.set(manager._operator_online_key(admin_id), started_at.isoformat())

        await manager._redis_mark_operator_offline(admin_id)

        day_key = manager._operator_availability_key(datetime.now(timezone.utc).date().isoformat())
        assert admin_id in fake.zsets.get(day_key, {})
        assert fake.zsets[day_key][admin_id] > 0
        assert await fake.get(manager._operator_online_key(admin_id)) is None


@pytest.mark.asyncio
async def test_mark_operator_offline_aggregates_cross_day_availability():
    manager = ConnectionManager()
    fake = FakeRedis()

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(redis_client, "_redis", fake)
        admin_id = "9"
        started_at = datetime.now(timezone.utc) - timedelta(hours=26)
        await fake.set(manager._operator_online_key(admin_id), started_at.isoformat())

        await manager._redis_mark_operator_offline(admin_id)

        touched_keys = [k for k in fake.zsets.keys() if k.startswith(manager.OPERATOR_AVAILABILITY_PREFIX)]
        assert len(touched_keys) >= 2
        for key in touched_keys:
            assert fake.zsets[key].get(admin_id, 0.0) >= 0.0
        assert await fake.get(manager._operator_online_key(admin_id)) is None
