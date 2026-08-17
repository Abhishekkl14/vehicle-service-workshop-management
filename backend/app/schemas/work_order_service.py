from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class WorkOrderServiceCreate(BaseModel):
    service_id: int | None = None
    item_type: str
    description: str | None = None
    quantity: Decimal = Field(
        default=Decimal("1.00"),
        gt=0
    )
    unit_price: Decimal | None = Field(
        default=None,
        ge=0
    )
    estimated_minutes: int | None = Field(
        default=None,
        ge=0
    )
    notes: str | None = None


class WorkOrderServiceResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    work_order_id: int
    service_id: int | None
    item_type: str
    description: str
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal
    estimated_minutes: int | None
    source: str
    notes: str | None
