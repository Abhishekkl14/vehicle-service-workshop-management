from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inspection import Inspection
from app.models.inspection_item import InspectionItem
from app.models.user import User
from app.models.work_order import WorkOrder
from app.repositories.inspection_repository import (
    InspectionRepository,
)


class InspectionService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = InspectionRepository(db)

    def get_inspection(
        self,
        inspection_id: int
    ):
        return self.repository.get_by_id(
            inspection_id
        )

    def create_inspection(
        self,
        work_order_id: int,
        mechanic_id: int,
        overall_notes: str | None,
    ):

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

        # Prevent duplicate inspection
        existing = self.repository.get_by_work_order(
            work_order_id
        )

        if existing:
            raise ValueError(
                "Inspection already exists for this work order"
            )

        # Verify mechanic
        mechanic = self.db.scalar(
            select(User).where(
                User.id == mechanic_id
            )
        )

        if not mechanic:
            raise ValueError(
                "Mechanic not found"
            )

        if mechanic.role.name != "MECHANIC":
            raise ValueError(
                "User is not a mechanic"
            )

        inspection = Inspection(
            work_order_id=work_order_id,
            mechanic_id=mechanic_id,
            overall_notes=overall_notes,
        )

        work_order.status = "INSPECTION"

        return self.repository.create(
            inspection
        )

    def add_inspection_item(
        self,
        inspection_id: int,
        component: str,
        condition: str,
        severity: str,
        notes: str | None,
        recommended_action: str | None,
    ):

        inspection = self.repository.get_by_id(
            inspection_id
        )

        if not inspection:
            raise ValueError(
                "Inspection not found"
            )

        item = InspectionItem(
            inspection_id=inspection_id,
            component=component,
            condition=condition,
            severity=severity,
            notes=notes,
            recommended_action=recommended_action,
        )

        return self.repository.add_item(item)

    def get_inspection_items(
        self,
        inspection_id: int
    ):

        inspection = self.repository.get_by_id(
            inspection_id
        )

        if not inspection:
            raise ValueError(
                "Inspection not found"
            )

        return self.repository.get_items(
            inspection_id
        )