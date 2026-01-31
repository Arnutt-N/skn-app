# WebSocket Implementation Plan

## Phase 1: Backend Implementation

### 1.1 Create WebSocket Manager (`backend/app/core/websocket_manager.py`)

```python
from typing import Dict, Set, Optional
from fastapi import WebSocket
import json
from datetime import datetime

class ConnectionManager:
    """Manage WebSocket connections, rooms, and broadcasting"""
    
    def __init__(self):
        # admin_id -> WebSocket mapping
        self.connections: Dict[str, WebSocket] = {}
        # room_id -> set of admin_ids
        self.rooms: Dict[str, Set[str]] = {}
        # admin_id -> metadata (connected_at, last_ping, etc.)
        self.connection_metadata: Dict[str, dict] = {}
    
    async def connect(self, websocket: WebSocket) -> str:
        """Accept connection and return connection ID"""
        await websocket.accept()
        return str(id(websocket))
    
    async def register_connection(self, connection_id: str, admin_id: str, websocket: WebSocket):
        """Register authenticated connection"""
        self.connections[admin_id] = websocket
        self.connection_metadata[admin_id] = {
            'connection_id': connection_id,
            'connected_at': datetime.utcnow().isoformat(),
            'last_ping': datetime.utcnow().isoformat(),
            'rooms': set()
        }
    
    async def disconnect(self, admin_id: str):
        """Remove connection and cleanup rooms"""
        if admin_id in self.connections:
            # Leave all rooms
            for room_id in list(self.connection_metadata.get(admin_id, {}).get('rooms', [])):
                await self.leave_room(admin_id, room_id)
            
            del self.connections[admin_id]
            if admin_id in self.connection_metadata:
                del self.connection_metadata[admin_id]
    
    async def join_room(self, admin_id: str, room_id: str):
        """Add admin to a room"""
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add(admin_id)
        
        if admin_id in self.connection_metadata:
            self.connection_metadata[admin_id]['rooms'].add(room_id)
    
    async def leave_room(self, admin_id: str, room_id: str):
        """Remove admin from a room"""
        if room_id in self.rooms:
            self.rooms[room_id].discard(admin_id)
            if not self.rooms[room_id]:
                del self.rooms[room_id]
        
        if admin_id in self.connection_metadata:
            self.connection_metadata[admin_id]['rooms'].discard(room_id)
    
    async def broadcast_to_room(self, room_id: str, message: dict):
        """Send message to all admins in a room"""
        if room_id not in self.rooms:
            return
        
        disconnected = []
        for admin_id in self.rooms[room_id]:
            if admin_id in self.connections:
                try:
                    await self.connections[admin_id].send_json(message)
                except:
                    disconnected.append(admin_id)
        
        # Cleanup disconnected
        for admin_id in disconnected:
            await self.disconnect(admin_id)
    
    async def send_to_admin(self, admin_id: str, message: dict):
        """Send message to specific admin"""
        if admin_id in self.connections:
            try:
                await self.connections[admin_id].send_json(message)
            except:
                await self.disconnect(admin_id)
    
    async def broadcast_to_all(self, message: dict):
        """Broadcast to all connected admins"""
        disconnected = []
        for admin_id in list(self.connections.keys()):
            try:
                await self.connections[admin_id].send_json(message)
            except:
                disconnected.append(admin_id)
        
        for admin_id in disconnected:
            await self.disconnect(admin_id)
    
    def get_online_admins(self) -> list:
        """Get list of online admin IDs"""
        return list(self.connections.keys())
    
    def is_admin_online(self, admin_id: str) -> bool:
        """Check if admin is connected"""
        return admin_id in self.connections

# Global instance
manager = ConnectionManager()
```

### 1.2 Create WebSocket Endpoint (`backend/app/api/v1/endpoints/websocket.py`)

