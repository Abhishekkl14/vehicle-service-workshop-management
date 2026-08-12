from decimal import Decimal
from datetime import date

from sqlalchemy import Date, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class CustomerServiceHistory(Base):
    __tablename__ = "customer_service_history"

    customer_id: Mapped[int] = mapped_column(
        primary_key=True
    )

    first_name: Mapped[str | None]
    last_name: Mapped[str | None]

    vehicle_id: Mapped[int | None]
    registration_number: Mapped[str | None]
    make: Mapped[str | None]
    model: Mapped[str | None]

    booking_id: Mapped[int | None]
    booking_date: Mapped[date | None] = mapped_column(
        Date
    )

    service_name: Mapped[str | None]

    work_order_id: Mapped[int | None]
    work_order_status: Mapped[str | None]

    invoice_number: Mapped[str | None]

    invoice_total: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2)
    )

    invoice_status: Mapped[str | None]