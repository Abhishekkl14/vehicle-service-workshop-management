from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.work_order_approval import (
    WorkOrderApproval,
)


class WorkOrderApprovalRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_work_order(
        self,
        work_order_id: int
    ) -> list[WorkOrderApproval]:

        statement = (
            select(WorkOrderApproval)
            .where(
                WorkOrderApproval.work_order_id
                == work_order_id
            )
            .order_by(WorkOrderApproval.id)
        )

        return list(
            self.db.scalars(statement).all()
        )

    def create(
        self,
        approval: WorkOrderApproval
    ) -> WorkOrderApproval:

        self.db.add(approval)
        self.db.flush()

        return approval
