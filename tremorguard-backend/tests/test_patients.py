"""患者档案端点测试：CRUD、跨用户访问、onboarding 状态推进。"""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

VALID_PATIENT = {
    "name": "张三",
    "gender": "male",
    "birth_date": "1960-05-01",
    "height_cm": 172.0,
    "weight_kg": 68.5,
    "diagnosis_date": "2024-03-01",
    "disease_stage": "middle",
    "primary_symptom": "静止性震颤",
    "medical_history": "高血压",
    "allergies": "无",
    "emergency_contact": {"name": "李四", "relationship": "子女", "phone": "13800000000"},
}


async def test_create_patient_and_onboarding(client: AsyncClient, register_user) -> None:
    user = await register_user(client, email="p1@example.com")
    # 注册后 onboarding 为 pending
    me = await client.get("/api/v1/me", headers=user["headers"])
    assert me.json()["onboarding_state"] == "pending"

    resp = await client.post("/api/v1/patients", json=VALID_PATIENT, headers=user["headers"])
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "张三"
    assert body["emergency_contact_name"] == "李四"

    # 创建档案后 onboarding 推进到 profiled
    me = await client.get("/api/v1/me", headers=user["headers"])
    assert me.json()["onboarding_state"] == "profiled"


async def test_list_patients_only_own(client: AsyncClient, register_user) -> None:
    user_a = await register_user(client, email="a@example.com")
    user_b = await register_user(client, email="b@example.com")
    await client.post("/api/v1/patients", json=VALID_PATIENT, headers=user_a["headers"])
    resp = await client.get("/api/v1/patients", headers=user_b["headers"])
    assert resp.status_code == 200
    assert resp.json() == []


async def test_get_patient_cross_user_forbidden(client: AsyncClient, register_user) -> None:
    user_a = await register_user(client, email="a@example.com")
    user_b = await register_user(client, email="b@example.com")
    created = await client.post("/api/v1/patients", json=VALID_PATIENT, headers=user_a["headers"])
    pid = created.json()["id"]
    # 用户 B 访问用户 A 的档案
    resp = await client.get(f"/api/v1/patients/{pid}", headers=user_b["headers"])
    assert resp.status_code == 403


async def test_update_patient(client: AsyncClient, register_user) -> None:
    user = await register_user(client, email="u@example.com")
    created = await client.post("/api/v1/patients", json=VALID_PATIENT, headers=user["headers"])
    pid = created.json()["id"]
    resp = await client.patch(
        f"/api/v1/patients/{pid}",
        json={"weight_kg": 70.0, "primary_symptom": "运动迟缓"},
        headers=user["headers"],
    )
    assert resp.status_code == 200
    assert resp.json()["weight_kg"] == 70.0
    assert resp.json()["primary_symptom"] == "运动迟缓"


async def test_update_patient_cross_user_forbidden(client: AsyncClient, register_user) -> None:
    user_a = await register_user(client, email="a@example.com")
    user_b = await register_user(client, email="b@example.com")
    created = await client.post("/api/v1/patients", json=VALID_PATIENT, headers=user_a["headers"])
    pid = created.json()["id"]
    resp = await client.patch(
        f"/api/v1/patients/{pid}",
        json={"weight_kg": 99.0},
        headers=user_b["headers"],
    )
    assert resp.status_code == 403


async def test_delete_patient(client: AsyncClient, register_user) -> None:
    user = await register_user(client, email="d@example.com")
    created = await client.post("/api/v1/patients", json=VALID_PATIENT, headers=user["headers"])
    pid = created.json()["id"]
    resp = await client.delete(f"/api/v1/patients/{pid}", headers=user["headers"])
    assert resp.status_code == 204
    # 删除后获取应 404
    resp2 = await client.get(f"/api/v1/patients/{pid}", headers=user["headers"])
    assert resp2.status_code == 404


async def test_delete_patient_cross_user_forbidden(client: AsyncClient, register_user) -> None:
    user_a = await register_user(client, email="a@example.com")
    user_b = await register_user(client, email="b@example.com")
    created = await client.post("/api/v1/patients", json=VALID_PATIENT, headers=user_a["headers"])
    pid = created.json()["id"]
    resp = await client.delete(f"/api/v1/patients/{pid}", headers=user_b["headers"])
    assert resp.status_code == 403


async def test_get_nonexistent_patient(client: AsyncClient, register_user) -> None:
    user = await register_user(client, email="n@example.com")
    resp = await client.get("/api/v1/patients/nonexistent-id", headers=user["headers"])
    assert resp.status_code == 404
