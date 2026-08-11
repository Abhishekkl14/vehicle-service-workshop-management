from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.part import Part
from app.models.work_order import WorkOrder
from app.models.work_order_part import WorkOrderPart
from app.repositories.work_order_part_repository import (
    WorkOrderPartRepository,
)


class WorkOrderPartService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = WorkOrderPartRepository(db)

    def get_work_order_parts(
        self,
        work_order_id: int
    ):
        return self.repository.get_by_work_order(
            work_order_id
        )

    def add_part(
        self,
        work_order_id: int,
        part_id: int,
        quantity: int,
    ):

        if quantity <= 0:
            raise ValueError(
                "Quantity must be greater than zero"
            )

        # Verify work order
        work_order = self.db.scalar(
            select(WorkOrder).where(
                WorkOrder.id == work_order_id
            )
        )

        if not work_order:
            raise ValueError(
                "Work order not found"
            )

        # Verify part
        part = self.db.scalar(
            select(Part).where(
                Part.id == part_id,
                Part.is_active.is_(True)
            )
        )

        if not part:
            raise ValueError(
                "Part not found or inactive"
            )

        # Check stock
        if part.stock_quantity < quantity:
            raise ValueError(
                "Insufficient part stock"
            )

        # Calculate price from current part price
        unit_price = Decimal(part.unit_price)

        total_price = unit_price * quantity

        work_order_part = WorkOrderPart(
            work_order_id=work_order_id,
            part_id=part_id,
            quantity=quantity,
            unit_price=unit_price,
            total_price=total_price,
        )

        return self.repository.create(
            work_order_part
        )