```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional
import json
from datetime import datetime

from app.core.websocket_manager import manager
from app.core.config import settings

router = APIRouter()

# Message handlers mapping
async def handle_auth(websocket: WebSocket, payload: dict) -> Optional[str]:
    """Authenticate WebSocket connection"""
    token = payload.get('token')
    # TODO: Implement JWT validation
    # For now, mock authentication
    admin_id = payload.get('admin_id', '1')
    return admin_id

async def handle_join_conversation(admin_id: str, payload: dict):
    """Join conversation room"""
    line_user_id = payload.get('line_user_id')
    room_id = f"conversation:{line_user_id}"
    await manager.join_room(admin_id, room_id)
    
    # Notify others in room
    await manager.broadcast_to_room(room_id, {
        'type': 'operator_joined',
        'payload': {'admin_id': admin_id, 'line_user_id': line_user_id},
        'timestamp': datetime.utcnow().isoformat()
    })

async def handle_leave_conversation(admin_id: str, payload: dict):
    """Leave conversation room"""
    line_user_id = payload.get('line_user_id')
    room_id = f"conversation:{line_user_id}"
    await manager.leave_room(admin_id, room_id)

async def handle_typing_start(admin_id: str, payload: dict):
    """Broadcast typing start"""
    line_user_id = payload.get('line_user_id')
    room_id = f"conversation:{line_user_id}"
    await manager.broadcast_to_room(room_id, {
        'type': 'typing_started',
        'payload': {'admin_id': admin_id, 'line_user_id': line_user_id},
        'timestamp': datetime.utcnow().isoformat()
    })

async def handle_typing_stop(admin_id: str, payload: dict):
    """Broadcast typing stop"""
    line_user_id = payload.get('line_user_id')
    room_id = f"conversation:{line_user_id}"
    await manager.broadcast_to_room(room_id, {
        'type': 'typing_stopped',
        'payload': {'admin_id': admin_id, 'line_user_id': line_user_id},
        'timestamp': datetime.utcnow().isoformat()
    })

async def handle_message_send(admin_id: str, payload: dict):
    """Handle message send (broadcast to room)"""
    line_user_id = payload.get('line_user_id')
    room_id = f"conversation:{line_user_id}"
    
    # Broadcast to all in conversation room
    await manager.broadcast_to_room(room_id, {
        'type': 'message_sent',
        'payload': {
            'admin_id': admin_id,
            'line_user_id': line_user_id,
            'message': payload.get('message'),
            'temp_id': payload.get('temp_id')
        },
        'timestamp': datetime.utcnow().isoformat()
    })

async def handle_ping(admin_id: str):
    """Handle heartbeat ping"""
    await manager.send_to_admin(admin_id, {
        'type': 'pong',
        'payload': {'timestamp': datetime.utcnow().isoformat()},
        'timestamp': datetime.utcnow().isoformat()
    })

@router.websocket("/ws/live-chat")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for live chat
    
    Connection flow:
    1. Client connects
    2. Server accepts
    3. Client sends auth message with token
    4. Server validates and registers connection
    5. Client can join conversation rooms
    """
    connection_id = await manager.connect(websocket)
    admin_id: Optional[str] = None
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_json()
            msg_type = data.get('type')
            payload = data.get('payload', {})
            
            # Handle auth first
            if msg_type == 'auth':
                admin_id = await handle_auth(websocket, payload)
                if admin_id:
                    await manager.register_connection(connection_id, admin_id, websocket)
                    await manager.send_to_admin(admin_id, {
                        'type': 'auth_success',
                        'payload': {'admin_id': admin_id},
                        'timestamp': datetime.utcnow().isoformat()
                    })
                else:
                    await websocket.send_json({
                        'type': 'auth_error',
                        'payload': {'message': 'Invalid token'},
                        'timestamp': datetime.utcnow().isoformat()
                    })
                    break
            
            # Require auth for other operations
            elif not admin_id:
                await websocket.send_json({
                    'type': 'error',
                    'payload': {'message': 'Not authenticated'},
                    'timestamp': datetime.utcnow().isoformat()
                })
            
            # Handle other message types
            elif msg_type == 'join_conversation':
                await handle_join_conversation(admin_id, payload)
            elif msg_type == 'leave_conversation':
                await handle_leave_conversation(admin_id, payload)
            elif msg_type == 'typing_start':
                await handle_typing_start(admin_id, payload)
            elif msg_type == 'typing_stop':
                await handle_typing_stop(admin_id, payload)
            elif msg_type == 'message_send':
                await handle_message_send(admin_id, payload)
            elif msg_type == 'ping':
                await handle_ping(admin_id)
            else:
                await manager.send_to_admin(admin_id, {
                    'type': 'error',
                    'payload': {'message': f'Unknown message type: {msg_type}'},
                    'timestamp': datetime.utcnow().isoformat()
                })
                
    except WebSocketDisconnect:
        if admin_id:
            await manager.disconnect(admin_id)
    except Exception as e:
        if admin_id:
            await manager.disconnect(admin_id)
```

