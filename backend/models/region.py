from enum import Enum

from pydantic import BaseModel


class Region(str, Enum):
    US_EAST_1 = "us-east-1"
    US_WEST_2 = "us-west-2"
    EU_CENTRAL_1 = "eu-central-1"
    EU_WEST_1 = "eu-west-1"
    APAC_SE_1 = "apac-se-1"


class DataRegionConfig(BaseModel):
    allowed_regions: list[Region]
    default_region: Region = Region.US_EAST_1
