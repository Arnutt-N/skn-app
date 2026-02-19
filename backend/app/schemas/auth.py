from pydantic import BaseModel
from typing import Optional

from app.models.user import UserRole


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthUserResponse(BaseModel):
    id: int
    username: Optional[str] = None
    role: UserRole
    display_name: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


class LoginResponse(TokenResponse):
    user: AuthUserResponse
