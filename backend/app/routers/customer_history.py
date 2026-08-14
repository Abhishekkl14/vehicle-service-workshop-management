from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth_dependency import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.customer_history import (
    CustomerServiceHistoryResponse,
)
from app.services.customer_history_service import (
    CustomerHistoryService,
)


router = APIRouter(
    prefix="/api/v1/customers",
    tags=["Customer Service History"]
)


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
