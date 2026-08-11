from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.work_order import (
    WorkOrderCreate,
    WorkOrderResponse,
)
from app.services.work_order_service import WorkOrderService


router = APIRouter(
    prefix="/api/v1/work-orders",
    tags=["Work Orders"]
)


@router.get(
    "/{work_order_id}",
    response_model=WorkOrderResponse
)
def get_work_order(
    work_order_id: int,
    db: Session = Depends(get_db)
):
    service = WorkOrderService(db)

    work_order = service.get_work_order(
        work_order_id
    )

    if not work_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work order not found"
        )

    return work_order


@router.get(
    "/status/{work_order_status}",
    response_model=list[WorkOrderResponse]
)
def get_work_orders_by_status(
    work_order_status: str,
    db: Session = Depends(get_db)
):
    service = WorkOrderService(db)

    return service.get_by_status(
        work_order_status
    )


@router.post(
    "/",
    response_model=WorkOrderResponse,
    status_code=status.HTTP_201_CREATED
)
def create_work_order(
    data: WorkOrderCreate,
    db: Session = Depends(get_db)
):
    service = WorkOrderService(db)

    try:

        return service.create_work_order(
            booking_id=data.booking_id,
            vehicle_id=data.vehicle_id,
            complaint=data.complaint,
            mechanic_id=data.mechanic_id,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )

@router.post(
    "/{work_order_id}/start",
    response_model=WorkOrderResponse
)
def start_work_order(
    work_order_id: int,
    db: Session = Depends(get_db)
):
    service = WorkOrderService(db)

    try:
        return service.start_work_order(
            work_order_id
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )

@router.post(
    "/{work_order_id}/complete",
    response_model=WorkOrderResponse
)
def complete_work_order(
    work_order_id: int,
    db: Session = Depends(get_db)
):
    service = WorkOrderService(db)

    try:
        return service.complete_work_order(
            work_order_id
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )