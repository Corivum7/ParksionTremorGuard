"""应用配置：基于 pydantic-settings 从环境变量与 .env 加载。"""

from functools import lru_cache
from typing import Annotated, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置，单一可迁移配置源。"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # 应用
    app_name: str = "TremorGuard Backend"
    app_env: Literal["development", "test", "production"] = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_log_level: str = "INFO"

    # PostgreSQL
    database_url: str = "postgresql+asyncpg://tremorguard:tremorguard@localhost:5432/tremorguard"
    database_test_url: str = (
        "postgresql+asyncpg://tremorguard:tremorguard@localhost:5432/tremorguard_test"
    )
    database_pool_size: int = 5
    database_max_overflow: int = 10

    # JWT 认证
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # CORS（逗号分隔字符串，NoDecode 阻止 pydantic-settings 的 JSON 解析）
    cors_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:8081",
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_cors_origins(cls, v: object) -> object:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @property
    def is_test(self) -> bool:
        return self.app_env == "test"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def effective_database_url(self) -> str:
        """测试环境使用测试库。"""
        return self.database_test_url if self.is_test else self.database_url


@lru_cache
def get_settings() -> Settings:
    """返回缓存的配置单例。"""
    return Settings()


settings = get_settings()
