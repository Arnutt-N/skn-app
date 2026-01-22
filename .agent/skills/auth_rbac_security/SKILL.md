---
name: Auth & RBAC Security
description: Security standards for Authentication, Authorization (RBAC), and LINE Login integration.
---

# Authentication & RBAC Security

## 1. Authentication Strategy
We support two primary authentication methods:
1.  **Email/Password**: For Admins/Staff.
2.  **LINE Login (OIDC)**: For End Users (LIFF) and optionally Staff.

### 1.1 JWT Implementation
- **Access Token**: Short-lived (e.g., 15-30 minutes). Stateless.
- **Refresh Token**: Long-lived (e.g., 7 days). Stored securely (HttpOnly Cookie) or in DB with rotation.
- **Algorithms**: HS256 (Speed) or RS256 (Key separation).

## 2. LINE Login Flow (LIFF)
The critical security step is verifying the ID Token on the Backend. **NEVER** trust the frontend's claim of user identity.

1.  **Frontend**: `liff.getIDToken()` -> Send string to Backend API.
2.  **Backend**: 
    - POST `https://api.line.me/oauth2/v2.1/verify` (or use local library).
    - Verify `channelId` matches your LIFF Channel.
    - Verify `exp` (not expired).
    - Extract `sub` (UserId), `name`, `picture`.
3.  **Backend**: Create/Update User in DB -> Issue App JWT -> Return to Client.

## 3. Role-Based Access Control (RBAC)
Define strict permission scopes based on Roles.

### 3.1 Role Hierarchy
- **SUPER_ADMIN**: Can manage Organization structure, Assign Agents, View all logs.
- **ADMIN** (Agency Level): Can view/manage requests assigned to their Agency.
- **AGENT**: Can view/manage requests assigned to *them* directly.
- **USER**: Can view only their own requests.

### 3.2 Implementation (FastAPI Dependencies)
```python
# api/deps.py
class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_active_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(status_code=403, detail="Not enough permissions")

# Usage
@router.delete("/users/{id}")
async def delete_user(
    id: int, 
    _ = Depends(RoleChecker(["SUPER_ADMIN"]))
):
    ...
```

## 4. Password Security
- **Hashing**: Use `bcrypt` or `Argon2`.
- **Salting**: Automatic via library.
- **Validation**: Enforce complexity (Min 8 chars, mixed case, etc.) using Pydantic validators.

## 5. Security Headers & CORS
- **CORS**: Restrict `allow_origins` to your frontend domains only.
- **Headers**:
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY` (Except for LIFF domains)
    - `Content-Security-Policy`: Strict, but allow LINE domains.

## 6. Audit Logging
- Log **Who**, **What**, **When**, **Where** for critical actions (Login, Delete, Status Change).
- Do not log sensitive data (Passwords, Tokens).
