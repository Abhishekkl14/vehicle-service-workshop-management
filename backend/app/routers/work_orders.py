from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.core.auth_dependency import (
    get_current_user,
    require_roles,
)
from app.database.database import get_db
from app.models.user import User
from app.schemas.work_order import (
    WorkOrderApproveRequest,
    WorkOrderApprovalResponse,
    WorkOrderCreate,
    WorkOrderRejectRequest,
    WorkOrderResponse,
)
from app.services.work_order_service import WorkOrderService


router = APIRouter(
    prefix="/api/v1/work-orders",
    tags=["Work Orders"],
)


# =========================================================
# GET WORK ORDERS PENDING ADVISOR APPROVAL
# =========================================================

@router.get(
    "/pending-approval",
    response_model=list[WorkOrderResponse],
)
def get_pending_approval_work_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SERVICE_ADVISOR",
            "ADMIN",
        )
    ),
):
    service = WorkOrderService(db)

    return service.get_pending_approval_work_orders()


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
    current_user: User = Depends(get_current_user),
):
    service = WorkOrderService(db)

    try:
        work_order = service.get_work_order_for_user(
            work_order_id,
            current_user,
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
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
    current_user: User = Depends(get_current_user),
):
    service = WorkOrderService(db)

    try:
        return service.get_work_orders_by_status_for_user(
            work_order_status,
            current_user,
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
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
    current_user: User = Depends(get_current_user),
):
    service = WorkOrderService(db)

    try:

        return service.start_work_order_for_user(
            work_order_id,
            current_user,
        )

    except PermissionError as exc:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


# =========================================================
# SUBMIT WORK ORDER FOR ADVISOR APPROVAL
# =========================================================

@router.post(
    "/{work_order_id}/submit-for-approval",
    response_model=WorkOrderResponse,
)
def submit_work_order_for_approval(
    work_order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = WorkOrderService(db)

    try:

        return service.submit_work_order_for_approval_for_user(
            work_order_id,
            current_user,
        )

    except PermissionError as exc:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
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
    current_user: User = Depends(get_current_user),
):
    service = WorkOrderService(db)

    try:

        return service.complete_work_order_for_user(
            work_order_id,
            current_user,
        )

    except PermissionError as exc:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


# =========================================================
# APPROVE WORK ORDER
# =========================================================

@router.post(
    "/{work_order_id}/approve",
    response_model=WorkOrderResponse,
)
def approve_work_order(
    work_order_id: int,
    data: WorkOrderApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SERVICE_ADVISOR",
            "ADMIN",
        )
    ),
):
    service = WorkOrderService(db)

    try:

        return service.approve_work_order(
            work_order_id=work_order_id,
            advisor_id=current_user.id,
            comments=data.comments,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


# =========================================================
# REJECT WORK ORDER
# =========================================================

@router.post(
    "/{work_order_id}/reject",
    response_model=WorkOrderResponse,
)
def reject_work_order(
    work_order_id: int,
    data: WorkOrderRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SERVICE_ADVISOR",
            "ADMIN",
        )
    ),
):
    service = WorkOrderService(db)

    try:

        return service.reject_work_order(
            work_order_id=work_order_id,
            advisor_id=current_user.id,
            rejection_reason=data.rejection_reason,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


# =========================================================
# GET WORK ORDER APPROVAL HISTORY
# =========================================================

@router.get(
    "/{work_order_id}/approvals",
    response_model=list[WorkOrderApprovalResponse],
)
def get_work_order_approvals(
    work_order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SERVICE_ADVISOR",
            "ADMIN",
        )
    ),
):
    service = WorkOrderService(db)

    try:

        work_order = service.get_work_order(
            work_order_id
        )

    except PermissionError as exc:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )

    if not work_order:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work order not found",
        )

    return service.get_work_order_approvals(
        work_order_id
    )
