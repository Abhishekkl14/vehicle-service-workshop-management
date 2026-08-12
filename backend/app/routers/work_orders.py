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
from app.core.auth_dependency import require_roles


router = APIRouter(
    prefix="/api/v1/work-orders",
    tags=["Work Orders"],
)


# =========================================================
# GET WORK ORDER
# =========================================================

@router.get(
    "/{work_order_id}",
    response_model=WorkOrderResponse,
)
def get_work_order(
    work_order_id: int,
    db: Session = Depends(get_db),
):
    service = WorkOrderService(db)

    work_order = service.get_work_order(
        work_order_id
    )

    if not work_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work order not found",
        )

    return work_order


# =========================================================
# GET WORK ORDERS BY STATUS
# =========================================================

@router.get(
    "/status/{work_order_status}",
    response_model=list[WorkOrderResponse],
)
def get_work_orders_by_status(
    work_order_status: str,
    db: Session = Depends(get_db),
):
    service = WorkOrderService(db)

    return service.get_by_status(
        work_order_status
    )


# =========================================================
# CREATE WORK ORDER
# =========================================================

@router.post(
    "/",
    response_model=WorkOrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_work_order(
    data: WorkOrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SERVICE_ADVISOR",
            "ADMIN",
        )
    ),
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
            detail=str(exc),
        )


# =========================================================
# START WORK ORDER
# =========================================================

@router.post(
    "/{work_order_id}/start",
    response_model=WorkOrderResponse,
)
def start_work_order(
    work_order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "MECHANIC",
            "SERVICE_ADVISOR",
            "ADMIN",
        )
    ),
):
    service = WorkOrderService(db)

    try:

        return service.start_work_order(
            work_order_id
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


# =========================================================
# COMPLETE WORK ORDER
# =========================================================

@router.post(
    "/{work_order_id}/complete",
    response_model=WorkOrderResponse,
)
def complete_work_order(
    work_order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "MECHANIC",
            "SERVICE_ADVISOR",
            "ADMIN",
        )
    ),
):
    service = WorkOrderService(db)

    try:

        return service.complete_work_order(
            work_order_id
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )