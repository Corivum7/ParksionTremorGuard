"""健康检查端点示例测试。"""

from httpx import AsyncClient


async def test_live(client: AsyncClient) -> None:
    """存活探针应返回 ok。"""
    response = await client.get("/api/v1/health/live")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


async def test_ready(client: AsyncClient) -> None:
    """就绪探针应返回数据库连通。"""
    response = await client.get("/api/v1/health/ready")
    assert response.status_code == 200
    assert response.json()["db"] == "up"
