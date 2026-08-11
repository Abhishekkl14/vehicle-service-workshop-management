from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    booking_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("bookings.id"),
        unique=True,
        nullable=False
    )

    vehicle_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("vehicles.id"),
        nullable=False
    )

    assigned_mechanic_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(40),
        default="CREATED",
        nullable=False
    )

    complaint: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    received_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    booking = relationship(
        "Booking",
        backref="work_order"
    )

    vehicle = relationship(
        "Vehicle",
        backref="work_orders"
    )

    mechanic = relationship(
        "User",
        backref="assigned_work_orders"
    )