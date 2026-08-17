from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.part import Part


class PartRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(
        self,
        part_id: int
    ) -> Part | None:

        statement = select(Part).where(
            Part.id == part_id,
            Part.is_active.is_(True),
        )

        return self.db.scalar(statement)

    def get_active_parts(self) -> list[Part]:

        statement = (
            select(Part)
            .where(Part.is_active.is_(True))
            .order_by(Part.name)
        )

        return list(
            self.db.scalars(statement).all()
        )