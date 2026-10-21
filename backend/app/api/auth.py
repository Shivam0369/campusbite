from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.db.session import get_db
from app.models.entities import User, UserRole
from app.schemas import (
    UserRegisterRequest, UserLoginRequest, UserProfileUpdateRequest,
    UserPasswordChangeRequest, UserResponse, ResponseModel
)
from app.api.deps import (
    create_session_token, get_current_user, get_current_user_optional
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=ResponseModel)
async def register(
    data: UserRegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    if data.confirm_password and data.password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match."
        )

    # Check username or email uniqueness
    stmt = select(User).where(or_(User.username == data.username, User.email == data.email))
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        if existing.username == data.username:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username is already taken.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered.")

    new_user = User(
        full_name=data.full_name,
        username=data.username,
        email=data.email,
        phone=data.phone,
        password_hash=get_password_hash(data.password),
        role=UserRole.CUSTOMER.value,
        is_active=1
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Issue session cookie
    token = create_session_token(new_user.id)
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        max_age=settings.SESSION_MAX_AGE_SECONDS,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/"
    )

    return ResponseModel(
        success=True,
        message="Registration successful! Welcome to CampusBite.",
        data={"user": UserResponse.model_validate(new_user), "token": token}
    )

@router.post("/login", response_model=ResponseModel)
async def login(
    data: UserLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(or_(User.username == data.identifier, User.email == data.identifier))
    user = (await db.execute(stmt)).scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    if user.is_active != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact canteen staff or administrator."
        )

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    token = create_session_token(user.id)
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        max_age=settings.SESSION_MAX_AGE_SECONDS,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/"
    )

    return ResponseModel(
        success=True,
        message="Login successful.",
        data={"user": UserResponse.model_validate(user), "token": token}
    )

@router.post("/logout", response_model=ResponseModel)
async def logout(response: Response):
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )
    return ResponseModel(success=True, message="Successfully logged out.")

@router.get("/me", response_model=ResponseModel)
async def get_me(current_user: User = Depends(get_current_user)):
    return ResponseModel(
        success=True,
        data={"user": UserResponse.model_validate(current_user)}
    )

@router.put("/profile", response_model=ResponseModel)
async def update_profile(
    data: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    current_user.full_name = data.full_name
    if data.phone is not None:
        current_user.phone = data.phone
    await db.commit()
    await db.refresh(current_user)

    return ResponseModel(
        success=True,
        message="Profile details updated successfully.",
        data={"user": UserResponse.model_validate(current_user)}
    )

@router.put("/password", response_model=ResponseModel)
async def change_password(
    data: UserPasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    current_user.password_hash = get_password_hash(data.new_password)
    await db.commit()

    return ResponseModel(
        success=True,
        message="Password updated successfully."
    )

