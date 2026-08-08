"""设备绑定路由：绑定、列表、详情、解绑，校验当前用户所有权。

设备密钥（device_key）仅存 bcrypt 哈希；mac_address 全局唯一防止重复绑定。
绑定设备后 onboarding 推进到 onboarded。
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from tremorguard_backend.api.deps import get_db
from tremorguard_backend.core.deps import assert_owner, get_current_user
from tremorguard_backend.core.security import hash_device_key
from tremorguard_backend.models.device import Device
from tremorguard_backend.models.user import User
from tremorguard_backend.schemas.device import DeviceBind, DeviceResponse

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def bind_device(
    body: DeviceBind,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DeviceResponse:
    """绑定设备。mac_address 唯一，重复绑定返回 409。"""
    device = Device(
        user_id=user.id,
        name=body.name,
        mac_address=body.mac_address,
        serial_number=body.serial_number,
        firmware_version=body.firmware_version,
        hardware_version=body.hardware_version,
        model=body.model,
        device_key_hash=hash_device_key(body.device_key),
        patient_id=body.patient_id,
        status="paired",
        battery_level=body.battery_level,
        bound_at=datetime.now(UTC),
    )
    db.add(device)
    user.advance_onboarding("onboarded")
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="该设备已被绑定",
        ) from None
    await db.refresh(device)
    return DeviceResponse.model_validate(device)


@router.get("", response_model=list[DeviceResponse])
async def list_devices(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[DeviceResponse]:
    """列出当前用户的全部设备。"""
    result = await db.execute(select(Device).where(Device.user_id == user.id))
    return [DeviceResponse.model_validate(d) for d in result.scalars().all()]


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DeviceResponse:
    """获取单个设备，校验所有权。"""
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="设备不存在")
    assert_owner(device.user_id, user)
    return DeviceResponse.model_validate(device)


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unbind_device(
    device_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    """解绑设备，校验所有权。"""
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="设备不存在")
    assert_owner(device.user_id, user)
    await db.delete(device)
    await db.commit()
