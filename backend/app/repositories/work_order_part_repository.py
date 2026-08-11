from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.work_order_part import WorkOrderPart


class WorkOrderPartRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(
        self,
        work_order_part_id: int
    ) -> WorkOrderPart | None:

        statement = select(WorkOrderPart).where(
            WorkOrderPart.id == work_order_part_id
        )

        return self.db.scalar(statement)

    def get_by_work_order(
        self,
        work_order_id: int
    ) -> list[WorkOrderPart]:

        statement = (
            select(WorkOrderPart)
            .where(
                WorkOrderPart.work_order_id == work_order_id
            )
            .order_by(WorkOrderPart.id)
        )

        return list(
            self.db.scalars(statement).all()
        )

    def create(
        self,
        work_order_part: WorkOrderPart
    ) -> WorkOrderPart:

        self.db.add(work_order_part)
        self.db.commit()
        self.db.refresh(work_order_part)

        return work_order_part