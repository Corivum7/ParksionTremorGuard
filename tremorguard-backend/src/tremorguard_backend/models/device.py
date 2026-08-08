"""设备模型，对齐前端 shared-types/device.ts。

设备密钥（device_key）仅存 bcrypt 哈希，绑定/校验时与哈希比对。
mac_address 全局唯一，防止重复绑定。
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from tremorguard_backend.core.db import Base
from tremorguard_backend.models.base import TimestampMixin, UUIDPrimaryKey


class Device(Base, UUIDPrimaryKey, TimestampMixin):
    """已绑定设备。device_key_hash 为设备密钥的 bcrypt 哈希。"""

    __tablename__ = "devices"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    mac_address: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    serial_number: Mapped[str] = mapped_column(String(64), nullable=False)
    firmware_version: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    hardware_version: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    model: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    # 设备密钥哈希：绑定后用于设备侧鉴权校验
    device_key_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    # 可选绑定到某个患者档案
    patient_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("patient_profiles.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="paired")
    battery_level: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    bound_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_connected_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
