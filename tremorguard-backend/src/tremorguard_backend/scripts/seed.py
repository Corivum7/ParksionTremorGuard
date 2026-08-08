"""数据库 seed 脚本：创建演示用户、患者档案与设备。

用法：
    uv run python -m tremorguard_backend.scripts.seed

密码与设备密钥均以 bcrypt 哈希存储。
"""

import asyncio

from sqlalchemy import select

from tremorguard_backend.core.db import async_session_factory, dispose_engine
from tremorguard_backend.core.security import hash_device_key, hash_password
from tremorguard_backend.models.device import Device
from tremorguard_backend.models.patient import PatientProfile
from tremorguard_backend.models.user import User

DEMO_EMAIL = "demo@tremorguard.local"
DEMO_PASSWORD = "password123"


async def seed() -> None:
    async with async_session_factory() as db:
        existing = await db.execute(select(User).where(User.email == DEMO_EMAIL))
        if existing.scalar_one_or_none() is not None:
            print(f"演示用户 {DEMO_EMAIL} 已存在，跳过 seed。")
            return

        user = User(
            email=DEMO_EMAIL,
            password_hash=hash_password(DEMO_PASSWORD),
            role="patient",
            onboarding_state="onboarded",
        )
        db.add(user)
        await db.flush()

        patient = PatientProfile(
            user_id=user.id,
            name="演示患者",
            gender="male",
            birth_date="1960-01-01",
            height_cm=170.0,
            weight_kg=70.0,
            diagnosis_date="2024-01-01",
            disease_stage="middle",
            primary_symptom="静止性震颤",
            medical_history="高血压",
            allergies="无",
            emergency_contact_name="家属",
            emergency_contact_phone="13800000000",
            emergency_contact_relationship="子女",
        )
        db.add(patient)
        await db.flush()

        device = Device(
            user_id=user.id,
            name="手腕设备 A",
            mac_address="AA:BB:CC:DD:EE:01",
            serial_number="TG-0001",
            firmware_version="1.0.0",
            hardware_version="v1",
            model="TremorGuard-Wrist",
            device_key_hash=hash_device_key("device-key-001"),
            patient_id=patient.id,
            status="paired",
            battery_level=85,
        )
        db.add(device)
        await db.commit()

        print(f"seed 完成：用户 {DEMO_EMAIL} / 密码 {DEMO_PASSWORD}")
        print(f"  患者档案 id={patient.id}")
        print(f"  设备 id={device.id} (mac={device.mac_address})")


if __name__ == "__main__":
    try:
        asyncio.run(seed())
    finally:
        asyncio.run(dispose_engine())
