"""FastAPI 应用入口：应用工厂与健康检查挂载。"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from tremorguard_backend import __version__
from tremorguard_backend.api.v1 import auth, devices, health, me, patients
from tremorguard_backend.core.config import settings


def create_app() -> FastAPI:
    """创建并配置 FastAPI 应用实例。"""
    logging.basicConfig(level=settings.app_log_level)

    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        description="TremorGuard 后端服务",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix="/api/v1")
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(me.router, prefix="/api/v1")
    app.include_router(patients.router, prefix="/api/v1")
    app.include_router(devices.router, prefix="/api/v1")

    @app.get("/", tags=["root"])
    async def root() -> dict[str, str]:
        return {
            "name": settings.app_name,
            "version": __version__,
            "env": settings.app_env,
        }

    return app


app = create_app()


def run() -> None:
    """供 [project.scripts] 调用的启动入口。"""
    import uvicorn

    uvicorn.run(
        "tremorguard_backend.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.is_development,
    )


if __name__ == "__main__":
    run()
