from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.part import (
    WorkOrderPartCreate,
    WorkOrderPartResponse,
)
from app.services.work_order_part_service import (
    WorkOrderPartService,
)


router = APIRouter(
    prefix="/api/v1/work-orders",
    tags=["Work Order Parts"]
)


@router.get(
    "/{work_order_id}/parts",
    response_model=list[WorkOrderPartResponse]
)
def get_work_order_parts(
    work_order_id: int,
    db: Session = Depends(get_db)
):
    service = WorkOrderPartService(db)

    return service.get_work_order_parts(
        work_order_id
    )


@router.post(
    "/{work_order_id}/parts",
    response_model=WorkOrderPartResponse,
    status_code=status.HTTP_201_CREATED
)
def add_work_order_part(
    work_order_id: int,
    data: WorkOrderPartCreate,
    db: Session = Depends(get_db)
):
    service = WorkOrderPartService(db)

    try:
        return service.add_part(
            work_order_id=work_order_id,
            part_id=data.part_id,
            quantity=data.quantity,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )