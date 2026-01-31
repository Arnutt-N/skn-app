---
name: websocket-live-chat
description: Standards for implementing WebSocket-based real-time live chat.
---

# WebSocket Live Chat Standards

## References
- **Message Protocol Details**: See [references/protocol.md](references/protocol.md)
- **Error Codes Reference**: See [references/error_codes.md](references/error_codes.md)

---

## 1. Architecture Overview

```
Client → WSS Connect → Auth (JWT) → Join Room (conversation:{id}) ←→ Message Exchange
                                    ↓
                              Redis Pub/Sub (Multi-instance sync)
```

**Room Pattern**: `conversation:{line_user_id}` — One room per user conversation with User + Agent(s) participation.

---

## 2. Connection Lifecycle

| Phase | Action | Timeout |
|-------|--------|---------|
| 1. Connect | `wss://api.domain.com/ws/chat` | 30s handshake |
| 2. Auth | Send `auth` message with JWT | 10s |
| 3. Join | Send `join_room` with conversation_id | 5s |
| 4. Active | Exchange messages | Heartbeat 30s |
| 5. Disconnect | Clean close or timeout | — |

---

## 3. Message Types (Summary)

```typescript
interface WSMessage {
  type: 'auth' | 'join_room' | 'send_message' | 'typing' | 'message_ack' | 'error' | 'ping' | 'new_message';
  payload: unknown;
  message_id?: string;  // UUID for ACK tracking
  timestamp: string;    // ISO 8601
}
```

> **Full protocol spec**: [references/protocol.md](references/protocol.md)

---

## 4. Backend Implementation

```python
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.room_subscribers: Dict[str, Set[str]] = {}
        self.redis_client = redis.from_url("redis://localhost:6379")
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
    
    async def disconnect(self, client_id: str):
        for room_id, members in self.room_subscribers.items():
            members.discard(client_id)
        self.active_connections.pop(client_id, None)
    
    async def join_room(self, client_id: str, room_id: str):
        if room_id not in self.room_subscribers:
            self.room_subscribers[room_id] = set()
            await self.redis_client.subscribe(f"room:{room_id}")
        self.room_subscribers[room_id].add(client_id)
    
    async def broadcast_to_room(self, room_id: str, message: dict):
        await self.redis_client.publish(f"room:{room_id}", json.dumps(message))
        if room_id in self.room_subscribers:
            for client_id in list(self.room_subscribers[room_id]):
                if client_id in self.active_connections:
                    try:
                        await self.active_connections[client_id].send_json(message)
                    except:
                        await self.disconnect(client_id)

@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket, token_service: TokenService = Depends(get_token_service)):
    client_id = current_user = None
    joined_rooms: Set[str] = set()
    
    try:
        await websocket.accept()
        auth_msg = await asyncio.wait_for(websocket.receive_json(), timeout=10.0)
        
        if auth_msg.get("type") != "auth":
            await websocket.close(code=4001)
            return
        
        try:
            current_user = await token_service.verify_token(auth_msg["payload"]["token"])
            client_id = f"{current_user.id}:{uuid.uuid4().hex[:8]}"
            await manager.connect(websocket, client_id)
            await websocket.send_json({
                "type": "auth", "payload": {"success": True, "user_id": current_user.id}
            })
        except:
            await websocket.close(code=4001)
            return
        
        while True:
            try:
                msg = await asyncio.wait_for(websocket.receive_json(), timeout=30.0)
                msg_type, payload, msg_id = msg.get("type"), msg.get("payload", {}), msg.get("message_id")
                
                if msg_type == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})
                
                elif msg_type == "join_room":
                    room_id = f"conversation:{payload['conversation_id']}"
                    await manager.join_room(client_id, room_id)
                    joined_rooms.add(room_id)
                    await websocket.send_json({
                        "type": "message_ack", "payload": {"message_id": msg_id, "status": "received"}
                    })
                
                elif msg_type == "send_message":
                    room_id = f"conversation:{payload.get('conversation_id', list(joined_rooms)[0].split(':')[1])}"
                    if room_id not in joined_rooms:
                        await websocket.send_json({
                            "type": "error", "payload": {"code": "NOT_IN_ROOM", "message": "Join room first", "retryable": True}
                        })
                        continue
                    
                    new_msg = await save_message(room_id.split(":")[1], current_user.id, payload["content"], payload.get("content_type", "text"))
                    await websocket.send_json({"type": "message_ack", "payload": {"message_id": msg_id, "status": "received"}})
                    await manager.broadcast_to_room(room_id, {
                        "type": "new_message",
                        "payload": {"message_id": new_msg.id, "sender_id": current_user.id, "content": payload["content"],
                                   "content_type": payload.get("content_type", "text"), "conversation_id": room_id.split(":")[1],
                                   "created_at": new_msg.created_at.isoformat()}
                    })
                
                elif msg_type == "typing":
                    await manager.broadcast_to_room(f"conversation:{payload['conversation_id']}", {
                        "type": "typing", "payload": {"user_id": current_user.id, "is_typing": payload["is_typing"]}
                    })
                    
            except asyncio.TimeoutError:
                try:
                    await websocket.send_json({"type": "ping", "timestamp": datetime.utcnow().isoformat()})
                except:
                    break
                    
    except WebSocketDisconnect:
        pass
    finally:
        if client_id:
            await manager.disconnect(client_id)
```

---

## 5. Frontend Implementation (React Hook)

