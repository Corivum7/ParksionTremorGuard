"""设备绑定端点测试：绑定、列表、详情、解绑、重复 mac、跨用户访问、onboarding。"""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

VALID_DEVICE = {
    "name": "手腕设备 A",
    "mac_address": "AA:BB:CC:DD:EE:01",
    "serial_number": "TG-0001",
    "firmware_version": "1.0.0",
    "hardware_version": "v1",
    "model": "TremorGuard-Wrist",
    "device_key": "device-key-001",
    "battery_level": 85,
}


async def test_bind_device_and_onboarding(client: AsyncClient, register_user) -> None:
    user = await register_user(client, email="d1@example.com")
    # 先创建患者档案进入 profiled
    await client.post(
        "/api/v1/patients",
        json={
            "name": "患者",
            "gender": "male",
            "birth_date": "1960-01-01",
            "height_cm": 170.0,
            "weight_kg": 70.0,
            "diagnosis_date": "2024-01-01",
            "disease_stage": "early",
            "primary_symptom": "震颤",
        },
        headers=user["headers"],
    )
    resp = await client.post("/api/v1/devices", json=VALID_DEVICE, headers=user["headers"])
    assert resp.status_code == 201
    body = resp.json()
    assert body["mac_address"] == "AA:BB:CC:DD:EE:01"
    assert body["status"] == "paired"
    # 响应中不应包含设备密钥或其哈希
    assert "device_key" not in body
    assert "device_key_hash" not in body

    # 绑定设备后 onboarding 推进到 onboarded
    me = await client.get("/api/v1/me", headers=user["headers"])
    assert me.json()["onboarding_state"] == "onboarded"


async def test_bind_duplicate_mac_conflict(client: AsyncClient, register_user) -> None:
    user_a = await register_user(client, email="a@example.com")
    user_b = await register_user(client, email="b@example.com")
    r1 = await client.post("/api/v1/devices", json=VALID_DEVICE, headers=user_a["headers"])
    assert r1.status_code == 201
    # 不同用户绑定相同 mac 应 409
    r2 = await client.post("/api/v1/devices", json=VALID_DEVICE, headers=user_b["headers"])
    assert r2.status_code == 409
    assert "已被绑定" in r2.json()["detail"]


async def test_list_devices_only_own(client: AsyncClient, register_user) -> None:
    user_a = await register_user(client, email="a@example.com")
    user_b = await register_user(client, email="b@example.com")
    await client.post("/api/v1/devices", json=VALID_DEVICE, headers=user_a["headers"])
    resp = await client.get("/api/v1/devices", headers=user_b["headers"])
    assert resp.status_code == 200
    assert resp.json() == []


async def test_get_device_cross_user_forbidden(client: AsyncClient, register_user) -> None:
    user_a = await register_user(client, email="a@example.com")
    user_b = await register_user(client, email="b@example.com")
    created = await client.post("/api/v1/devices", json=VALID_DEVICE, headers=user_a["headers"])
    did = created.json()["id"]
    resp = await client.get(f"/api/v1/devices/{did}", headers=user_b["headers"])
    assert resp.status_code == 403


async def test_unbind_device(client: AsyncClient, register_user) -> None:
    user = await register_user(client, email="u@example.com")
    created = await client.post("/api/v1/devices", json=VALID_DEVICE, headers=user["headers"])
    did = created.json()["id"]
    resp = await client.delete(f"/api/v1/devices/{did}", headers=user["headers"])
    assert resp.status_code == 204
    resp2 = await client.get(f"/api/v1/devices/{did}", headers=user["headers"])
    assert resp2.status_code == 404


async def test_unbind_device_cross_user_forbidden(client: AsyncClient, register_user) -> None:
    user_a = await register_user(client, email="a@example.com")
    user_b = await register_user(client, email="b@example.com")
    created = await client.post("/api/v1/devices", json=VALID_DEVICE, headers=user_a["headers"])
    did = created.json()["id"]
    resp = await client.delete(f"/api/v1/devices/{did}", headers=user_b["headers"])
    assert resp.status_code == 403


async def test_get_nonexistent_device(client: AsyncClient, register_user) -> None:
    user = await register_user(client, email="n@example.com")
    resp = await client.get("/api/v1/devices/nonexistent-id", headers=user["headers"])
    assert resp.status_code == 404


async def test_device_response_has_no_secret_fields(client: AsyncClient, register_user) -> None:
    user = await register_user(client, email="s@example.com")
    resp = await client.post("/api/v1/devices", json=VALID_DEVICE, headers=user["headers"])
    body = resp.json()
    for forbidden in ("device_key", "device_key_hash", "password_hash"):
        assert forbidden not in body
