from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    ForeignKey,
    Numeric,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    invoice_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "invoices.id",
            ondelete="CASCADE"
        ),
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

    item_type: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    invoice = relationship(
        "Invoice",
        backref="items"
    )