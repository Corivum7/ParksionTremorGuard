"""设备 Pydantic 模型。"""

from typing import Literal

from pydantic import BaseModel, Field

DeviceStatus = Literal["unpaired", "paired", "connected", "disconnected", "low_battery"]


class DeviceBind(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    mac_address: str = Field(min_length=1, max_length=32)
    serial_number: str = Field(min_length=1, max_length=64)
    firmware_version: str = ""
    hardware_version: str = ""
    model: str = ""
    device_key: str = Field(min_length=8, max_length=128, description="设备密钥明文，仅存哈希")
    patient_id: str | None = None
    battery_level: int = Field(default=100, ge=0, le=100)


class DeviceResponse(BaseModel):
    id: str
    user_id: str
    name: str
    mac_address: str
    serial_number: str
    firmware_version: str
    hardware_version: str
    model: str
    patient_id: str | None
    status: DeviceStatus
    battery_level: int

    model_config = {"from_attributes": True}
