# WebSocket Live Chat Enhancement TODO

**Created**: 2026-01-29  
**Status**: Pending Implementation  
**Priority**: P1 (High) → P3 (Low)

---

## P1 - Critical (Before Production)

### Security & Authentication
- [ ] **JWT Validation for WebSocket Auth**
  - File: `backend/app/api/v1/endpoints/ws_live_chat.py`
  - Replace mock `admin_id=1` with real JWT token validation
  - Extract and verify token from query param or auth message
  - Return proper error on invalid/expired token

- [ ] **Rate Limiting on WebSocket Messages**
  - File: `backend/app/core/websocket_manager.py` or new middleware
  - Limit messages per second per connection
  - Prevent spam/flood attacks
  - Configurable limits per message type

- [ ] **Input Validation & Sanitization**
  - File: `backend/app/schemas/ws_events.py`
  - Strict validation on all incoming payloads
  - Sanitize message content (XSS prevention)
  - Max message length enforcement

---

## P2 - Important (Post-Production)

### Monitoring & Observability
- [ ] **WebSocket Metrics Collection**
  - File: `backend/app/core/websocket_metrics.py` (new)
  - Active connections count
  - Messages per second (in/out)
  - Connection duration histogram
  - Error rate tracking
  - Room occupancy stats

- [ ] **Health Check Endpoint**
  - File: `backend/app/api/v1/endpoints/health.py` (new)
  - WebSocket service health status
  - Connection pool status
  - Integration with monitoring tools (Prometheus)

- [ ] **Structured Logging**
  - File: Update logging in `ws_live_chat.py`, `websocket_manager.py`
  - JSON format logs
  - Correlation IDs for tracing
  - Log levels: connection events, errors, security events

### Testing
- [ ] **E2E Tests with Playwright**
  - File: `frontend/e2e/live-chat.spec.ts` (new)
  - Full user journey: connect → auth → join room → send message
  - Reconnection scenario tests
  - Multi-tab synchronization tests
  - Typing indicator tests

- [ ] **Load Testing**
  - File: `backend/tests/load/test_websocket_load.py` (new)
  - Concurrent connections (100, 500, 1000+)
  - Message throughput testing
  - Memory leak detection
  - Tools: Locust, k6, or Artillery

- [ ] **Reconnection Test Scenarios**
  - Network interruption
  - Server restart
  - Browser sleep/wake
  - Mobile background/foreground

---

## P3 - Nice to Have (Future)

### Features
- [ ] **Message History Pagination**
  - File: `backend/app/services/live_chat_service.py`
  - Load more messages on scroll
  - Cursor-based pagination
  - Frontend infinite scroll

- [ ] **File Attachment Support**
  - File: `backend/app/api/v1/endpoints/ws_live_chat.py`
  - Image/file upload via WebSocket or REST
  - Progress tracking
  - File type validation
  - Storage integration (S3, etc.)

- [ ] **Message Search**
  - File: `backend/app/services/live_chat_service.py`
  - Full-text search in conversation
  - Elasticsearch or PostgreSQL text search
  - Frontend search UI

- [ ] **Unread Message Indicators**
  - File: `backend/app/models/message.py` (add read_at field)
  - Track read status per operator
  - Unread count badges
  - Mark as read on view

- [ ] **Message Reactions**
  - Like, emoji reactions to messages
  - Real-time reaction updates

### Performance & Scaling
- [ ] **Redis Pub/Sub for Multi-Server**
  - File: `backend/app/core/websocket_pubsub.py` (new)
  - Broadcast across multiple server instances
  - Redis adapter for socket.io or custom implementation
  - Required for horizontal scaling

- [ ] **Message Compression**
  - Enable `permessage-deflate` extension
  - Reduce bandwidth for large messages
  - Configurable compression level

- [ ] **Connection Pool Optimization**
  - Review and optimize `websocket_manager.py`
  - Memory usage optimization
  - Cleanup stale connections
  - Connection limits per admin

### Developer Experience
- [ ] **WebSocket API Documentation**
  - OpenAPI/Swagger for WebSocket events
  - Example message payloads
  - Sequence diagrams

- [ ] **Debug/Admin Panel**
  - WebSocket connection viewer
  - Real-time metrics dashboard
  - Broadcast test tool

---

## Implementation Notes

### JWT Auth Implementation Sketch
```python
# backend/app/api/v1/endpoints/ws_live_chat.py
async def handle_auth(websocket: WebSocket, payload: dict) -> Optional[str]:
    token = payload.get("token")
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return str(payload.get("sub"))
    except jwt.ExpiredSignatureError:
        await ws_manager.send_personal(websocket, {
            "type": "auth_error",
            "payload": {"message": "Token expired"}
        })
        return None
```

### Rate Limiting Sketch
```python
# backend/app/core/rate_limiter.py
class WebSocketRateLimiter:
    def __init__(self, max_messages: int = 30, window: int = 60):
        self.max_messages = max_messages
        self.window = window
        self.buckets: Dict[str, List[float]] = {}
    
    def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        bucket = self.buckets.get(client_id, [])
        # Remove old entries
        bucket = [t for t in bucket if now - t < self.window]
        if len(bucket) >= self.max_messages:
            return False
        bucket.append(now)
        self.buckets[client_id] = bucket
        return True
```

### Redis Pub/Sub Sketch
```python
# backend/app/core/websocket_pubsub.py
class RedisPubSub:
    def __init__(self, redis_url: str):
        self.redis = aioredis.from_url(redis_url)
        self.pubsub = self.redis.pubsub()
    
    async def subscribe(self, room_id: str):
        await self.pubsub.subscribe(f"room:{room_id}")
    
    async def publish(self, room_id: str, message: dict):
        await self.redis.publish(f"room:{room_id}", json.dumps(message))
```

---

## Dependencies to Add

```txt
# backend/requirements.txt (for future enhancements)
redis>=5.0.0          # For Pub/Sub
aioredis>=2.0.0       # Async Redis client
prometheus-client>=0.19.0  # Metrics
structlog>=24.1.0     # Structured logging
```

```json
// frontend/package.json (for E2E tests)
{
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

---

## Estimated Effort

| Category | Tasks | Est. Days |
|----------|-------|-----------|
| P1 - Security | 3 | 2-3 |
| P2 - Monitoring | 3 | 3-4 |
| P2 - Testing | 3 | 4-5 |
| P3 - Features | 5 | 7-10 |
| P3 - Performance | 3 | 5-7 |
| **Total** | **17** | **21-29 days** |

---

## Related Files

- Original Plan: `PRPs/claude_code/websocket-live-chat-architecture.plan.md`
- Implementation Summary: `project-log-md/kilo_code/session-summary-20260129-websocket-implementation.md`
- Review Report: `project-log-md/claude_code/websocket-live-chat-review-report.md`
