"""公共模型混入：主键、时间戳。"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column


def _uuid() -> str:
    return uuid.uuid4().hex


class UUIDPrimaryKey:
    """36 字符十六进制 UUID 主键，Python 端生成，兼容 PostgreSQL 与 SQLite。"""

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)


class TimestampMixin:
    """created_at / updated_at，写入时由 DB 生成默认值。"""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.current_timestamp(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )
