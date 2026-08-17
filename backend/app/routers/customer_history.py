from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth_dependency import get_current_user, require_roles
from app.database.database import get_db
from app.models.user import User
from app.schemas.customer import CustomerDetailResponse
from app.schemas.customer_history import (
    CustomerServiceHistoryResponse,
)
from app.services.customer_history_service import (
    CustomerHistoryService,
)
from app.repositories.customer_repository import (
    CustomerRepository,
)


router = APIRouter(
    prefix="/api/v1/customers",
    tags=["Customers"]
)


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
                first_name=user.first_name if user else None,
                last_name=user.last_name if user else None,
                email=user.email if user else None,
                phone=user.phone if user else None,
            )
        )

    return result


@router.get(
    "/{customer_id}/service-history",
    response_model=list[
        CustomerServiceHistoryResponse
    ]
)
def get_customer_service_history(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    service = CustomerHistoryService(db)

    try:
        history = service.get_customer_history_for_user(
            customer_id,
            current_user,
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )

    if history is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service history not found",
        )

    return history
