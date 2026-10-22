from typing import Optional, AsyncGenerator
from fastapi import Depends, HTTPException, status, Request, Response
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.entities import User, UserRole

signer = URLSafeTimedSerializer(settings.SECRET_KEY, salt="campusbite-session-salt")

def create_session_token(user_id: int) -> str:
    return signer.dumps({"user_id": user_id})

def decode_session_token(token: str, max_age: int = settings.SESSION_MAX_AGE_SECONDS) -> Optional[int]:
    try:
        data = signer.loads(token, max_age=max_age)
        return data.get("user_id")
    except (BadSignature, SignatureExpired):
        return None

async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    # Check Authorization / X-Session-Token header first, then session cookie
    auth_header = request.headers.get("Authorization")
    token = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
    elif request.headers.get("X-Session-Token"):
        token = request.headers.get("X-Session-Token")
    elif request.cookies.get(settings.SESSION_COOKIE_NAME):
        token = request.cookies.get(settings.SESSION_COOKIE_NAME)

    if not token:
        return None

    user_id = decode_session_token(token)
    if not user_id:
        return None

    # LIVE DATABASE VERIFICATION: invariant requirement #4
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        return None

    if user.is_active != 1:
        # Invariant #4: Live DB account validation. If suspended, reject immediately.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account has been deactivated. Please contact canteen staff or administrator.",
        )

    return user

async def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def require_customer(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role not in [UserRole.CUSTOMER.value, UserRole.ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required.",
        )
    return current_user

async def require_staff(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role not in [UserRole.STAFF.value, UserRole.ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff or administrator access required.",
        )
    return current_user

async def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )
    return current_user
