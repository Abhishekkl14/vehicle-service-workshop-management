from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.work_order_service import WorkOrderService


class WorkOrderServiceRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(
        self,
        work_order_service_id: int
    ) -> WorkOrderService | None:

        statement = select(WorkOrderService).where(
            WorkOrderService.id == work_order_service_id
        )

        return self.db.scalar(statement)

    def get_by_work_order(
        self,
        work_order_id: int
    ) -> list[WorkOrderService]:

        statement = (
            select(WorkOrderService)
            .where(
                WorkOrderService.work_order_id == work_order_id
            )
            .order_by(WorkOrderService.id)
        )

        return list(
            self.db.scalars(statement).all()
        )

    def count_actual_by_work_order(
        self,
        work_order_id: int
    ) -> int:

        statement = (
            select(func.count(WorkOrderService.id))
            .where(
                WorkOrderService.work_order_id == work_order_id,
                WorkOrderService.source == "ACTUAL",
            )
        )

        return self.db.scalar(statement) or 0

    def create(
        self,
        work_order_service: WorkOrderService
    ) -> WorkOrderService:

        self.db.add(work_order_service)
        self.db.commit()
        self.db.refresh(work_order_service)

        return work_order_service
