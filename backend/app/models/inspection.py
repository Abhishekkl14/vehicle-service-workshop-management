from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Inspection(Base):
    __tablename__ = "inspections"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    work_order_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("work_orders.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )

    mechanic_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False
    )

    overall_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    inspected_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    work_order = relationship(
        "WorkOrder",
        backref="inspection"
    )

    mechanic = relationship(
        "User",
        backref="inspections"
    )