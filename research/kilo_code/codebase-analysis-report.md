# 🔍 รายงานการวิเคราะห์ Codebase: JskApp - LINE Official Account System

**วันที่วิเคราะห์:** 2026-01-29  
**ผู้วิเคราะห์:** Kilo Code  
**โปรเจกต์:** JskApp - Community Justice Services

---

## 📋 ภาพรวมโปรเจกต์

**JskApp** เป็นระบบ LINE Official Account สำหรับงานบริการยุติธรรมชุมชน (Community Justice Services) พัฒนาด้วย FastAPI + Next.js รองรับการทำงานแบบ Chatbot และ Live Chat Handoff

### 🎯 วัตถุประสงค์หลัก
1. ให้บริการข้อมูลกฎหมายผ่าน LINE OA แบบอัตโนมัติ
2. รับคำขอบริการยุติธรรมผ่าน LIFF (LINE Front-end Framework)
3. ระบบ Live Chat สำหรับติดต่อเจ้าหน้าที่
4. จัดการ Rich Menu และ Broadcast Messaging

---

## 🏗️ Tech Stack

| ส่วน | เทคโนโลยี | รายละเอียด |
|------|-----------|------------|
| **Backend** | FastAPI (Python 3.12) | Async SQLAlchemy, Alembic Migrations |
| **Database** | PostgreSQL 16 | JSONB สำหรับ flexible data |
| **Cache** | Redis 7 | Rate limiting & caching |
| **Frontend** | Next.js 16.1.1 | App Router, React 19.2.3, TypeScript |
| **Styling** | Tailwind CSS v4 | Custom components |
| **LINE SDK** | line-bot-sdk v3 | Messaging API + LIFF |
| **Icons** | Lucide React | v0.473.0 |
| **Charts** | Recharts | v2.15.0 |

---

## 🗄️ Database Schema

### ตารางหลักทั้งหมด

```
┌─────────────────────────────────────────────────────────────────┐
│                        CORE TABLES                              │
├─────────────────────────────────────────────────────────────────┤
│ users              - ผู้ใช้งาน (LINE users + Admin users)        │
│ organizations      - หน่วยงาน/องค์กร                            │
│ credentials        - ข้อมูลรับรอง (LINE, Telegram, etc.)        │
│ system_settings    - การตั้งค่าระบบ                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     SERVICE REQUEST TABLES                      │
├─────────────────────────────────────────────────────────────────┤
│ service_requests   - คำขอบริการจากประชาชน                       │
│ bookings           - การนัดหมาย                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      CHATBOT TABLES                             │
├─────────────────────────────────────────────────────────────────┤
│ intent_categories  - หมวดหมู่ Intent                            │
│ intent_keywords    - คำสำคัญสำหรับ matching                     │
│ intent_responses   - คำตอบของแต่ละ Intent                       │
│ auto_replies       - Auto-reply rules (Legacy)                  │
│ reply_objects      - Reusable message templates                 │
│ rich_menus         - LINE Rich Menu configuration               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      LIVE CHAT TABLES                           │
├─────────────────────────────────────────────────────────────────┤
│ chat_sessions      - เซสชันการสนทนา                             │
│ messages           - ข้อความ (INCOMING/OUTGOING)                │
│ chat_analytics     - สถิติการสนทนา                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     GEOGRAPHY TABLES                            │
├─────────────────────────────────────────────────────────────────┤
│ provinces          - จังหวัด                                    │
│ districts          - อำเภอ/เขต                                  │
│ sub_districts      - ตำบล/แขวง                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      MEDIA TABLES                               │
├─────────────────────────────────────────────────────────────────┤
│ media_files        - ไฟล์มีเดีย (BLOB storage)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ service_requests : submits
    users ||--o{ bookings : creates
    users ||--o{ chat_sessions : operates
    users }o--|| organizations : belongs_to
    users ||--o{ messages : sends
    
    service_requests {
        int id PK
        int requester_id FK
        string line_user_id
        string requester_name
        string phone_number
        string email
        string agency
        string province
        string district
        string sub_district
        string prefix
        string firstname
        string lastname
        string topic_category
        string topic_subcategory
        jsonb attachments
        text description
        enum status
        enum priority
        int assigned_agent_id FK
        datetime due_date
        datetime completed_at
    }
    
    users {
        int id PK
        string line_user_id UK
        string username UK
        string email UK
        string hashed_password
        string display_name
        string picture_url
        enum role
        enum chat_mode
        string friend_status
        datetime friend_since
        datetime last_message_at
        int organization_id FK
    }
    
    chat_sessions {
        int id PK
        string line_user_id
        int operator_id FK
        enum status
        datetime started_at
        datetime claimed_at
        datetime closed_at
        int message_count
        string closed_by
    }
    
    messages {
        int id PK
        string line_user_id
        enum direction
        string message_type
        text content
        jsonb payload
        datetime created_at
    }
    
    intent_categories ||--o{ intent_keywords : contains
    intent_categories ||--o{ intent_responses : has
    
    intent_categories {
        int id PK
        string name UK
        text description
        boolean is_active
    }
    
    intent_keywords {
        int id PK
        int category_id FK
        string keyword
        enum match_type
    }
    
    intent_responses {
        int id PK
        int category_id FK
        enum reply_type
        text text_content
        uuid media_id FK
        jsonb payload
        boolean is_active
    }
```

---

## 🔌 Backend Architecture (FastAPI)

### Project Structure
```
backend/
├── app/
│   ├── main.py                 # FastAPI app entry point
│   ├── core/
│   │   ├── config.py           # Settings & environment
│   │   └── line_client.py      # LINE SDK singleton
│   ├── api/
│   │   ├── deps.py             # Dependency injection
│   │   └── v1/
│   │       ├── api.py          # Router aggregation
│   │       └── endpoints/
│   │           ├── webhook.py       # LINE webhook
│   │           ├── liff.py          # LIFF endpoints
│   │           ├── admin_live_chat.py
│   │           ├── admin_requests.py
│   │           ├── admin_intents.py
│   │           ├── admin_auto_replies.py
│   │           ├── admin_reply_objects.py
│   │           ├── rich_menus.py
│   │           ├── admin_users.py
│   │           ├── settings.py
│   │           ├── locations.py
│   │           └── media.py
│   ├── models/                 # SQLAlchemy models
│   ├── schemas/                # Pydantic schemas
│   ├── services/               # Business logic
│   ├── db/                     # Database session
│   └── utils/                  # Utilities
├── alembic/versions/           # Migrations
└── uploads/                    # File storage
```

### API Endpoints

#### LINE Webhook (`/api/v1/line/webhook`)
```python
@router.post("/webhook")
async def line_webhook(request: Request, 
                       background_tasks: BackgroundTasks,
                       x_line_signature: str = Header(None))
```

**Flow:**
1. Validate LINE Signature (`X-Line-Signature`)
2. Parse events using `WebhookParser`
3. Process in background task
4. Handle `MessageEvent` และ `PostbackEvent`

#### LIFF Endpoints (`/api/v1/liff/*`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/service-requests` | POST | สร้างคำขอบริการจาก LIFF |

#### Admin Endpoints
| Endpoint | Features |
|----------|----------|
| `/admin/live-chat/conversations` | List all conversations |
| `/admin/live-chat/conversations/{id}` | Get conversation detail |
| `/admin/live-chat/conversations/{id}/messages` | Send message |
| `/admin/live-chat/conversations/{id}/claim` | Claim session |
| `/admin/live-chat/conversations/{id}/close` | Close session |
| `/admin/live-chat/conversations/{id}/mode` | Toggle BOT/HUMAN |
| `/admin/live-chat/analytics` | Chat statistics |
| `/admin/requests` | Service request CRUD |
| `/admin/requests/stats` | Dashboard statistics |
| `/admin/intents/categories` | Intent management |
| `/admin/reply-objects` | Message templates |
| `/admin/rich-menus` | Rich menu CRUD |
| `/admin/rich-menus/{id}/sync` | Sync to LINE |
| `/admin/rich-menus/{id}/publish` | Set as default menu |

### Services Layer

#### 1. LineService (`app/services/line_service.py`)
```python
class LineService:
    async def reply_text(reply_token, text)
    async def reply_flex(reply_token, alt_text, contents)
    async def reply_messages(reply_token, messages)
    async def show_loading_animation(chat_id, loading_seconds)
    async def save_message(db, line_user_id, direction, message_type, content)
```

#### 2. LiveChatService (`app/services/live_chat_service.py`)
```python
class LiveChatService:
    async def initiate_handoff(user, reply_token, db)
    async def claim_session(line_user_id, operator_id, db)
    async def close_session(line_user_id, closed_by, db)
    async def send_message(line_user_id, text, operator_id, db)
    async def get_conversations(status, db)
    async def get_analytics(from_date, to_date, operator_id, db)
```

#### 3. TelegramService (`app/services/telegram_service.py`)
```python
class TelegramService:
    async def send_handoff_notification(user_display_name, 
                                        user_picture_url, 
                                        recent_messages, 
                                        admin_panel_url, db)
```

#### 4. ResponseParser (`app/services/response_parser.py`)
```python
async def parse_response(response_text: str, db) -> List[Message]:
    # แปลง $object_id → LINE Message objects
    # รองรับ: $flex_xxx, $image_xxx, $sticker_xxx
```

#### 5. FlexMessages (`app/services/flex_messages.py`)
```python
def build_request_status_list(requests) -> Flex Bubble
# สร้าง Flex Message แสดงสถานะคำร้อง
```

---

## 🎨 Frontend Architecture (Next.js 16)

### Project Structure
```
frontend/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # Root layout (Noto Sans Thai)
│   ├── page.tsx               # Landing page
│   ├── globals.css            # Tailwind styles
│   │
│   ├── admin/                 # Admin dashboard
│   │   ├── layout.tsx         # Sidebar navigation
│   │   ├── page.tsx           # Dashboard (Server Component)
│   │   ├── live-chat/         # Full-screen chat
│   │   ├── requests/          # Service requests
│   │   ├── chatbot/           # Chatbot overview
│   │   ├── auto-replies/      # Auto-reply rules
│   │   ├── reply-objects/     # Message templates
│   │   ├── rich-menus/        # Rich menu editor
│   │   ├── users/             # User management
│   │   ├── files/             # File management
│   │   ├── reports/           # Reports
│   │   ├── settings/          # System settings
│   │   └── components/        # Admin components
│   │
│   └── liff/                  # LIFF mini-apps
│       ├── layout.tsx
│       ├── service-request/   # 4-step form
│       └── request-v2/        # LIFF v2 form
│
├── components/                # Shared components
│   ├── admin/                 # Admin-specific
│   └── ui/                    # UI primitives
│
├── types/                     # TypeScript types
├── hooks/                     # Custom hooks
└── data/                      # Static data
```

### Key Components

#### ChatModeToggle (`components/admin/ChatModeToggle.tsx`)
```typescript
interface ChatModeToggleProps {
  currentMode: 'BOT' | 'HUMAN';
  onToggle: (newMode: 'BOT' | 'HUMAN') => void;
  disabled?: boolean;
}
```

#### Admin Layout (`app/admin/layout.tsx`)
- Responsive sidebar (collapses < 1024px)
- Menu groups: Service Requests, Chatbot Management, System Management
- Live Chat standalone mode (no sidebar)

### LIFF Service Request Form

#### 4-Step Wizard
```
Step 1: ข้อมูลส่วนตัว
├── คำนำหน้า (นาย/นาง/นางสาว)
├── ชื่อ
├── นามสกุล
├── เบอร์โทรศัพท์
└── อีเมล

Step 2: หน่วยงาน
├── หน่วยงาน
├── จังหวัด (Cascading dropdown)
├── อำเภอ (Cascading dropdown)
└── ตำบล (Cascading dropdown)

Step 3: รายละเอียด
├── หัวข้อหลัก
│   ├── กองทุนยุติธรรม
│   ├── เงินเยียวยาเหยื่ออาชญากรรม
│   ├── ไกล่เกลี่ยข้อพิพาท
│   └── ร้องเรียน/ร้องทุกข์
├── หัวข้อย่อย
└── รายละเอียดเพิ่มเติม

Step 4: เอกสารแนบ
└── อัพโหลดไฟล์
```

