"""认证端点测试：注册、登录、刷新、注销、重复邮箱、令牌过期。"""

import time

import jwt
import pytest
from httpx import AsyncClient

from tremorguard_backend.core.config import settings

pytestmark = pytest.mark.asyncio


async def test_register_returns_tokens(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "new@example.com", "password": "password123"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["token_type"] == "bearer"
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["expires_in"] == settings.access_token_expire_minutes * 60


async def test_register_duplicate_email_conflict(client: AsyncClient) -> None:
    payload = {"email": "dup@example.com", "password": "password123"}
    r1 = await client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201
    r2 = await client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 409
    assert "已注册" in r2.json()["detail"]


async def test_register_short_password_rejected(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "short@example.com", "password": "123"},
    )
    assert resp.status_code == 422


async def test_login_success(client: AsyncClient, register_user) -> None:
    await register_user(client, email="login@example.com", password="password123")
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "password123"},
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]


async def test_login_wrong_password(client: AsyncClient, register_user) -> None:
    await register_user(client, email="login@example.com", password="password123")
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "wrong-password"},
    )
    assert resp.status_code == 401


async def test_login_unknown_user(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "password123"},
    )
    assert resp.status_code == 401


async def test_refresh_issues_new_tokens_and_rotates(client: AsyncClient, register_user) -> None:
    user = await register_user(client, email="refresh@example.com")
    old_refresh = user["tokens"]["refresh_token"]

    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert resp.status_code == 200
    new_tokens = resp.json()
    assert new_tokens["access_token"] != user["tokens"]["access_token"]
    assert new_tokens["refresh_token"] != old_refresh

    # 旧 refresh 已被吊销，再次使用应失败
    resp2 = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert resp2.status_code == 401


async def test_logout_revokes_refresh(client: AsyncClient, register_user) -> None:
    user = await register_user(client, email="logout@example.com")
    refresh = user["tokens"]["refresh_token"]
    headers = user["headers"]

    resp = await client.post(
        "/api/v1/auth/logout", json={"refresh_token": refresh}, headers=headers
    )
    assert resp.status_code == 200

    # 注销后该 refresh 不可再用
    resp2 = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert resp2.status_code == 401


async def test_me_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/me")
    assert resp.status_code in (401, 403)


async def test_expired_access_token_rejected(client: AsyncClient, register_user) -> None:
    user = await register_user(client, email="expire@example.com")
    access = user["tokens"]["access_token"]
    # 手动构造一个已过期的访问令牌
    expired = jwt.encode(
        {
            "sub": _extract_sub(access),
            "type": "access",
            "jti": "expired-jti",
            "exp": int(time.time()) - 10,
            "iat": int(time.time()) - 20,
        },
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    resp = await client.get("/api/v1/me", headers={"Authorization": f"Bearer {expired}"})
    assert resp.status_code == 401


async def test_invalid_token_rejected(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/me", headers={"Authorization": "Bearer not.a.real.token"})
    assert resp.status_code == 401


async def test_refresh_token_misused_as_access_rejected(client: AsyncClient, register_user) -> None:
    user = await register_user(client, email="misuse@example.com")
    # 用 refresh token 当 access token 访问 /me
    resp = await client.get(
        "/api/v1/me",
        headers={"Authorization": f"Bearer {user['tokens']['refresh_token']}"},
    )
    assert resp.status_code == 401


def _extract_sub(token: str) -> str:
    """从有效 access token 中解出 sub，用于构造过期令牌。"""
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    return payload["sub"]
