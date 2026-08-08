"""initial schema

Revision ID: 20260808_0001
Revises:
Create Date: 2026-08-08 00:00:00

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260808_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False, server_default="patient"),
        sa.Column(
            "onboarding_state",
            sa.String(length=32),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "patient_profiles",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("gender", sa.String(length=16), nullable=False),
        sa.Column("birth_date", sa.String(length=10), nullable=False),
        sa.Column("height_cm", sa.Float(), nullable=False),
        sa.Column("weight_kg", sa.Float(), nullable=False),
        sa.Column("diagnosis_date", sa.String(length=10), nullable=False),
        sa.Column("disease_stage", sa.String(length=16), nullable=False),
        sa.Column("primary_symptom", sa.String(length=255), nullable=False),
        sa.Column("medical_history", sa.String(length=2048), nullable=False, server_default=""),
        sa.Column("allergies", sa.String(length=1024), nullable=False, server_default=""),
        sa.Column(
            "emergency_contact_name", sa.String(length=255), nullable=False, server_default=""
        ),
        sa.Column(
            "emergency_contact_phone", sa.String(length=64), nullable=False, server_default=""
        ),
        sa.Column(
            "emergency_contact_relationship",
            sa.String(length=64),
            nullable=False,
            server_default="",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_patient_profiles_user_id", "patient_profiles", ["user_id"])

    op.create_table(
        "devices",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("mac_address", sa.String(length=32), nullable=False),
        sa.Column("serial_number", sa.String(length=64), nullable=False),
        sa.Column("firmware_version", sa.String(length=32), nullable=False, server_default=""),
        sa.Column("hardware_version", sa.String(length=32), nullable=False, server_default=""),
        sa.Column("model", sa.String(length=64), nullable=False, server_default=""),
        sa.Column("device_key_hash", sa.String(length=255), nullable=False),
        sa.Column("patient_id", sa.String(length=36), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="paired"),
        sa.Column("battery_level", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("bound_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_connected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["patient_id"], ["patient_profiles.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("mac_address"),
    )
    op.create_index("ix_devices_user_id", "devices", ["user_id"])
    op.create_index("ix_devices_mac_address", "devices", ["mac_address"])

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("jti", sa.String(length=36), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("jti"),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("ix_refresh_tokens_jti", "refresh_tokens", ["jti"])


def downgrade() -> None:
    op.drop_index("ix_refresh_tokens_jti", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_user_id", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
    op.drop_index("ix_devices_mac_address", table_name="devices")
    op.drop_index("ix_devices_user_id", table_name="devices")
    op.drop_table("devices")
    op.drop_index("ix_patient_profiles_user_id", table_name="patient_profiles")
    op.drop_table("patient_profiles")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
