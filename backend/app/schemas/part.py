from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PartResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    part_number: str
    name: str
    description: str | None
    unit_price: Decimal
    stock_quantity: int
    is_active: bool


class WorkOrderPartCreate(BaseModel):
    part_id: int
    quantity: int


class WorkOrderPartResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    work_order_id: int
    part_id: int
    quantity: int
    unit_price: Decimal
    total_price: Decimal