from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ServiceResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    name: str
    description: str | None
    base_price: Decimal
    estimated_duration_minutes: int
    is_active: bool