---

## 🔄 Live Chat Handoff Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as LINE User
    participant W as Webhook API
    participant DB as PostgreSQL
    participant L as LineService
    participant LC as LiveChatService
    participant T as TelegramService
    participant A as Admin Panel
    participant OP as Operator

    Note over U,OP: Scenario: User requests human agent
    
    U->>W: ส่งข้อความ "ติดต่อเจ้าหน้าที่"
    W->>DB: Save INCOMING message
    W->>DB: Check user.chat_mode
    
    W->>LC: initiate_handoff(user, reply_token, db)
    LC->>DB: Update chat_mode = HUMAN
    LC->>DB: Create ChatSession (WAITING)
    LC->>L: Send greeting message
    L->>U: "เจ้าหน้าที่จะติดต่อกลับ..."
    LC->>LC: get_recent_messages(3)
    LC->>T: send_handoff_notification()
    T->>T: Admin group notification
    
    Note over U,OP: Operator claims chat
    
    OP->>A: Click "Claim"
    A->>W: POST /conversations/{id}/claim
    W->>LC: claim_session(line_user_id, operator_id, db)
    LC->>DB: Update session → ACTIVE
    
    Note over U,OP: Active conversation
    
    loop Message Exchange (Polling every 5s)
        U->>W: Send message
        W->>DB: Save INCOMING
        A->>A: Poll /conversations/{id}
        
        OP->>A: Type response
        A->>W: POST /messages
        W->>L: Send to LINE
        L->>U: Deliver message
        W->>DB: Save OUTGOING
    end
    
    Note over U,OP: Close session
    
    OP->>A: Click "Close"
    A->>W: POST /conversations/{id}/close
    W->>LC: close_session(line_user_id, OPERATOR, db)
    LC->>DB: Update session → CLOSED
    LC->>DB: Update chat_mode = BOT
    L->>U: "เจ้าหน้าที่ปิดการสนทนา..."
```

---

## 🤖 Intent Matching System

### Match Types (Priority Order)
1. **EXACT** - ตรงกันทั้งข้อความ
2. **CONTAINS** - ข้อความผู้ใช้มีคำนี้อยู่
3. **REGEX** - Pattern matching
4. **STARTS_WITH** - ขึ้นต้นด้วย

### Response Types
| Type | Description | Example |
|------|-------------|---------|
| `TEXT` | Plain text | "สวัสดีค่ะ" |
| `IMAGE` | Image URL | https://example.com/img.jpg |
| `FLEX` | Flex Message JSON | Bubble/Carousel |
| `STICKER` | LINE Sticker | package_id, sticker_id |
| `LOCATION` | Location pin | lat, long, address |
| `VIDEO` | Video URL | https://example.com/vid.mp4 |
| `AUDIO` | Audio URL | https://example.com/aud.mp3 |
| `TEMPLATE` | Button/Confirm | Action buttons |
| `IMAGEMAP` | Interactive image | Clickable areas |

### Reply Objects ($object_id)
```python
# ตัวอย่างการใช้งาน
response_text = "สวัสดีค่ะ ติดต่อเราได้ที่ $flex_contact"

# ResponseParser จะ:
# 1. แยก text: "สวัสดีค่ะ ติดต่อเราได้ที่"
# 2. แทนที่ $flex_contact → FlexMessage (จาก reply_objects table)
```

---

## 🔧 Configuration

### Backend Environment Variables
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/skn_app_db

# Security
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# LINE
LINE_CHANNEL_ACCESS_TOKEN=xxx
LINE_CHANNEL_SECRET=xxx
LINE_LOGIN_CHANNEL_ID=xxx
SERVER_BASE_URL=https://your-domain.com

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
```

### Frontend Environment
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Next.js Config (Rewrites)
```javascript
async rewrites() {
  return [
    {
      source: '/api/v1/:path*',
      destination: 'http://127.0.0.1:8000/api/v1/:path*',
    },
    {
      source: '/docs',
      destination: 'http://127.0.0.1:8000/docs',
    },
  ]
}
```

---

## 📦 Dependencies

### Backend (requirements.txt)
```
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
sqlalchemy>=2.0.25
alembic>=1.13.1
asyncpg>=0.29.0
python-multipart>=0.0.7
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
httpx>=0.26.0
line-bot-sdk>=3.0.0
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "@line/liff": "^2.27.3",
    "lucide-react": "^0.473.0",
    "next": "16.1.1",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "recharts": "^2.15.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## 🗂️ Database Migrations

| Revision | Description | Date |
|----------|-------------|------|
| `1349087a4a24` | Initial tables | 2026-01-17 |
| `d2df2a419a56` | Add messages table | - |
| `9aef5616e35e` | Add auto_replies & media_files | - |
| `8a9b1c2d3e4f` | Add intent tables | - |
| `cd2257cee794` | Add reply_objects | - |
| `e3f4g5h6i7j8` | Add rich_menus | - |
| `f1a2b3c4d5e6` | Add live_chat & credentials | - |
| `a9b8c7d6e5f4` | Add operator_name to messages | - |
| `add_system_settings` | Add system_settings | - |
| `157caa418be7` | Merge heads | - |

---

## 🎯 Feature Checklist

| Feature | Status | Files |
|---------|--------|-------|
| 🤖 Intent-based Chatbot | ✅ | `webhook.py`, `intent.py`, `response_parser.py` |
| 💬 Live Chat Handoff | ✅ | `live_chat_service.py`, `admin_live_chat.py` |
| 📋 Service Request Form | ✅ | `liff/service-request/page.tsx` |
| 🔔 Telegram Notifications | ✅ | `telegram_service.py` |
| 📊 Admin Dashboard | ✅ | `admin/page.tsx`, `DashboardCharts.tsx` |
| 🎨 Rich Menu Management | ✅ | `rich_menus/page.tsx`, `rich_menu_service.py` |
| 📢 Broadcast Messaging | ✅ | `chatbot/broadcast/page.tsx` |
| 👥 User Management | ✅ | `admin/users/page.tsx` |
| 🔐 Credentials Management | ✅ | `admin/settings/line/page.tsx` |
| 📁 File Upload | ✅ | `media.py`, `admin/files/page.tsx` |
| 📈 Analytics & Reports | ✅ | `admin/reports/page.tsx` |

---

## 🔐 Security Notes

1. **LINE Webhook**: มี Signature Validation (`X-Line-Signature`)
2. **LIFF**: ใช้ LINE Login สำหรับ user identification
3. **Admin APIs**: ไม่มี Authentication ในปัจจุบัน (ตามที่เห็นใน code)
4. **Credentials**: เก็บแบบ encrypted ในตาราง `credentials`
5. **CORS**: Configurable ผ่าน environment variable

---

## 🚀 Deployment Notes

### Docker Compose
```yaml
services:
  db:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### Development Commands
```bash
# Backend
cd backend
python -m venv venv
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

---

## 📝 Summary

**JskApp** เป็นระบบ LINE OA Platform ครบวงจรสำหรับหน่วยงานราชการ มีจุดเด่นดังนี้:

1. **Chatbot อัจฉริยะ** - Intent matching แบบ hierarchical พร้อม support หลาย response types
2. **Live Chat Seamless** - สลับระหว่าง bot ↔ human ได้แบบไม่สะดุด
3. **Service Request System** - ฟอร์ม LIFF 4 ขั้นตอนพร้อม cascading location
4. **Rich Menu Editor** - สร้างและ sync ไปยัง LINE ได้ทันที
5. **Telegram Integration** - แจ้งเตือนเจ้าหน้าที่เมื่อมีการขอติดต่อ

**Tech Stack ทันสมัย**: FastAPI + SQLAlchemy Async + Next.js 16 + Tailwind v4

---

*รายงานจัดทำโดย: Kilo Code*  
*วันที่: 29 มกราคม 2026*