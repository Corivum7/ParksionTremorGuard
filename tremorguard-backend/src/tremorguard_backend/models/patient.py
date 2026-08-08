"""患者档案模型，对齐前端 shared-types/patient.ts。"""

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from tremorguard_backend.core.db import Base
from tremorguard_backend.models.base import TimestampMixin, UUIDPrimaryKey


class PatientProfile(Base, UUIDPrimaryKey, TimestampMixin):
    """患者档案，归属单个用户（user_id）。"""

    __tablename__ = "patient_profiles"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    gender: Mapped[str] = mapped_column(String(16), nullable=False)
    birth_date: Mapped[str] = mapped_column(String(10), nullable=False)
    height_cm: Mapped[float] = mapped_column(Float, nullable=False)
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    diagnosis_date: Mapped[str] = mapped_column(String(10), nullable=False)
    disease_stage: Mapped[str] = mapped_column(String(16), nullable=False)
    primary_symptom: Mapped[str] = mapped_column(String(255), nullable=False)
    medical_history: Mapped[str] = mapped_column(String(2048), nullable=False, default="")
    allergies: Mapped[str] = mapped_column(String(1024), nullable=False, default="")
    emergency_contact_name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    emergency_contact_phone: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    emergency_contact_relationship: Mapped[str] = mapped_column(
        String(64), nullable=False, default=""
    )
