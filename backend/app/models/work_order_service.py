from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class WorkOrderService(Base):
    __tablename__ = "work_order_services"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    work_order_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("work_orders.id", ondelete="CASCADE"),
        nullable=False
    )

    service_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("services.id"),
        nullable=True
    )

    item_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    quantity: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("1.00")
    )

    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )

    total_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )

    estimated_minutes: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    source: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    work_order = relationship(
        "WorkOrder",
        backref="work_order_services"
    )

    service = relationship(
        "Service",
        backref="work_order_services"
    )
