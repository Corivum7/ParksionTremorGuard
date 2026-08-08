"""认证路由：注册、登录、刷新、注销。"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from tremorguard_backend.api.deps import get_db
from tremorguard_backend.core.config import settings
from tremorguard_backend.core.deps import get_current_user, get_refresh_token_record
from tremorguard_backend.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from tremorguard_backend.models.refresh_token import RefreshToken
from tremorguard_backend.models.user import User
from tremorguard_backend.schemas.auth import (
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


async def _issue_tokens(user: User, db: AsyncSession) -> TokenResponse:
    """签发 access + refresh 并持久化 refresh 记录。"""
    access_token, _ = create_access_token(user.id)
    refresh_token, jti, expires_at = create_refresh_token(user.id)
    record = RefreshToken(
        user_id=user.id,
        jti=jti,
        expires_at=expires_at,
        revoked=False,
    )
    db.add(record)
    await db.commit()
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """注册新用户，返回令牌。onboarding 初始为 pending。"""
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        role="patient",
        onboarding_state="pending",
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="该邮箱已注册",
        ) from None
    return await _issue_tokens(user, db)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """邮箱密码登录，校验成功返回令牌。"""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
        )
    return await _issue_tokens(user, db)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """刷新访问令牌：吊销旧 refresh，签发新令牌对（令牌轮换）。"""
    payload, record = await get_refresh_token_record(body.refresh_token, db)
    # 吊销旧令牌，防止重放
    record.revoked = True
    await db.flush()

    user_id = payload["sub"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不存在")
    return await _issue_tokens(user, db)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> MessageResponse:
    """注销：吊销刷新令牌。访问令牌短期过期自动失效。"""
    _, record = await get_refresh_token_record(body.refresh_token, db)
    record.revoked = True
    await db.commit()
    return MessageResponse(message="已注销")
