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

    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    approved_by: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=True
    )

    rejected_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    rejected_by: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=True
    )

    rejection_reason: Mapped[str | None] = mapped_column(
        Text,
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
        foreign_keys=[assigned_mechanic_id],
        backref="assigned_work_orders"
    )

    approved_by_user = relationship(
        "User",
        foreign_keys=[approved_by],
        backref="approved_work_orders"
    )

    rejected_by_user = relationship(
        "User",
        foreign_keys=[rejected_by],
        backref="rejected_work_orders"
    )