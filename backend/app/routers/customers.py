from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.core.auth_dependency import (
    require_roles,
)
from app.database.database import get_db
from app.models.user import User
from app.schemas.customer import (
    CustomerDetailResponse,
)
from app.repositories.customer_repository import (
    CustomerRepository,
)


router = APIRouter(
    prefix="/api/v1/customers",
    tags=["Customers"],
)


# =========================================================
# GET ALL CUSTOMERS (SA / ADMIN)
# =========================================================

@router.get(
    "/",
    response_model=list[CustomerDetailResponse],
)
def get_all_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SERVICE_ADVISOR",
            "ADMIN",
        )
    ),
):
    repository = CustomerRepository(db)

    customers = repository.get_all()

    result = []

    for customer in customers:

        user = customer.user

        result.append(
            CustomerDetailResponse(
                id=customer.id,
                user_id=customer.user_id,
                address=customer.address,
                city=customer.city,
                first_name=user.first_name
                if user
                else None,
                last_name=user.last_name
                if user
                else None,
                email=user.email
                if user
                else None,
                phone=user.phone
                if user
                else None,
            )
        )

    return result
