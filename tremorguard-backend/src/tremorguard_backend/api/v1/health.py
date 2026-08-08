"""健康检查路由：liveness 与 readiness。"""

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from tremorguard_backend.api.deps import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live")
async def live() -> dict[str, str]:
    """存活探针：无外部依赖。"""
    return {"status": "ok"}


@router.get("/ready")
async def ready(db: AsyncSession = Depends(get_db)) -> JSONResponse:
    """就绪探针：检测数据库连通性。"""
    try:
        await db.execute(text("SELECT 1"))
    except Exception:  # noqa: BLE001 - 健康检查需捕获所有 DB 故障
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "degraded", "db": "down"},
        )
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"status": "ok", "db": "up"},
    )
