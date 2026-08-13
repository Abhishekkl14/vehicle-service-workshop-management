from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.service import Service


class ServiceRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(
        self,
        service_id: int
    ) -> Service | None:

        statement = select(Service).where(
            Service.id == service_id
        )

        return self.db.scalar(statement)

    def get_active_services(
        self
    ) -> list[Service]:

        statement = (
            select(Service)
            .where(
                Service.is_active.is_(True)
            )
            .order_by(Service.name)
        )

        return list(
            self.db.scalars(statement).all()
        )