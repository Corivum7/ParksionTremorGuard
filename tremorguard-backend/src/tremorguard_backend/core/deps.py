"""认证与授权依赖：当前用户解析与资源所有权校验。"""

import uuid
from datetime import UTC, datetime

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tremorguard_backend.api.deps import get_db
from tremorguard_backend.core.security import decode_token
from tremorguard_backend.models.refresh_token import RefreshToken
from tremorguard_backend.models.user import User

bearer_scheme = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """从 Bearer token 解析当前用户，校验访问令牌类型与有效性。"""
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except Exception as exc:  # noqa: BLE001 - JWT 解码多种异常统一处理
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效或过期的访问令牌",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="令牌类型错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="令牌缺少用户标识",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
        )
    return user


async def get_refresh_token_record(token: str, db: AsyncSession) -> tuple[dict, RefreshToken]:
    """解码刷新令牌并返回 (payload, db记录)，校验未吊销且未过期。"""
    try:
        payload = decode_token(token)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="无效或过期的刷新令牌"
        ) from exc

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="令牌类型错误")

    jti = payload.get("jti")
    if not jti:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="刷新令牌缺少标识")

    result = await db.execute(select(RefreshToken).where(RefreshToken.jti == jti))
    record = result.scalar_one_or_none()
    if record is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="刷新令牌不存在")
    if record.revoked:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="刷新令牌已被吊销")
    # SQLite 存储会丢弃时区信息，统一为 aware UTC 再比较
    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    if expires_at < datetime.now(UTC):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="刷新令牌已过期")
    return payload, record


def assert_owner(resource_user_id: str, current_user: User) -> None:
    """校验资源归属当前用户，否则 403。"""
    if resource_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问该资源",
        )


def new_jti() -> str:
    return uuid.uuid4().hex
