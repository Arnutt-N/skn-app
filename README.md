# JskApp - LINE Official Account System

A modern LINE Official Account system with LIFF integration for Community Justice Services.

## Tech Stack

> [!IMPORTANT]
> **WSL Development Environment Required**
> This project requires **WSL (Windows Subsystem for Linux)** for all development.
> - **Backend**: Must run in WSL using `backend/venv_linux`.
> - **Frontend**: Must run in WSL.
> - **System**: Windows OS is the host, but execution happens in WSL.

### Backend

### Backend
- **FastAPI** (Python 3.11+)
- **PostgreSQL** (Database)
- **SQLAlchemy** (ORM with Async support)
- **Alembic** (Migrations)
- **Redis** (Caching & Rate Limiting)

### Frontend
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**

## Project Structure

```
jsk-app/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Config & Security
│   │   ├── db/           # Database setup
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic
│   └── requirements.txt
├── frontend/
│   ├── app/              # Next.js App Router
│   ├── components/       # Reusable components
│   └── lib/              # Utilities
└── .agent/
    └── skills/           # Development standards
```

## Getting Started

### Prerequisites
- **Python 3.9+** (Python 3.13+ recommended for best performance)
- Node.js 22+
- PostgreSQL 16+
- Redis 7+

### Backend Setup

1. Create virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy and configure environment:
```bash
cp app/.env.example app/.env
# Edit app/.env with your credentials
```

4. Run migrations:
```bash
alembic upgrade head
```

5. Start server:
```bash
uvicorn app.main:app --reload
```

Backend will run at `http://localhost:8000`
API docs at `http://localhost:8000/api/v1/docs`

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Configure environment:
```bash
cp .env.local.example .env.local
```

3. Start dev server:
```bash
npm run dev
```

Frontend will run at `http://localhost:3000`

## Features

- ✅ LINE Messaging API integration
- ✅ LIFF (LINE Frontend Framework) support
- ✅ Queue booking system
- ✅ Service request forms
- ✅ Real-time admin chat panel
- ✅ Role-based access control (RBAC)

## Development Standards

See `.agent/skills/` for comprehensive development guidelines:
- API Development
- Frontend Architecture
- Authentication & Security
- Database Design
- Testing
- Deployment

## License

Private - All Rights Reserved
