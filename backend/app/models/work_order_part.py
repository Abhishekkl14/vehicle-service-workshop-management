from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    ForeignKey,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class WorkOrderPart(Base):
    __tablename__ = "work_order_parts"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    work_order_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("work_orders.id", ondelete="CASCADE"),
        nullable=False
    )

    part_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("parts.id"),
        nullable=False
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )

    total_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )

    source: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="ESTIMATE"
    )

    work_order = relationship(
        "WorkOrder",
        backref="parts"
    )

    part = relationship(
        "Part",
        backref="work_order_parts"
    )