```typescript
export function useLiveChatSocket({ conversationId, onNewMessage, onTyping }: UseLiveChatSocketProps) {
  const { data: session } = useSession();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const pendingMessagesRef = useRef<Map<string, any>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_BASE_DELAY = 1000;
  const MESSAGE_TIMEOUT = 10000;
  const generateId = () => crypto.randomUUID();

  const connect = useCallback(() => {
    if (!session?.accessToken || !conversationId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    setIsConnecting(true);
    setError(null);
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/chat`);
    wsRef.current = ws;
    
    ws.onopen = () => {
      ws.send(JSON.stringify({type: 'auth', payload: {token: session.accessToken},
        message_id: generateId(), timestamp: new Date().toISOString()}));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'auth':
          if (data.payload.success) {
            ws.send(JSON.stringify({type: 'join_room', payload: {conversation_id: conversationId},
              message_id: generateId(), timestamp: new Date().toISOString()}));
          }
          break;
        case 'message_ack':
          if (data.payload?.message_id) pendingMessagesRef.current.delete(data.payload.message_id);
          if (!isConnected) { setIsConnected(true); setIsConnecting(false); reconnectAttemptsRef.current = 0; }
          break;
        case 'new_message':
          onNewMessage?.(data.payload);
          ws.send(JSON.stringify({type: 'message_ack',
            payload: {message_id: data.payload.message_id, status: 'read'},
            timestamp: new Date().toISOString()}));
          break;
        case 'typing':
          onTyping?.(data.payload.user_id, data.payload.is_typing);
          break;
        case 'error':
          if (!data.payload.retryable) { setError(data.payload.message); ws.close(); }
          break;
      }
    };
    
    ws.onclose = (event) => {
      setIsConnected(false);
      setIsConnecting(false);
      wsRef.current = null;
      if (event.code === 4001) { setError('Authentication failed. Please login again.'); return; }
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(connect, RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttemptsRef.current++));
      } else {
        setError('Max reconnection attempts reached');
      }
    };
  }, [session?.accessToken, conversationId, isConnected, onNewMessage, onTyping]);

  const sendMessage = useCallback((content: string, contentType = 'text') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) throw new Error('WebSocket not connected');
    const messageId = generateId();
    const message = {type: 'send_message', payload: {content, content_type: contentType, conversation_id: conversationId},
      message_id: messageId, timestamp: new Date().toISOString()};
    pendingMessagesRef.current.set(messageId, {message, retries: 0});
    wsRef.current.send(JSON.stringify(message));
    setTimeout(() => {
      const pending = pendingMessagesRef.current.get(messageId);
      if (pending?.retries < 3) { pending.retries++; wsRef.current?.send(JSON.stringify(message)); }
      else if (pending) { pendingMessagesRef.current.delete(messageId); setError('Message delivery failed'); }
    }, MESSAGE_TIMEOUT);
  }, [conversationId]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({type: 'typing',
        payload: {conversation_id: conversationId, is_typing: isTyping},
        timestamp: new Date().toISOString()}));
    }
  }, [conversationId]);

  const reconnect = useCallback(() => { reconnectAttemptsRef.current = 0; wsRef.current?.close(); connect(); }, [connect]);

  useEffect(() => { connect(); return () => { wsRef.current?.close(); pendingMessagesRef.current.clear(); }; }, [connect]);

  return {isConnected, isConnecting, error, sendMessage, sendTyping, reconnect};
}

// Usage
export function ChatWindow({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const {isConnected, isConnecting, error, sendMessage, sendTyping} = useLiveChatSocket({
    conversationId,
    onNewMessage: (msg) => setMessages(prev => [...prev, msg]),
    onTyping: (userId, isTyping) => console.log(`${userId} is typing: ${isTyping}`)
  });

  const handleSend = () => { if (input.trim()) { sendMessage(input); setInput(''; } };

  return (
    <div className="chat-container">
      <div className="status-bar">
        {isConnecting && <span>Connecting...</span>}
        {isConnected && <span>Connected</span>}
        {error && <span>{error}</span>}
      </div>
      <div className="messages">
        {messages.map(msg => <div key={msg.id}>{msg.content}</div>)}
      </div>
      <input value={input} onChange={(e) => { setInput(e.target.value); sendTyping(true); }}
        onBlur={() => sendTyping(false)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
      <button onClick={handleSend} disabled={!isConnected}>Send</button>
    </div>
  );
}
```

---

## 6. Error Handling Summary

| Code | Description | Action |
|------|-------------|--------|
| `4001` | Auth failed | Redirect to login |
| `4008` | Rate limited | Wait 1s, retry |
| `4005` | Not in room | Auto-retry join |
| `4100` | Server error | Reconnect with backoff |

> **Full error reference**: [references/error_codes.md](references/error_codes.md)

**Reconnection Strategy**: `0ms → 1s → 2s → 4s → 8s → (stop, manual reconnect)`

---

## 7. Security Considerations

- **Authentication**: Validate JWT on `auth` message before any operations
- **Authorization**: Verify user has access to conversation before `join_room`
- **Rate Limiting**: Limit to 30 messages/minute per user
- **Input Validation**: Sanitize all content (XSS prevention)
- **Connection Limits**: Max 1 connection per user per device
- **WSS Only**: Use secure WebSocket in production

---

## 8. Message Delivery Guarantees

### ACK Pattern
```
Client ──send_message──> Server
Client <─message_ack──── Server  (received)
Client <─new_message──── Server  (broadcast)
Client ──message_ack───> Server  (read)
```

- Client retry: 3 attempts with 10s timeout
- Server persistence: Store messages in DB before broadcasting
- Offline handling: Queue messages for disconnected users
