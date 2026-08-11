from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.estimate import Estimate
from app.models.estimate_item import EstimateItem


class EstimateRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(
        self,
        estimate_id: int
    ) -> Estimate | None:

        statement = select(Estimate).where(
            Estimate.id == estimate_id
        )

        return self.db.scalar(statement)

    def get_by_work_order(
        self,
        work_order_id: int
    ) -> list[Estimate]:

        statement = (
            select(Estimate)
            .where(
                Estimate.work_order_id == work_order_id
            )
            .order_by(Estimate.id)
        )

        return list(
            self.db.scalars(statement).all()
        )

    def create(
        self,
        estimate: Estimate
    ) -> Estimate:

        self.db.add(estimate)
        self.db.commit()
        self.db.refresh(estimate)

        return estimate

    def add_item(
        self,
        item: EstimateItem
    ) -> EstimateItem:

        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)

        return item