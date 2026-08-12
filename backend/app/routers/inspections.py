from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.inspection import (
    InspectionCreate,
    InspectionItemCreate,
    InspectionItemResponse,
    InspectionResponse,
)
from app.services.inspection_service import InspectionService
from app.core.auth_dependency import require_roles


router = APIRouter(
    prefix="/api/v1/inspections",
    tags=["Inspections"],
)


# =========================================================
# GET INSPECTION
# =========================================================

@router.get(
    "/{inspection_id}",
    response_model=InspectionResponse,
)
def get_inspection(
    inspection_id: int,
    db: Session = Depends(get_db),
):
    service = InspectionService(db)

    inspection = service.get_inspection(
        inspection_id
    )

    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found",
        )

    return inspection


# =========================================================
# CREATE INSPECTION
# =========================================================

@router.post(
    "/",
    response_model=InspectionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_inspection(
    data: InspectionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "MECHANIC",
            "SERVICE_ADVISOR",
            "ADMIN",
        )
    ),
):
    service = InspectionService(db)

    try:

        return service.create_inspection(
            work_order_id=data.work_order_id,
            mechanic_id=data.mechanic_id,
            overall_notes=data.overall_notes,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


# =========================================================
# ADD INSPECTION ITEM
# =========================================================

@router.post(
    "/{inspection_id}/items",
    response_model=InspectionItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_inspection_item(
    inspection_id: int,
    data: InspectionItemCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "MECHANIC",
            "SERVICE_ADVISOR",
            "ADMIN",
        )
    ),
):
    service = InspectionService(db)

    try:

        return service.add_inspection_item(
            inspection_id=inspection_id,
            component=data.component,
            condition=data.condition,
            severity=data.severity,
            notes=data.notes,
            recommended_action=data.recommended_action,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


# =========================================================
# GET INSPECTION ITEMS
# =========================================================

@router.get(
    "/{inspection_id}/items",
    response_model=list[InspectionItemResponse],
)
def get_inspection_items(
    inspection_id: int,
    db: Session = Depends(get_db),
):
    service = InspectionService(db)

    try:

        return service.get_inspection_items(
            inspection_id
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )