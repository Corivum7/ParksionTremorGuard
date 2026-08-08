"""pytest 异步测试设施。

测试环境隔离策略：在导入应用模块前设置 APP_ENV=test 与 SQLite 测试库，
使 settings 与 engine 指向内存级 SQLite 文件库，与开发库完全隔离。
"""

import os

# 必须在任何应用模块导入前设置，确保 engine 指向测试库
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("DATABASE_TEST_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("JWT_SECRET", "test-secret")

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker

from tremorguard_backend.core.config import get_settings
from tremorguard_backend.core.db import Base, engine
from tremorguard_backend.main import app

# 清除缓存并按测试环境重新加载配置
get_settings.cache_clear()


@pytest_asyncio.fixture(autouse=True)
async def _reset_db():
    """每个测试前重建表，保证隔离。"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    """函数级：httpx 异步客户端，通过 ASGITransport 直连 FastAPI 应用。"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def db_session():
    """函数级：直接访问 DB 的会话，用于测试内的数据准备与断言。"""
    TestSession = async_sessionmaker(engine, expire_on_commit=False)
    async with TestSession() as session:
        yield session


async def _register_and_login(
    client: AsyncClient, email: str = "user@example.com", password: str = "password123"
) -> dict:
    """注册并返回令牌与认证头。"""
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    assert resp.status_code == 201, resp.text
    tokens = resp.json()
    return {
        "tokens": tokens,
        "headers": {"Authorization": f"Bearer {tokens['access_token']}"},
        "email": email,
        "password": password,
    }


@pytest_asyncio.fixture
async def register_user(client: AsyncClient):
    """返回注册辅助函数，供测试按需调用。"""
    return _register_and_login


@pytest_asyncio.fixture
async def auth_user(client: AsyncClient) -> dict:
    """预注册一个用户并返回其令牌/认证头。"""
    return await _register_and_login(client)
