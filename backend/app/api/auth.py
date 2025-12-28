"""Authentication endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser
from app.db.session import get_db
from app.schemas.auth import (
    AuthResponse,
    RefreshTokenRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserMeResponse,
    UserResponse,
)
from app.services.auth import (
    AuthService,
    InvalidCredentialsError,
    InvalidTokenError,
    UserAlreadyExistsError,
    UserInactiveError,
    UserNotFoundError,
)

router = APIRouter()


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account and return tokens.",
)
async def register(
    user_data: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AuthResponse:
    """Register a new user.

    Args:
        user_data: User registration data.
        db: Database session.

    Returns:
        Created user and authentication tokens.

    Raises:
        HTTPException: If email or username is already taken.
    """
    auth_service = AuthService(db)

    try:
        user, tokens = await auth_service.register(user_data)
        return AuthResponse(
            user=UserResponse.model_validate(user),
            tokens=tokens,
        )
    except UserAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION_ERROR",
                "message": str(e),
            },
        ) from e


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Login user",
    description="Authenticate user and return tokens.",
)
async def login(
    credentials: UserLogin,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AuthResponse:
    """Authenticate user and return tokens.

    Args:
        credentials: User login credentials.
        db: Database session.

    Returns:
        Authenticated user and tokens.

    Raises:
        HTTPException: If credentials are invalid.
    """
    auth_service = AuthService(db)

    try:
        user, tokens = await auth_service.login(credentials.email, credentials.password)
        return AuthResponse(
            user=UserResponse.model_validate(user),
            tokens=tokens,
        )
    except InvalidCredentialsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_CREDENTIALS",
                "message": str(e),
            },
        ) from e
    except UserInactiveError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "USER_INACTIVE",
                "message": str(e),
            },
        ) from e


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Use refresh token to get a new access token.",
)
async def refresh_token(
    token_request: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Refresh access token using refresh token.

    Args:
        token_request: Token refresh request with refresh_token.
        db: Database session.

    Returns:
        New access token.

    Raises:
        HTTPException: If refresh token is invalid.
    """
    auth_service = AuthService(db)

    try:
        tokens = await auth_service.refresh_tokens(token_request.refresh_token)
        return TokenResponse(
            access_token=tokens.access_token,
            expires_in=tokens.expires_in,
        )
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_TOKEN",
                "message": str(e),
            },
        ) from e
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "USER_NOT_FOUND",
                "message": str(e),
            },
        ) from e
    except UserInactiveError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "USER_INACTIVE",
                "message": str(e),
            },
        ) from e


@router.get(
    "/me",
    response_model=UserMeResponse,
    summary="Get current user",
    description="Get the current authenticated user's data.",
)
async def get_me(
    current_user: CurrentUser,
) -> UserMeResponse:
    """Get current authenticated user data.

    Args:
        current_user: Current authenticated user.

    Returns:
        Current user data.
    """
    return UserMeResponse.model_validate(current_user)
