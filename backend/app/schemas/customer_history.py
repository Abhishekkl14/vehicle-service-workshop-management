from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class CustomerServiceHistoryResponse(BaseModel):

    customer_id: int

    first_name: str | None
    last_name: str | None

    vehicle_id: int | None
    registration_number: str | None
    make: str | None
    model: str | None

    booking_id: int | None
    booking_date: date | None

    service_name: str | None

    work_order_id: int | None
    work_order_status: str | None

    invoice_number: str | None
    invoice_total: Decimal | None
    invoice_status: str | None