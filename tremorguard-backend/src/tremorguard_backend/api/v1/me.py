"""当前用户路由：/v1/me。"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from tremorguard_backend.api.deps import get_db
from tremorguard_backend.core.deps import get_current_user
from tremorguard_backend.models.user import User
from tremorguard_backend.schemas.user import UserResponse

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=UserResponse)
async def get_me(
    _db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserResponse:
    """返回当前登录用户信息，含 onboarding 状态。"""
    return UserResponse.model_validate(user)
