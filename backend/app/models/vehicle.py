from datetime import datetime

from sqlalchemy import (
    BigInteger,
    ForeignKey,
    Integer,
    String,
    DateTime,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    customer_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False
    )

    vehicle_type_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("vehicle_types.id"),
        nullable=True
    )

    registration_number: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False
    )

    vin: Mapped[str | None] = mapped_column(
        String(50),
        unique=True,
        nullable=True
    )

    make: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    model: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    manufacturing_year: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    color: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    mileage: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
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

    customer = relationship(
        "Customer",
        backref="vehicles"
    )

    vehicle_type = relationship(
        "VehicleType",
        backref="vehicles"
    )