from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.service import ServiceResponse
from app.services.service_catalog_service import (
    ServiceCatalogService,
)


router = APIRouter(
    prefix="/api/v1/services",
    tags=["Services"],
)


@router.get(
    "/",
    response_model=list[ServiceResponse],
)
def get_active_services(
    db: Session = Depends(get_db),
):
    service = ServiceCatalogService(db)

    return service.get_active_services()


@router.get(
    "/{service_id}",
    response_model=ServiceResponse,
)
def get_service(
    service_id: int,
    db: Session = Depends(get_db),
):
    service = ServiceCatalogService(db)

    result = service.get_service(
        service_id
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    return result