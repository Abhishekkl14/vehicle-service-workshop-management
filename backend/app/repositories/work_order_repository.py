from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.work_order import WorkOrder


class WorkOrderRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(
        self,
        work_order_id: int
    ) -> WorkOrder | None:

        statement = select(WorkOrder).where(
            WorkOrder.id == work_order_id
        )

        return self.db.scalar(statement)

    def get_by_booking(
        self,
        booking_id: int
    ) -> WorkOrder | None:

        statement = select(WorkOrder).where(
            WorkOrder.booking_id == booking_id
        )

        return self.db.scalar(statement)

    def get_by_status(
        self,
        status: str
    ) -> list[WorkOrder]:

        statement = (
            select(WorkOrder)
            .where(WorkOrder.status == status)
            .order_by(WorkOrder.created_at)
        )

        return list(self.db.scalars(statement).all())

    def create(
        self,
        work_order: WorkOrder
    ) -> WorkOrder:

        self.db.add(work_order)
        self.db.commit()
        self.db.refresh(work_order)

        return work_order