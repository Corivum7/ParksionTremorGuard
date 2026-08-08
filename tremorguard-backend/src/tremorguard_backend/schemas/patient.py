"""患者档案 Pydantic 模型。"""

from typing import Literal

from pydantic import BaseModel, Field

Gender = Literal["male", "female", "other"]
DiseaseStage = Literal["early", "middle", "advanced"]


class EmergencyContact(BaseModel):
    name: str = ""
    relationship: str = ""
    phone: str = ""


class PatientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    gender: Gender
    birth_date: str = Field(description="ISO 日期 YYYY-MM-DD")
    height_cm: float = Field(gt=0)
    weight_kg: float = Field(gt=0)
    diagnosis_date: str = Field(description="ISO 日期 YYYY-MM-DD")
    disease_stage: DiseaseStage
    primary_symptom: str = Field(min_length=1, max_length=255)
    medical_history: str = ""
    allergies: str = ""
    emergency_contact: EmergencyContact = EmergencyContact()


class PatientUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    gender: Gender | None = None
    birth_date: str | None = None
    height_cm: float | None = Field(default=None, gt=0)
    weight_kg: float | None = Field(default=None, gt=0)
    diagnosis_date: str | None = None
    disease_stage: DiseaseStage | None = None
    primary_symptom: str | None = Field(default=None, min_length=1, max_length=255)
    medical_history: str | None = None
    allergies: str | None = None
    emergency_contact: EmergencyContact | None = None


class PatientResponse(BaseModel):
    id: str
    user_id: str
    name: str
    gender: Gender
    birth_date: str
    height_cm: float
    weight_kg: float
    diagnosis_date: str
    disease_stage: DiseaseStage
    primary_symptom: str
    medical_history: str
    allergies: str
    emergency_contact_name: str
    emergency_contact_phone: str
    emergency_contact_relationship: str

    model_config = {"from_attributes": True}
