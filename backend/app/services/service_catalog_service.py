from sqlalchemy.orm import Session

from app.repositories.service_repository import (
    ServiceRepository,
)


class ServiceCatalogService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = ServiceRepository(db)

    def get_service(
        self,
        service_id: int
    ):
        return self.repository.get_by_id(
            service_id
        )

    def get_active_services(self):
        return self.repository.get_active_services()