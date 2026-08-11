from sqlalchemy import (
    BigInteger,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class InspectionItem(Base):
    __tablename__ = "inspection_items"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    inspection_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("inspections.id", ondelete="CASCADE"),
        nullable=False
    )

    component: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    condition: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    severity: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    recommended_action: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    inspection = relationship(
        "Inspection",
        backref="items"
    )