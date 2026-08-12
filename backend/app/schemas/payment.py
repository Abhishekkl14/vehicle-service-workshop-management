from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PaymentCreate(BaseModel):
    invoice_id: int
    amount: Decimal
    payment_method: str
    transaction_reference: str | None = None


class PaymentResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    invoice_id: int
    amount: Decimal
    payment_method: str
    transaction_reference: str | None
    status: str
    paid_at: datetime