"""Zeabur 入口：执行迁移并启动 FastAPI 服务。"""

import os
import subprocess
import sys


def run_migrations() -> None:
    """执行 Alembic 数据库迁移。"""
    try:
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if result.returncode == 0:
            print("[TremorGuard] Alembic migrations completed successfully.")
        else:
            print(f"[TremorGuard] Alembic migration warning: {result.stderr.strip()}")
    except Exception as exc:
        print(f"[TremorGuard] Alembic migration skipped: {exc}")


def main() -> None:
    """启动 uvicorn 服务器。"""
    import uvicorn

    host = os.environ.get("APP_HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", os.environ.get("APP_PORT", "8000")))

    run_migrations()

    print(f"[TremorGuard] Starting uvicorn on {host}:{port}")
    uvicorn.run(
        "tremorguard_backend.main:app",
        host=host,
        port=port,
        log_level=os.environ.get("APP_LOG_LEVEL", "info").lower(),
    )


if __name__ == "__main__":
    main()