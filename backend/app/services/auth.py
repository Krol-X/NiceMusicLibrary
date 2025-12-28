"""Authentication service with business logic."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import TokenPair, UserCreate


class AuthServiceError(Exception):
    """Base exception for auth service errors."""


class UserAlreadyExistsError(AuthServiceError):
    """Raised when user with email or username already exists."""


class InvalidCredentialsError(AuthServiceError):
    """Raised when login credentials are invalid."""


class InvalidTokenError(AuthServiceError):
    """Raised when token is invalid or expired."""


class UserNotFoundError(AuthServiceError):
    """Raised when user is not found."""


class UserInactiveError(AuthServiceError):
    """Raised when user account is inactive."""


class AuthService:
    """Service for handling authentication operations."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize auth service.

        Args:
            db: Database session.
        """
        self.db = db

    async def get_user_by_email(self, email: str) -> User | None:
        """Get user by email.

        Args:
            email: User email.

        Returns:
            User if found, None otherwise.
        """
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_username(self, username: str) -> User | None:
        """Get user by username.

        Args:
            username: Username.

        Returns:
            User if found, None otherwise.
        """
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        """Get user by ID.

        Args:
            user_id: User UUID.

        Returns:
            User if found, None otherwise.
        """
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def register(self, user_data: UserCreate) -> tuple[User, TokenPair]:
        """Register a new user.

        Args:
            user_data: User registration data.

        Returns:
            Tuple of created user and token pair.

        Raises:
            UserAlreadyExistsError: If email or username is already taken.
        """
        # Check if email already exists
        existing_user = await self.get_user_by_email(user_data.email)
        if existing_user:
            raise UserAlreadyExistsError("User with this email already exists")

        # Check if username already exists
        existing_user = await self.get_user_by_username(user_data.username)
        if existing_user:
            raise UserAlreadyExistsError("User with this username already exists")

        # Create new user
        user = User(
            email=user_data.email,
            username=user_data.username,
            password_hash=get_password_hash(user_data.password),
        )
        self.db.add(user)
        await self.db.flush()

        # Generate tokens
        tokens = self._create_tokens(str(user.id))

        return user, tokens

    async def login(self, email: str, password: str) -> tuple[User, TokenPair]:
        """Authenticate user and return tokens.

        Args:
            email: User email.
            password: User password.

        Returns:
            Tuple of authenticated user and token pair.

        Raises:
            InvalidCredentialsError: If credentials are invalid.
            UserInactiveError: If user account is inactive.
        """
        user = await self.get_user_by_email(email)
        if not user:
            raise InvalidCredentialsError("Invalid email or password")

        if not verify_password(password, user.password_hash):
            raise InvalidCredentialsError("Invalid email or password")

        if not user.is_active:
            raise UserInactiveError("User account is inactive")

        # Update last login
        user.last_login_at = datetime.now(UTC)

        # Generate tokens
        tokens = self._create_tokens(str(user.id))

        return user, tokens

    async def refresh_tokens(self, refresh_token: str) -> TokenPair:
        """Refresh access token using refresh token.

        Args:
            refresh_token: Refresh token.

        Returns:
            New token pair.

        Raises:
            InvalidTokenError: If refresh token is invalid.
            UserNotFoundError: If user from token is not found.
            UserInactiveError: If user account is inactive.
        """
        payload = decode_token(refresh_token)
        if not payload:
            raise InvalidTokenError("Invalid or expired refresh token")

        if payload.get("type") != "refresh":
            raise InvalidTokenError("Invalid token type")

        user_id = payload.get("sub")
        if not user_id:
            raise InvalidTokenError("Invalid token payload")

        user = await self.get_user_by_id(UUID(user_id))
        if not user:
            raise UserNotFoundError("User not found")

        if not user.is_active:
            raise UserInactiveError("User account is inactive")

        return self._create_tokens(str(user.id))

    async def get_current_user(self, token: str) -> User:
        """Get current user from access token.

        Args:
            token: Access token.

        Returns:
            Current user.

        Raises:
            InvalidTokenError: If access token is invalid.
            UserNotFoundError: If user from token is not found.
            UserInactiveError: If user account is inactive.
        """
        payload = decode_token(token)
        if not payload:
            raise InvalidTokenError("Invalid or expired access token")

        if payload.get("type") != "access":
            raise InvalidTokenError("Invalid token type")

        user_id = payload.get("sub")
        if not user_id:
            raise InvalidTokenError("Invalid token payload")

        user = await self.get_user_by_id(UUID(user_id))
        if not user:
            raise UserNotFoundError("User not found")

        if not user.is_active:
            raise UserInactiveError("User account is inactive")

        return user

    def _create_tokens(self, user_id: str) -> TokenPair:
        """Create access and refresh token pair.

        Args:
            user_id: User ID to encode in tokens.

        Returns:
            Token pair with access and refresh tokens.
        """
        access_token = create_access_token(user_id)
        refresh_token = create_refresh_token(user_id)
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

        return TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
        )
