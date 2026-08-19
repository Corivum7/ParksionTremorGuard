"""异步数据库基础设施：引擎、会话工厂、声明式基类。"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from tremorguard_backend.core.config import settings

_url = settings.effective_database_url
_is_sqlite = _url.startswith("sqlite")

_engine_kwargs: dict = {"echo": settings.is_development}
if not _is_sqlite:
    _engine_kwargs.update(
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        connect_args={"server_settings": {"statement_timeout": "30000"}},
    )

engine = create_async_engine(_url, **_engine_kwargs)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """声明式基类，后续领域模型继承此类。"""


async def get_engine():
    """返回当前引擎实例（测试与生命周期管理用）。"""
    return engine


async def dispose_engine() -> None:
    """释放引擎连接池资源。"""
    await engine.dispose()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """产生一个异步会话（用于非 FastAPI 场景）。"""
    async with async_session_factory() as session:
        yield session
