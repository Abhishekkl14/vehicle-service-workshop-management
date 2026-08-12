from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.approval import (
    ApprovalCreate,
    ApprovalResponse,
)
from app.services.approval_service import (
    ApprovalService,
)
from app.core.auth_dependency import require_roles


router = APIRouter(
    prefix="/api/v1/estimates",
    tags=["Approvals"],
)


# =========================================================
# CREATE APPROVAL
# =========================================================

@router.post(
    "/{estimate_id}/approval",
    response_model=ApprovalResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_approval(
    estimate_id: int,
    data: ApprovalCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "CUSTOMER",
        )
    ),
):
    service = ApprovalService(db)

    try:

        return service.create_decision(
            estimate_id=estimate_id,
            customer_id=data.customer_id,
            decision=data.decision,
            comments=data.comments,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


# =========================================================
# GET APPROVALS
# =========================================================

@router.get(
    "/{estimate_id}/approvals",
    response_model=list[ApprovalResponse],
)
def get_approvals(
    estimate_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SERVICE_ADVISOR",
            "ADMIN",
        )
    ),
):
    service = ApprovalService(db)

    return service.get_estimate_approvals(
        estimate_id
    )