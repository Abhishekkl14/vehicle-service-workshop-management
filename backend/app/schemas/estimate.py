from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class EstimateCreate(BaseModel):
    work_order_id: int

    discount_amount: Decimal = Field(
        default=Decimal("0.00"),
        ge=0
    )


class EstimateItemResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    estimate_id: int
    item_type: str
    description: str
    quantity: Decimal
    unit_price: Decimal
    estimated_minutes: int
    total_price: Decimal


class EstimateResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    work_order_id: int
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    estimated_duration_minutes: int
    status: str
    created_at: datetime
    sent_at: datetime | None
    expires_at: datetime | None