from sqlalchemy.orm import Session

from app.core.auth_dependency import get_current_customer
from app.models.user import User
from app.repositories.customer_history_repository import (
    CustomerHistoryRepository,
)


class CustomerHistoryService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = CustomerHistoryRepository(db)

    def get_customer_history(
        self,
        customer_id: int
    ):

        return self.repository.get_by_customer(
            customer_id
        )

    def get_customer_history_for_user(
        self,
        customer_id: int,
        current_user: User,
    ):

        role = current_user.role.name

        # Customer → only their own service history
        if role == "CUSTOMER":

            current_customer = get_current_customer(
                current_user=current_user,
                db=self.db,
            )

            if customer_id != current_customer.id:
                return None

        # Staff roles → workshop access
        elif role not in {"ADMIN", "SERVICE_ADVISOR"}:

            raise PermissionError(
                "You do not have permission to access this resource"
            )

        return self.repository.get_by_customer(
            customer_id
        )