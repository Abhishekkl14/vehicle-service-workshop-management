from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.part import Part
from app.models.user import User
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

    def get_work_order_parts_for_user(
        self,
        work_order_id: int,
        current_user: User,
    ):

        role = current_user.role.name

        # Mechanic → only assigned work orders
        if role == "MECHANIC":

            work_order = self.db.scalar(
                select(WorkOrder).where(
                    WorkOrder.id == work_order_id,
                    WorkOrder.assigned_mechanic_id == current_user.id,
                )
            )

            if not work_order:
                raise PermissionError(
                    "You do not have permission to access this resource"
                )

        # Staff roles → workshop access
        elif role not in {"ADMIN", "SERVICE_ADVISOR"}:

            raise PermissionError(
                "You do not have permission to access this resource"
            )

        return self.repository.get_by_work_order(
            work_order_id
        )

    def add_part_for_user(
        self,
        work_order_id: int,
        part_id: int,
        quantity: int,
        current_user: User,
    ):

        role = current_user.role.name

        # ------------------------------------------------
        # Mechanic → assigned work orders, IN_PROGRESS only,
        # records ACTUAL parts used
        # ------------------------------------------------
        if role == "MECHANIC":

            work_order = self.db.scalar(
                select(WorkOrder).where(
                    WorkOrder.id == work_order_id,
                    WorkOrder.assigned_mechanic_id == current_user.id,
                )
            )

            if not work_order:
                raise PermissionError(
                    "You do not have permission to access this resource"
                )

            if work_order.status != "IN_PROGRESS":
                raise ValueError(
                    "Actual parts can only be added to IN_PROGRESS work orders"
                )

            return self.add_part(
                work_order_id=work_order_id,
                part_id=part_id,
                quantity=quantity,
                source="ACTUAL",
            )

        # ------------------------------------------------
        # Staff roles → estimate preparation only,
        # restricted to CREATED / INSPECTION
        # ------------------------------------------------
        if role in {"SERVICE_ADVISOR", "ADMIN"}:

            work_order = self.db.scalar(
                select(WorkOrder).where(
                    WorkOrder.id == work_order_id,
                )
            )

            if not work_order:
                raise ValueError(
                    "Work order not found"
                )

            if work_order.status not in {
                "CREATED",
                "INSPECTION",
            }:
                raise ValueError(
                    "Estimate parts can only be added to "
                    "CREATED or INSPECTION work orders"
                )

            return self.add_part(
                work_order_id=work_order_id,
                part_id=part_id,
                quantity=quantity,
                source="ESTIMATE",
            )

        raise PermissionError(
            "You do not have permission to add work order parts"
        )

    def add_part(
        self,
        work_order_id: int,
        part_id: int,
        quantity: int,
        source: str = "ESTIMATE",
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

        # Verify part — lock the row BEFORE checking stock to
        # prevent concurrent overselling (SELECT … FOR UPDATE)
        part = self.db.scalar(
            select(Part)
            .where(
                Part.id == part_id,
                Part.is_active.is_(True),
            )
            .with_for_update()
        )

        if not part:
            raise ValueError(
                "Part not found or inactive"
            )

        # Check for existing row (same work_order + part)
        existing = self.repository.get_by_work_order_and_part(
            work_order_id, part_id
        )

        if existing is not None:

            additional = quantity

            if part.stock_quantity < additional:
                raise ValueError(
                    "Insufficient part stock"
                )

            part.stock_quantity -= additional
            existing.quantity += additional
            existing.total_price = (
                existing.unit_price * existing.quantity
            )

            self.db.commit()
            self.db.refresh(existing)

            return existing

        # Check stock
        if part.stock_quantity < quantity:
            raise ValueError(
                "Insufficient part stock"
            )

        part.stock_quantity -= quantity

        # Calculate price from current part price
        unit_price = Decimal(part.unit_price)

        total_price = unit_price * quantity

        work_order_part = WorkOrderPart(
            work_order_id=work_order_id,
            part_id=part_id,
            quantity=quantity,
            unit_price=unit_price,
            total_price=total_price,
            source=source,
        )

        return self.repository.create(
            work_order_part
        )