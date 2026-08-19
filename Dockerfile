# TremorGuard 默认 Docker 入口（后端服务）
# Zeabur 自动检测此文件以启用 Docker 部署模式
# 如需部署前端，请在 Zeabur 服务环境变量中设置：ZBPACK_DOCKERFILE_PATH=Dockerfile.frontend

FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY tremorguard-backend/pyproject.toml tremorguard-backend/uv.lock ./

RUN uv sync --frozen --no-dev

COPY tremorguard-backend/ ./

ENV PYTHONUNBUFFERED=1
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && uvicorn tremorguard_backend.main:app --host 0.0.0.0 --port ${APP_PORT:-8000}"]
