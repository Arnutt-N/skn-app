from typing import Dict, Set, Optional
from fastapi import WebSocket
from datetime import datetime
import logging

from app.core.rate_limiter import ws_rate_limiter

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manage WebSocket connections, rooms, and broadcasting"""

    def __init__(self):
        # admin_id -> set of WebSocket connections (supports multiple tabs)
        self.connections: Dict[str, Set[WebSocket]] = {}
        # room_id -> set of admin_ids
        self.rooms: Dict[str, Set[str]] = {}
        # websocket -> admin_id mapping for cleanup
        self.ws_to_admin: Dict[WebSocket, str] = {}
        # admin metadata: {connected_at, last_ping, rooms}
        self.admin_metadata: Dict[str, dict] = {}

    async def connect(self, websocket: WebSocket) -> str:
        """Accept connection, return connection_id"""
        await websocket.accept()
        return str(id(websocket))

    async def register(self, websocket: WebSocket, admin_id: str):
        """Register authenticated connection"""
        if admin_id not in self.connections:
            self.connections[admin_id] = set()
        self.connections[admin_id].add(websocket)
        self.ws_to_admin[websocket] = admin_id

        if admin_id not in self.admin_metadata:
            self.admin_metadata[admin_id] = {
                "connected_at": datetime.utcnow(),
                "last_ping": datetime.utcnow(),
                "rooms": set(),
                "status": "online"
            }

        logger.info(f"Admin {admin_id} registered. Connections: {len(self.connections[admin_id])}")

    async def disconnect(self, websocket: WebSocket):
        """Clean up connection"""
        admin_id = self.ws_to_admin.get(websocket)
        if not admin_id:
            return

        # Leave all rooms
        for room_id in list(self.admin_metadata.get(admin_id, {}).get("rooms", [])):
            await self.leave_room(websocket, room_id)

        # Remove connection
        if admin_id in self.connections:
            self.connections[admin_id].discard(websocket)
            if not self.connections[admin_id]:
                # Clean up rate limiter when last connection closes
                ws_rate_limiter.reset(admin_id)
                del self.connections[admin_id]
                if admin_id in self.admin_metadata:
                    self.admin_metadata[admin_id]["status"] = "offline"

        self.ws_to_admin.pop(websocket, None)
        logger.info(f"Admin {admin_id} disconnected")

    async def join_room(self, websocket: WebSocket, room_id: str):
        """Add connection to a room"""
        admin_id = self.ws_to_admin.get(websocket)
        if not admin_id:
            return

        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add(admin_id)

        if admin_id in self.admin_metadata:
            self.admin_metadata[admin_id]["rooms"].add(room_id)

        # Notify others in room
        await self.broadcast_to_room(room_id, {
            "type": "operator_joined",
            "payload": {"admin_id": admin_id, "room_id": room_id},
            "timestamp": datetime.utcnow().isoformat()
        }, exclude_admin=admin_id)

        logger.info(f"Admin {admin_id} joined room {room_id}")

    async def leave_room(self, websocket: WebSocket, room_id: str):
        """Remove connection from a room"""
        admin_id = self.ws_to_admin.get(websocket)
        if not admin_id:
            return

        if room_id in self.rooms:
            self.rooms[room_id].discard(admin_id)
            if not self.rooms[room_id]:
                del self.rooms[room_id]

        if admin_id in self.admin_metadata:
            self.admin_metadata[admin_id]["rooms"].discard(room_id)

        # Notify others
        await self.broadcast_to_room(room_id, {
            "type": "operator_left",
            "payload": {"admin_id": admin_id, "room_id": room_id},
            "timestamp": datetime.utcnow().isoformat()
        })

        logger.info(f"Admin {admin_id} left room {room_id}")

    async def send_personal(self, websocket: WebSocket, data: dict):
        """Send to specific connection"""
        try:
            await websocket.send_json(data)
        except Exception as e:
            logger.error(f"Error sending to websocket: {e}")

    async def send_to_admin(self, admin_id: str, data: dict):
        """Send to all connections of an admin"""
        if admin_id not in self.connections:
            return

        disconnected = []
        for ws in self.connections[admin_id]:
            try:
                await ws.send_json(data)
            except Exception:
                disconnected.append(ws)

        for ws in disconnected:
            await self.disconnect(ws)

    async def broadcast_to_room(self, room_id: str, data: dict, exclude_admin: Optional[str] = None):
        """Broadcast to all admins in a room"""
        if room_id not in self.rooms:
            return

        for admin_id in list(self.rooms.get(room_id, [])):
            if admin_id != exclude_admin:
                await self.send_to_admin(admin_id, data)

    async def broadcast_to_all(self, data: dict, exclude_admin: Optional[str] = None):
        """Broadcast to all connected admins"""
        for admin_id in list(self.connections.keys()):
            if admin_id != exclude_admin:
                await self.send_to_admin(admin_id, data)

    def get_room_id(self, line_user_id: str) -> str:
        """Generate room ID from line_user_id"""
        return f"conversation:{line_user_id}"

    def get_online_admins(self) -> list:
        """Get list of online admins"""
        result = []
        for admin_id, meta in self.admin_metadata.items():
            if meta.get("status") == "online":
                result.append({
                    "id": admin_id,
                    "status": meta["status"],
                    "active_chats": len(meta.get("rooms", []))
                })
        return result

    def is_admin_online(self, admin_id: str) -> bool:
        """Check if admin is connected"""
        return admin_id in self.connections and len(self.connections[admin_id]) > 0


# Singleton instance
ws_manager = ConnectionManager()
