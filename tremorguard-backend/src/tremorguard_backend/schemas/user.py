"""用户相关 Pydantic 模型。"""

from pydantic import BaseModel

from tremorguard_backend.models.user import OnboardingState


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    onboarding_state: OnboardingState

    model_config = {"from_attributes": True}
