---
name: Deployment & DevOps
description: Docker, CI/CD, and deployment strategies for production-ready FastAPI and Next.js applications.
---

# Deployment & DevOps Standards

## 1. Local Development (Docker Compose)

### 1.1 docker-compose.yml
```yaml
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: skn_app_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    env_file:
      - ./backend/.env

  frontend:
    build: ./frontend
    command: npm run dev
    volumes:
      - ./frontend:/app
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## 2. Production Dockerfile (Multi-stage)

### 2.1 Backend (FastAPI)
```dockerfile
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2.2 Frontend (Next.js)
```dockerfile
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
CMD ["npm", "start"]
```

## 3. Environment Configuration
Use separate `.env` files per environment:
- `.env.local` (Development)
- `.env.staging`
- `.env.production`

**Never commit** real secrets. Use placeholders in `.env.example`.

## 4. CI/CD Pipeline (GitHub Actions)
```yaml
name: CI/CD
on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Backend Tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest
      - name: Run Frontend Tests
        run: |
          cd frontend
          npm ci
          npm test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        run: echo "Deploy to cloud provider"
```

## 5. Health Checks
Implement health check endpoints for load balancers:
```python
@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow()}
```

## 6. Database Migrations in Production
```bash
# Before deploying new code, run migrations
alembic upgrade head
```
