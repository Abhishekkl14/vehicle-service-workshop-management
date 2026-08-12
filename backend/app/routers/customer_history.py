from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
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
    db: Session = Depends(get_db)
):

    service = CustomerHistoryService(db)

    return service.get_customer_history(
        customer_id
    )