"""用户模型与 onboarding 状态枚举。"""

from typing import Literal

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from tremorguard_backend.core.db import Base
from tremorguard_backend.models.base import TimestampMixin, UUIDPrimaryKey

# Onboarding 三状态：
#   pending   - 已注册，尚未创建患者档案
#   profiled  - 已创建患者档案，尚未绑定设备
#   onboarded - 已创建档案且已绑定设备，完成引导
OnboardingState = Literal["pending", "profiled", "onboarded"]
ONBOARDING_ORDER: tuple[str, ...] = ("pending", "profiled", "onboarded")


class User(Base, UUIDPrimaryKey, TimestampMixin):
    """应用用户。密码仅存 bcrypt 哈希。"""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="patient")
    onboarding_state: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")

    def advance_onboarding(self, target: str) -> None:
        """仅允许向前推进 onboarding 状态，不回退。"""
        current_idx = ONBOARDING_ORDER.index(self.onboarding_state)
        target_idx = ONBOARDING_ORDER.index(target)
        if target_idx > current_idx:
            self.onboarding_state = target
