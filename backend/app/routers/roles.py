from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.role_service import RoleService


router = APIRouter(
    prefix="/api/v1/roles",
    tags=["Roles"]
)


@router.get("/")
def get_roles(
    db: Session = Depends(get_db)
):
    service = RoleService(db)

    return service.get_all_roles()