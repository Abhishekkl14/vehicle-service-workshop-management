from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.core.auth_dependency import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.inspection import (
    InspectionCreate,
    InspectionItemCreate,
    InspectionItemResponse,
    InspectionResponse,
)
from app.services.inspection_service import InspectionService


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
    current_user: User = Depends(get_current_user),
):
    service = InspectionService(db)

    try:
        inspection = service.get_inspection_for_user(
            inspection_id,
            current_user,
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
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
    current_user: User = Depends(get_current_user),
):
    service = InspectionService(db)

    try:

        return service.create_inspection_for_user(
            work_order_id=data.work_order_id,
            mechanic_id=data.mechanic_id,
            overall_notes=data.overall_notes,
            current_user=current_user,
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
    current_user: User = Depends(get_current_user),
):
    service = InspectionService(db)

    try:

        return service.add_inspection_item_for_user(
            inspection_id=inspection_id,
            component=data.component,
            condition=data.condition,
            severity=data.severity,
            notes=data.notes,
            recommended_action=data.recommended_action,
            current_user=current_user,
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
# GET INSPECTION ITEMS
# =========================================================

@router.get(
    "/{inspection_id}/items",
    response_model=list[InspectionItemResponse],
)
def get_inspection_items(
    inspection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = InspectionService(db)

    try:

        return service.get_inspection_items_for_user(
            inspection_id,
            current_user,
        )

    except PermissionError as exc:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
