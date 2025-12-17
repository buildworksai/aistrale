"""Data residency region management API endpoints."""


import structlog
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from api.deps import get_current_user_id
from models.region import Region
from services.region_service import RegionService

logger = structlog.get_logger()
router = APIRouter()


class RegionInfo(BaseModel):
    code: str
    name: str
    is_allowed: bool


@router.get("/", response_model=list[RegionInfo])
def list_regions(
    request: Request,
    user_id: int = Depends(get_current_user_id),
) -> list[RegionInfo]:
    """List all available regions and their status."""
    region_service = RegionService()
    allowed_regions = region_service.get_supported_regions()

    regions = []
    for region in Region:
        regions.append(
            RegionInfo(
                code=region.value,
                name=region.value.replace("-", " ").title(),
                is_allowed=region in allowed_regions,
            )
        )

    return regions


@router.get("/default")
def get_default_region(
    request: Request,
    user_id: int = Depends(get_current_user_id),
) -> dict:
    """Get the default region."""
    region_service = RegionService()
    default_region = region_service.get_default_region()

    return {
        "code": default_region.value,
        "name": default_region.value.replace("-", " ").title(),
    }
