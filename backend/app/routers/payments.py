from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.core.auth_dependency import (
    get_current_user,
    require_roles,
)
from app.database.database import get_db
from app.models.user import User
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
)
from app.services.payment_service import PaymentService


router = APIRouter(
    prefix="/api/v1/payments",
    tags=["Payments"],
)


# =========================================================
# CREATE PAYMENT
# =========================================================

@router.post(
    "",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "CUSTOMER",
            "SERVICE_ADVISOR",
            "ADMIN",
        )
    ),
):
    service = PaymentService(db)

    try:

        return service.create_payment(
            invoice_id=data.invoice_id,
            amount=data.amount,
            payment_method=data.payment_method,
            transaction_reference=data.transaction_reference,
            current_user=current_user,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


# =========================================================
# GET PAYMENT
# =========================================================

@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PaymentService(db)

    payment = service.get_payment_for_user(
        payment_id=payment_id,
        current_user=current_user,
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    return payment


# =========================================================
# GET INVOICE PAYMENTS
# =========================================================

@router.get(
    "/invoice/{invoice_id}",
    response_model=list[PaymentResponse],
)
def get_invoice_payments(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PaymentService(db)

    return service.get_invoice_payments_for_user(
        invoice_id=invoice_id,
        current_user=current_user,
    )