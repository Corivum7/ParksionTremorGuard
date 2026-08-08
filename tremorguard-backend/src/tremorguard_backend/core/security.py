"""安全工具：密码哈希（bcrypt）与 JWT 签发/校验（PyJWT）。"""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

from tremorguard_backend.core.config import settings

# bcrypt 限制 72 字节，截断以避免超长密码报错
_BCRYPT_MAX_BYTES = 72


def hash_password(password: str) -> str:
    """返回 bcrypt 密码哈希字符串。"""
    raw = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    return bcrypt.hashpw(raw, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """校验明文密码与 bcrypt 哈希是否匹配。"""
    raw = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    try:
        return bcrypt.checkpw(raw, password_hash.encode("utf-8"))
    except ValueError:
        return False


def hash_device_key(device_key: str) -> str:
    """设备密钥哈希，与密码同样的 bcrypt 处理。"""
    raw = device_key.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    return bcrypt.hashpw(raw, bcrypt.gensalt()).decode("utf-8")


def verify_device_key(device_key: str, key_hash: str) -> bool:
    """校验设备密钥明文与哈希。"""
    raw = device_key.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    try:
        return bcrypt.checkpw(raw, key_hash.encode("utf-8"))
    except ValueError:
        return False


def _create_token(
    user_id: str, token_type: str, expires_delta: timedelta, jti: str | None = None
) -> tuple[str, str, datetime]:
    """签发 JWT，返回 (token, jti, expires_at)。"""
    now = datetime.now(UTC)
    expire = now + expires_delta
    token_jti = jti or uuid.uuid4().hex
    payload: dict[str, Any] = {
        "sub": user_id,
        "type": token_type,
        "jti": token_jti,
        "iat": now,
        "exp": expire,
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, token_jti, expire


def create_access_token(user_id: str) -> tuple[str, datetime]:
    """签发访问令牌，返回 (token, expires_at)。"""
    token, _, expire = _create_token(
        user_id, "access", timedelta(minutes=settings.access_token_expire_minutes)
    )
    return token, expire


def create_refresh_token(user_id: str, jti: str | None = None) -> tuple[str, str, datetime]:
    """签发刷新令牌，返回 (token, jti, expires_at)。"""
    return _create_token(
        user_id, "refresh", timedelta(days=settings.refresh_token_expire_days), jti=jti
    )


def decode_token(token: str) -> dict[str, Any]:
    """解码并校验 JWT，失败抛出 InvalidTokenError。"""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
