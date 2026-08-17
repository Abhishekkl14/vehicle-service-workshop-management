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
from app.schemas.part import PartResponse
from app.services.part_service import PartService


router = APIRouter(
    prefix="/api/v1/parts",
    tags=["Parts"]
)


@router.get(
    "/",
    response_model=list[PartResponse]
)
def get_active_parts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PartService(db)

    return service.get_active_parts()


@router.get(
    "/{part_id}",
    response_model=PartResponse
)
def get_part(
    part_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PartService(db)

    part = service.get_part(part_id)

    if not part:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Part not found"
        )

    return part