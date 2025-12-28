"""API dependencies."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.services.auth import (
    AuthService,
    InvalidTokenError,
    UserInactiveError,
    UserNotFoundError,
)

# Security scheme for Bearer token authentication
security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Get the current authenticated user.

    Args:
        credentials: HTTP Bearer credentials.
        db: Database session.

    Returns:
        Current authenticated user.

    Raises:
        HTTPException: If authentication fails.
    """
    auth_service = AuthService(db)

    try:
        user = await auth_service.get_current_user(credentials.credentials)
        return user
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    except UserInactiveError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e


# Type alias for dependency injection
CurrentUser = Annotated[User, Depends(get_current_user)]
