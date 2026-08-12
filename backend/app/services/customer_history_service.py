from sqlalchemy.orm import Session

from app.repositories.customer_history_repository import (
    CustomerHistoryRepository,
)


class CustomerHistoryService:

    def __init__(self, db: Session):
        self.repository = CustomerHistoryRepository(db)

    def get_customer_history(
        self,
        customer_id: int
    ):

        return self.repository.get_by_customer(
            customer_id
        )