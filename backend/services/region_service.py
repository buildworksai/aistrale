import logging
from typing import List, Optional
from models.region import Region, DataRegionConfig

logger = logging.getLogger(__name__)

class RegionService:
    """
    Service to manage data residency regions.
    """
    
    def __init__(self):
        # In a real app, this might load from a DB or global config
        self.config = DataRegionConfig(
            allowed_regions=[
                Region.US_EAST_1, 
                Region.US_WEST_2, 
                Region.EU_CENTRAL_1
            ],
            default_region=Region.US_EAST_1
        )

    def get_supported_regions(self) -> List[Region]:
        return self.config.allowed_regions

    def is_region_allowed(self, region_code: str) -> bool:
        try:
            region = Region(region_code)
            return region in self.config.allowed_regions
        except ValueError:
            return False

    def get_default_region(self) -> Region:
        return self.config.default_region

    def validate_workspace_region(self, region_code: str):
        """
        Validates if a workspace can be created in the given region.
        Raises ValueError if invalid.
        """
        if not self.is_region_allowed(region_code):
            raise ValueError(f"Region '{region_code}' is not supported or allowed.")
