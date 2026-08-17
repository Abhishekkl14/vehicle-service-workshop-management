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
from app.schemas.work_order_service import (
    WorkOrderServiceCreate,
    WorkOrderServiceResponse,
)
from app.services.work_order_services_service import (
    WorkOrderServicesService,
)


router = APIRouter(
    prefix="/api/v1/work-orders",
    tags=["Work Order Services"]
)


@router.get(
    "/{work_order_id}/services",
    response_model=list[WorkOrderServiceResponse]
)
def get_work_order_services(
    work_order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = WorkOrderServicesService(db)

    try:
        return service.get_work_order_services_for_user(
            work_order_id,
            current_user,
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )


@router.post(
    "/{work_order_id}/services",
    response_model=WorkOrderServiceResponse,
    status_code=status.HTTP_201_CREATED
)
def add_work_order_service(
    work_order_id: int,
    data: WorkOrderServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = WorkOrderServicesService(db)

    try:
        return service.add_work_order_service_for_user(
            work_order_id=work_order_id,
            data=data,
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
            detail=str(exc)
        )
