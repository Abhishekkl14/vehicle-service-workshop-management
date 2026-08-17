from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class InvoiceItemResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    invoice_id: int
    item_type: str | None
    description: str
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal


class InvoiceResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    work_order_id: int
    invoice_number: str
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    status: str
    issued_at: datetime
    due_at: datetime | None
    items: list[InvoiceItemResponse] = []