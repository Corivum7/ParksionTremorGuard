"""患者档案路由：CRUD，校验当前用户所有权。"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tremorguard_backend.api.deps import get_db
from tremorguard_backend.core.deps import assert_owner, get_current_user
from tremorguard_backend.models.patient import PatientProfile
from tremorguard_backend.models.user import User
from tremorguard_backend.schemas.patient import PatientCreate, PatientResponse, PatientUpdate

router = APIRouter(prefix="/patients", tags=["patients"])


def _apply_create(model: PatientProfile, body: PatientCreate, user_id: str) -> None:
    model.user_id = user_id
    model.name = body.name
    model.gender = body.gender
    model.birth_date = body.birth_date
    model.height_cm = body.height_cm
    model.weight_kg = body.weight_kg
    model.diagnosis_date = body.diagnosis_date
    model.disease_stage = body.disease_stage
    model.primary_symptom = body.primary_symptom
    model.medical_history = body.medical_history
    model.allergies = body.allergies
    model.emergency_contact_name = body.emergency_contact.name
    model.emergency_contact_phone = body.emergency_contact.phone
    model.emergency_contact_relationship = body.emergency_contact.relationship


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    body: PatientCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PatientResponse:
    """创建患者档案。创建后 onboarding 推进到 profiled。"""
    patient = PatientProfile()
    _apply_create(patient, body, user.id)
    db.add(patient)
    user.advance_onboarding("profiled")
    await db.commit()
    await db.refresh(patient)
    return PatientResponse.model_validate(patient)


@router.get("", response_model=list[PatientResponse])
async def list_patients(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[PatientResponse]:
    """列出当前用户的全部患者档案。"""
    result = await db.execute(select(PatientProfile).where(PatientProfile.user_id == user.id))
    return [PatientResponse.model_validate(p) for p in result.scalars().all()]


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PatientResponse:
    """获取单个患者档案，校验所有权。"""
    result = await db.execute(select(PatientProfile).where(PatientProfile.id == patient_id))
    patient = result.scalar_one_or_none()
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="患者档案不存在")
    assert_owner(patient.user_id, user)
    return PatientResponse.model_validate(patient)


@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    body: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PatientResponse:
    """更新患者档案，校验所有权。"""
    result = await db.execute(select(PatientProfile).where(PatientProfile.id == patient_id))
    patient = result.scalar_one_or_none()
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="患者档案不存在")
    assert_owner(patient.user_id, user)

    data = body.model_dump(exclude_unset=True)
    ec = data.pop("emergency_contact", None)
    for field, value in data.items():
        setattr(patient, field, value)
    if ec is not None:
        patient.emergency_contact_name = ec.get("name", "")
        patient.emergency_contact_phone = ec.get("phone", "")
        patient.emergency_contact_relationship = ec.get("relationship", "")

    await db.commit()
    await db.refresh(patient)
    return PatientResponse.model_validate(patient)


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    """删除患者档案，校验所有权。"""
    result = await db.execute(select(PatientProfile).where(PatientProfile.id == patient_id))
    patient = result.scalar_one_or_none()
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="患者档案不存在")
    assert_owner(patient.user_id, user)
    await db.delete(patient)
    await db.commit()
