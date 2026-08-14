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
from app.schemas.estimate import (
    EstimateCreate,
    EstimateResponse,
)
from app.services.estimate_service import EstimateService


router = APIRouter(
    prefix="/api/v1/estimates",
    tags=["Estimates"],
)


# =========================================================
# GET CUSTOMER ESTIMATES
# =========================================================

@router.get(
    "/customer/me",
    response_model=list[EstimateResponse],
)
def get_customer_estimates(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "CUSTOMER",
        )
    ),
):
    service = EstimateService(db)

    return service.get_customer_estimates_for_user(
        current_user
    )


# =========================================================
# GET ESTIMATE
# =========================================================

@router.get(
    "/{estimate_id}",
    response_model=EstimateResponse,
)
def get_estimate(
    estimate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = EstimateService(db)

    estimate = service.get_estimate_for_user(
        estimate_id=estimate_id,
        current_user=current_user,
    )

    if not estimate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estimate not found",
        )

    return estimate


# =========================================================
# GET ESTIMATES FOR WORK ORDER
# =========================================================

@router.get(
    "/work-order/{work_order_id}",
    response_model=list[EstimateResponse],
)
def get_work_order_estimates(
    work_order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = EstimateService(db)

    return service.get_work_order_estimates_for_user(
        work_order_id=work_order_id,
        current_user=current_user,
    )


# =========================================================
# CREATE ESTIMATE
# =========================================================

@router.post(
    "/",
    response_model=EstimateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_estimate(
    data: EstimateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SERVICE_ADVISOR",
            "ADMIN",
        )
    ),
):
    service = EstimateService(db)

    try:

        return service.create_estimate(
            work_order_id=data.work_order_id,
            discount_amount=data.discount_amount,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


# =========================================================
# SEND ESTIMATE
# =========================================================

@router.post(
    "/{estimate_id}/send",
    response_model=EstimateResponse,
)
def send_estimate(
    estimate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SERVICE_ADVISOR",
            "ADMIN",
        )
    ),
):
    service = EstimateService(db)

    try:

        return service.send_estimate(
            estimate_id
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )