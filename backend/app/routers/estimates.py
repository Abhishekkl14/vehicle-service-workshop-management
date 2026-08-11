from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.estimate import (
    EstimateCreate,
    EstimateResponse,
)
from app.services.estimate_service import EstimateService


router = APIRouter(
    prefix="/api/v1/estimates",
    tags=["Estimates"]
)


@router.get(
    "/{estimate_id}",
    response_model=EstimateResponse
)
def get_estimate(
    estimate_id: int,
    db: Session = Depends(get_db)
):
    service = EstimateService(db)

    estimate = service.get_estimate(
        estimate_id
    )

    if not estimate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estimate not found"
        )

    return estimate


@router.get(
    "/work-order/{work_order_id}",
    response_model=list[EstimateResponse]
)
def get_work_order_estimates(
    work_order_id: int,
    db: Session = Depends(get_db)
):
    service = EstimateService(db)

    return service.get_work_order_estimates(
        work_order_id
    )


@router.post(
    "/{estimate_id}/send",
    response_model=EstimateResponse
)
def send_estimate(
    estimate_id: int,
    db: Session = Depends(get_db)
):
    service = EstimateService(db)

    try:
        return service.send_estimate(
            estimate_id
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )