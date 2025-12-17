from unittest.mock import MagicMock

import pytest
from fastapi import Request, Response

from core.region_middleware import RegionMiddleware
from models.region import Region
from services.region_service import RegionService


@pytest.fixture
def region_service():
    return RegionService()


def test_region_service_defaults(region_service):
    assert region_service.get_default_region() == Region.US_EAST_1
    assert Region.EU_CENTRAL_1 in region_service.get_supported_regions()


def test_is_region_allowed(region_service):
    assert region_service.is_region_allowed("us-east-1")
    assert region_service.is_region_allowed("eu-central-1")
    assert not region_service.is_region_allowed("invalid-region")


def test_validate_workspace_region(region_service):
    # Should not raise
    region_service.validate_workspace_region("us-east-1")

    with pytest.raises(ValueError):
        region_service.validate_workspace_region("mars-north-1")


@pytest.mark.asyncio
async def test_middleware_allowed_region():
    service = RegionService()
    app = MagicMock()
    middleware = RegionMiddleware(app, service)

    async def call_next(request):
        return Response(content="OK", status_code=200)

    request = MagicMock(spec=Request)
    request.headers = {"X-Region": "us-east-1"}

    response = await middleware.dispatch(request, call_next)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_middleware_blocked_region():
    service = RegionService()
    app = MagicMock()
    middleware = RegionMiddleware(app, service)

    async def call_next(request):
        return Response(content="OK", status_code=200)

    request = MagicMock(spec=Request)
    request.headers = {"X-Region": "invalid-region"}

    response = await middleware.dispatch(request, call_next)
    assert response.status_code == 400
    # response content is JSON, but we check verification by status code here
    # for simplicity
