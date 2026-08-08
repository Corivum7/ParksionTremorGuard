"""FastAPI 依赖注入：异步数据库会话。"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from tremorguard_backend.core.db import async_session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """产生一个异步数据库会话，请求结束自动关闭。"""
    async with async_session_factory() as session:
        yield session