### 1.3 Update API Router (`backend/app/api/v1/api.py`)

```python
from fastapi import APIRouter
from app.api.v1.endpoints import (
    webhook, liff, locations, media,
    admin_users, admin_requests, admin_auto_replies,
    admin_intents, admin_live_chat, admin_reply_objects,
    admin_friends, admin_credentials, settings, rich_menus,
    websocket  # Add this
)

api_router = APIRouter()

# ... existing routes ...

# WebSocket endpoint
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])
```

## Phase 2: Frontend Implementation

### 2.1 Create WebSocket Types (`frontend/lib/websocket/types.ts`)

```typescript
export enum MessageType {
  // Client -> Server
  AUTH = 'auth',
  JOIN_CONVERSATION = 'join_conversation',
  LEAVE_CONVERSATION = 'leave_conversation',
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',
  MESSAGE_SEND = 'message_send',
  PING = 'ping',
  
  // Server -> Client
  AUTH_SUCCESS = 'auth_success',
  AUTH_ERROR = 'auth_error',
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_SENT = 'message_sent',
  TYPING_STARTED = 'typing_started',
  TYPING_STOPPED = 'typing_stopped',
  CONVERSATION_UPDATED = 'conversation_updated',
  OPERATOR_JOINED = 'operator_joined',
  OPERATOR_LEFT = 'operator_left',
  PONG = 'pong',
  ERROR = 'error'
}

export interface WebSocketMessage {
  type: MessageType;
  payload: unknown;
  timestamp: string;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface UseWebSocketOptions {
  url: string;
  token?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export interface UseWebSocketReturn {
  sendMessage: (type: MessageType, payload: unknown) => void;
  joinConversation: (lineUserId: string) => void;
  leaveConversation: (lineUserId: string) => void;
  startTyping: (lineUserId: string) => void;
  stopTyping: (lineUserId: string) => void;
  connectionState: ConnectionState;
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
}
```

### 2.2 Create Reconnect Strategy (`frontend/lib/websocket/reconnectStrategy.ts`)

```typescript
export interface ReconnectStrategy {
  getDelay(attempt: number): number;
  shouldRetry(attempt: number): boolean;
}

export class ExponentialBackoffStrategy implements ReconnectStrategy {
  constructor(
    private baseDelay: number = 1000,
    private maxDelay: number = 30000,
    private maxAttempts: number = 10,
    private jitter: boolean = true
  ) {}

  getDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      this.baseDelay * Math.pow(2, attempt),
      this.maxDelay
    );
    
    if (this.jitter) {
      // Add random jitter (0-1000ms) to prevent thundering herd
      return exponentialDelay + Math.random() * 1000;
    }
    
    return exponentialDelay;
  }

  shouldRetry(attempt: number): boolean {
    return attempt < this.maxAttempts;
  }
}

export class FixedIntervalStrategy implements ReconnectStrategy {
  constructor(
    private interval: number = 5000,
    private maxAttempts: number = 10
  ) {}

  getDelay(): number {
    return this.interval;
  }

  shouldRetry(attempt: number): boolean {
    return attempt < this.maxAttempts;
  }
}
```

### 2.3 Create Message Queue (`frontend/lib/websocket/messageQueue.ts`)

```typescript
import { MessageType, WebSocketMessage } from './types';

interface QueuedMessage {
  id: string;
  type: MessageType;
  payload: unknown;
  timestamp: number;
  retries: number;
}

export class MessageQueue {
  private queue: QueuedMessage[] = [];
  private maxRetries = 3;

  enqueue(type: MessageType, payload: unknown): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.queue.push({
      id,
      type,
      payload,
      timestamp: Date.now(),
      retries: 0
    });
    return id;
  }

  dequeue(): QueuedMessage | undefined {
    return this.queue.shift();
  }

  peek(): QueuedMessage | undefined {
    return this.queue[0];
  }

  requeue(message: QueuedMessage): boolean {
    if (message.retries < this.maxRetries) {
      message.retries++;
      this.queue.unshift(message);
      return true;
    }
    return false;
  }

  getPending(): QueuedMessage[] {
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
  }

  get length(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }
}
```

