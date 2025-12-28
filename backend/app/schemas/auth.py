"""Authentication schemas."""

import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserBase(BaseModel):
    """Base user schema with common fields."""

    email: EmailStr
    username: str = Field(min_length=3, max_length=50)


class UserCreate(UserBase):
    """Schema for user registration."""

    password: str = Field(min_length=8)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username format."""
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            msg = "Username can only contain letters, numbers, underscores and hyphens"
            raise ValueError(msg)
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if not any(c.isupper() for c in v):
            msg = "Password must contain at least one uppercase letter"
            raise ValueError(msg)
        if not any(c.islower() for c in v):
            msg = "Password must contain at least one lowercase letter"
            raise ValueError(msg)
        if not any(c.isdigit() for c in v):
            msg = "Password must contain at least one digit"
            raise ValueError(msg)
        return v


class UserLogin(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Schema for user response (public user data)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    avatar_url: str | None = None
    created_at: datetime


class UserMeResponse(UserResponse):
    """Schema for /auth/me response with additional user data."""

    model_config = ConfigDict(from_attributes=True)

    preferences: dict[str, object] | None = None
    last_login_at: datetime | None = None
    is_active: bool


class TokenPair(BaseModel):
    """Schema for access and refresh tokens."""

    access_token: str
    refresh_token: str
    expires_in: int = Field(description="Token expiration time in seconds")


class TokenResponse(BaseModel):
    """Schema for single token response (refresh endpoint)."""

    access_token: str
    expires_in: int = Field(description="Token expiration time in seconds")


class AuthResponse(BaseModel):
    """Schema for auth response with user and tokens."""

    user: UserResponse
    tokens: TokenPair


class RefreshTokenRequest(BaseModel):
    """Schema for token refresh request."""

    refresh_token: str


class TokenPayload(BaseModel):
    """Schema for JWT token payload."""

    sub: str  # User ID
    exp: int  # Expiration timestamp
    type: str  # Token type: "access" or "refresh"
