from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inspection import Inspection
from app.models.inspection_item import InspectionItem


class InspectionRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(
        self,
        inspection_id: int
    ) -> Inspection | None:

        statement = select(Inspection).where(
            Inspection.id == inspection_id
        )

        return self.db.scalar(statement)

    def get_by_work_order(
        self,
        work_order_id: int
    ) -> Inspection | None:

        statement = select(Inspection).where(
            Inspection.work_order_id == work_order_id
        )

        return self.db.scalar(statement)

    def create(
        self,
        inspection: Inspection
    ) -> Inspection:

        self.db.add(inspection)
        self.db.commit()
        self.db.refresh(inspection)

        return inspection

    def add_item(
        self,
        item: InspectionItem
    ) -> InspectionItem:

        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)

        return item

    def get_items(
        self,
        inspection_id: int
    ) -> list[InspectionItem]:

        statement = (
            select(InspectionItem)
            .where(
                InspectionItem.inspection_id == inspection_id
            )
            .order_by(InspectionItem.id)
        )

        return list(
            self.db.scalars(statement).all()
        )