### 2.4 Create WebSocket Client (`frontend/lib/websocket/client.ts`)

```typescript
import { 
  MessageType, 
  WebSocketMessage, 
  ConnectionState, 
  UseWebSocketOptions 
} from './types';
import { ExponentialBackoffStrategy } from './reconnectStrategy';
import { MessageQueue } from './messageQueue';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token?: string;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempt = 0;
  private reconnectStrategy = new ExponentialBackoffStrategy();
  private messageQueue = new MessageQueue();
  private heartbeatInterval?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;
  
  private onMessage?: (message: WebSocketMessage) => void;
  private onConnect?: () => void;
  private onDisconnect?: () => void;
  private onError?: (error: Error) => void;
  
  private heartbeatIntervalMs = 30000;
  private maxReconnectAttempts = 10;

  constructor(options: UseWebSocketOptions) {
    this.url = options.url;
    this.token = options.token;
    this.onMessage = options.onMessage;
    this.onConnect = options.onConnect;
    this.onDisconnect = options.onDisconnect;
    this.onError = options.onError;
    
    if (options.heartbeatInterval) {
      this.heartbeatIntervalMs = options.heartbeatInterval;
    }
    if (options.maxReconnectAttempts) {
      this.maxReconnectAttempts = options.maxReconnectAttempts;
    }
  }

  connect(): void {
    if (this.state === 'connecting' || this.state === 'connected') {
      return;
    }

    this.state = 'connecting';
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onclose = () => this.handleClose();
      this.ws.onerror = (error) => this.handleError(error);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private handleOpen(): void {
    this.state = 'connected';
    this.reconnectAttempt = 0;
    
    // Send auth message
    this.send(MessageType.AUTH, { token: this.token, admin_id: '1' });
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Process queued messages
    this.processQueue();
    
    this.onConnect?.();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Handle pong
      if (message.type === MessageType.PONG) {
        return;
      }
      
      this.onMessage?.(message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleClose(): void {
    this.stopHeartbeat();
    this.ws = null;
    
    if (this.state === 'connected') {
      this.state = 'disconnected';
      this.onDisconnect?.();
      
      // Attempt reconnect
      this.attemptReconnect();
    }
  }

  private handleError(error: Error): void {
    this.onError?.(error);
    
    if (this.state === 'connecting') {
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempt >= this.maxReconnectAttempts) {
      this.state = 'disconnected';
      return;
    }

    this.state = 'reconnecting';
    this.reconnectAttempt++;
    
    const delay = this.reconnectStrategy.getDelay(this.reconnectAttempt);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.state === 'connected') {
        this.send(MessageType.PING, {});
      }
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  private processQueue(): void {
    while (!this.messageQueue.isEmpty() && this.state === 'connected') {
      const message = this.messageQueue.dequeue();
      if (message) {
        this.sendRaw(message.type, message.payload);
      }
    }
  }

  send(type: MessageType, payload: unknown): void {
    if (this.state === 'connected' && this.ws) {
      this.sendRaw(type, payload);
    } else {
      // Queue message if not connected
      this.messageQueue.enqueue(type, payload);
    }
  }

  private sendRaw(type: MessageType, payload: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.state = 'disconnected';
    this.reconnectAttempt = 0;
  }

  getState(): ConnectionState {
    return this.state;
  }

  getReconnectAttempt(): number {
    return this.reconnectAttempt;
  }

  isConnected(): boolean {
    return this.state === 'connected';
  }
}
```

### 2.5 Create useWebSocket Hook (`frontend/hooks/useWebSocket.ts`)

