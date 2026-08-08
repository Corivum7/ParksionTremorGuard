"""ORM 模型定义。

所有模型继承 core.db.Base，导入此包即向 Base.metadata 注册全部表，
供 Alembic autogenerate 与 create_all 使用。
"""

from tremorguard_backend.models.device import Device
from tremorguard_backend.models.patient import PatientProfile
from tremorguard_backend.models.refresh_token import RefreshToken
from tremorguard_backend.models.user import User

__all__ = ["Device", "PatientProfile", "RefreshToken", "User"]
