---
name: Security Checklist
description: Comprehensive security standards covering OWASP Top 10, rate limiting, input validation, and secrets management.
---

# Security Checklist

## 1. OWASP Top 10 Coverage

### 1.1 Injection Prevention
- **SQL Injection**: Use SQLAlchemy ORM (parameterized queries). NEVER build raw SQL strings.
- **Command Injection**: Avoid `os.system()`. Use `subprocess.run()` with `shell=False`.
- **NoSQL Injection**: Validate all inputs even for JSONB queries.

### 1.2 Authentication Failures
- Strong password policy (Min 8 chars, mixed case, numbers).
- Account lockout after 5 failed attempts.
- Use `bcrypt` or `Argon2` for hashing.
- Implement MFA for Admin accounts (optional advanced).

### 1.3 Sensitive Data Exposure
- **HTTPS Only** in production.
- Encrypt sensitive fields in DB (e.g., phone numbers) if required by law.
- Never log passwords, tokens, or PII.

### 1.4 Broken Access Control
- Verify ownership before allowing actions:
```python
@router.delete("/requests/{id}")
async def delete_request(id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    request = await db.get(ServiceRequest, id)
    if request.requester_id != user.id and user.role != "ADMIN":
        raise HTTPException(403, "Not authorized")
    await db.delete(request)
```

### 1.5 Security Misconfiguration
- Disable debug mode in production (`echo=False` for SQLAlchemy).
- Remove default admin accounts.
- Keep dependencies updated (`pip list --outdated`).

## 2. Rate Limiting (Redis)
Protect against brute force and DDoS:
```python
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

@app.on_event("startup")
async def startup():
    await FastAPILimiter.init(redis)

@router.post("/auth/login", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def login(...):
    ...
```

## 3. Input Validation & Sanitization
- **Never trust user input**: Use Pydantic validators.
```python
from pydantic import validator, constr

class ServiceRequestCreate(BaseModel):
    description: constr(min_length=10, max_length=500)
    
    @validator('phone_number')
    def validate_phone(cls, v):
        if not re.match(r'^\d{10}$', v):
            raise ValueError('Invalid phone number')
        return v
```

- **HTML Escaping**: If rendering user content in templates, use auto-escaping (Jinja2 default).

## 4. Secrets Management
- **Environment Variables**: Store secrets in `.env` or cloud secrets (AWS Secrets Manager, Azure Key Vault).
- **Never hardcode** API keys or passwords.
- **Rotate secrets** regularly (every 90 days).

```python
# BAD
LINE_TOKEN = "abc123..."

# GOOD
from app.core.config import settings
LINE_TOKEN = settings.LINE_CHANNEL_ACCESS_TOKEN
```

## 5. CORS Security
Restrict allowed origins to your frontend domain only:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourapp.com"],  # NOT "*"
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

## 6. Security Headers
```python
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

## 7. Dependency Scanning
Run security scans regularly:
```bash
pip install safety
safety check
```