```typescript
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { WebSocketClient } from '@/lib/websocket/client';
import { 
  MessageType, 
  WebSocketMessage, 
  ConnectionState, 
  UseWebSocketOptions,
  UseWebSocketReturn 
} from '@/lib/websocket/types';

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const clientRef = useRef<WebSocketClient | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const client = new WebSocketClient({
      ...options,
      onConnect: () => {
        setConnectionState('connected');
        setReconnectAttempts(0);
        options.onConnect?.();
      },
      onDisconnect: () => {
        setConnectionState('disconnected');
        options.onDisconnect?.();
      },
      onMessage: options.onMessage,
      onError: options.onError
    });

    clientRef.current = client;
    client.connect();

    // Update state periodically
    const interval = setInterval(() => {
      if (clientRef.current) {
        setConnectionState(clientRef.current.getState());
        setReconnectAttempts(clientRef.current.getReconnectAttempt());
      }
    }, 100);

    return () => {
      clearInterval(interval);
      client.disconnect();
      clientRef.current = null;
    };
  }, [options.url, options.token]);

  const sendMessage = useCallback((type: MessageType, payload: unknown) => {
    clientRef.current?.send(type, payload);
  }, []);

  const joinConversation = useCallback((lineUserId: string) => {
    sendMessage(MessageType.JOIN_CONVERSATION, { line_user_id: lineUserId });
  }, [sendMessage]);

  const leaveConversation = useCallback((lineUserId: string) => {
    sendMessage(MessageType.LEAVE_CONVERSATION, { line_user_id: lineUserId });
  }, [sendMessage]);

  const startTyping = useCallback((lineUserId: string) => {
    sendMessage(MessageType.TYPING_START, { line_user_id: lineUserId });
  }, [sendMessage]);

  const stopTyping = useCallback((lineUserId: string) => {
    sendMessage(MessageType.TYPING_STOP, { line_user_id: lineUserId });
  }, [sendMessage]);

  return {
    sendMessage,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    connectionState,
    isConnected: connectionState === 'connected',
    isReconnecting: connectionState === 'reconnecting',
    reconnectAttempts
  };
}
```

## Phase 3: Integration with Live Chat Page

### 3.1 Update Live Chat Page to use WebSocket

Key changes needed:
1. Remove polling intervals (`setInterval`)
2. Add WebSocket connection
3. Handle real-time message updates
4. Add typing indicators
5. Handle connection state UI

```typescript
// Key integration points in page.tsx

export default function LiveChatPage() {
  // ... existing state ...
  
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  const { 
    joinConversation, 
    leaveConversation, 
    startTyping, 
    stopTyping,
    isConnected,
    isReconnecting 
  } = useWebSocket({
    url: `wss://${window.location.host}/api/v1/ws/live-chat`,
    onMessage: (message) => {
      switch (message.type) {
        case MessageType.MESSAGE_RECEIVED:
          // Add new message to chat
          handleNewMessage(message.payload);
          break;
        case MessageType.TYPING_STARTED:
          setTypingUsers(prev => new Set(prev).add(message.payload.admin_id));
          break;
        case MessageType.TYPING_STOPPED:
          setTypingUsers(prev => {
            const next = new Set(prev);
            next.delete(message.payload.admin_id);
            return next;
          });
          break;
        case MessageType.CONVERSATION_UPDATED:
          // Refresh conversation list
          fetchConversations();
          break;
      }
    }
  });

  // Join conversation room when selected
  useEffect(() => {
    if (selectedId && isConnected) {
      joinConversation(selectedId);
      return () => leaveConversation(selectedId);
    }
  }, [selectedId, isConnected]);

  // Remove polling intervals
  // useEffect(() => {
  //   const interval = setInterval(fetchConversations, 5000);
  //   return () => clearInterval(interval);
  // }, [filterStatus]);
}
```

## Implementation Checklist

### Backend
- [ ] Create `backend/app/core/websocket_manager.py`
- [ ] Create `backend/app/api/v1/endpoints/websocket.py`
- [ ] Update `backend/app/api/v1/api.py` to include WebSocket router
- [ ] Test WebSocket endpoint with WebSocket client (e.g., Postman, wscat)

### Frontend
- [ ] Create `frontend/lib/websocket/types.ts`
- [ ] Create `frontend/lib/websocket/reconnectStrategy.ts`
- [ ] Create `frontend/lib/websocket/messageQueue.ts`
- [ ] Create `frontend/lib/websocket/client.ts`
- [ ] Create `frontend/hooks/useWebSocket.ts`
- [ ] Update `frontend/app/admin/live-chat/page.tsx`

### Testing
- [ ] Test connection/reconnection
- [ ] Test message broadcasting
- [ ] Test typing indicators
- [ ] Test multiple admin connections
- [ ] Test offline message queue
