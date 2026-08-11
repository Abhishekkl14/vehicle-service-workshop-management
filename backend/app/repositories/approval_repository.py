from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.approval import Approval


class ApprovalRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(
        self,
        approval_id: int
    ) -> Approval | None:

        statement = select(Approval).where(
            Approval.id == approval_id
        )

        return self.db.scalar(statement)

    def get_by_estimate(
        self,
        estimate_id: int
    ) -> list[Approval]:

        statement = (
            select(Approval)
            .where(
                Approval.estimate_id == estimate_id
            )
            .order_by(Approval.id)
        )

        return list(
            self.db.scalars(statement).all()
        )

    def create(
        self,
        approval: Approval
    ) -> Approval:

        self.db.add(approval)
        self.db.flush()

        return approval