from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.database.database import get_db
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
    db: Session = Depends(get_db)
):
    service = PartService(db)

    return service.get_active_parts()


@router.get(
    "/{part_id}",
    response_model=PartResponse
)
def get_part(
    part_id: int,
    db: Session = Depends(get_db)
):
    service = PartService(db)

    part = service.get_part(part_id)

    if not part:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Part not found"
        )

    return part