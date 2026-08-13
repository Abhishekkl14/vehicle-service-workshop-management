from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth_dependency import get_current_user
from app.database.database import get_db
from app.models.customer import Customer
from app.models.user import User
from app.schemas.auth import TokenResponse
from app.services.auth_service import AuthService


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):

    service = AuthService(db)

    try:
        token = service.login(
            email=form_data.username,
            password=form_data.password,
        )

        return TokenResponse(
            access_token=token
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )


@router.get("/me")
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    customer_id = None

    # --------------------------------------------------
    # Get linked customer for CUSTOMER users
    # --------------------------------------------------

    if current_user.role.name == "CUSTOMER":

        customer = db.scalar(
            select(Customer).where(
                Customer.user_id == current_user.id
            )
        )

        if customer:
            customer_id = customer.id

    # --------------------------------------------------
    # Return current user
    # --------------------------------------------------

    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role.name,
        "customer_id": customer_id,
    }