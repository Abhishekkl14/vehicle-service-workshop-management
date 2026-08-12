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
from app.schemas.invoice import InvoiceResponse
from app.services.invoice_service import InvoiceService


router = APIRouter(
    prefix="/api/v1/invoices",
    tags=["Invoices"],
)


# =========================================================
# GET INVOICE
# =========================================================

@router.get(
    "/{invoice_id}",
    response_model=InvoiceResponse,
)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = InvoiceService(db)

    invoice = service.get_invoice_for_user(
        invoice_id=invoice_id,
        current_user=current_user,
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    return invoice


# =========================================================
# GET WORK ORDER INVOICE
# =========================================================

@router.get(
    "/work-order/{work_order_id}",
    response_model=InvoiceResponse,
)
def get_work_order_invoice(
    work_order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = InvoiceService(db)

    invoice = service.get_work_order_invoice_for_user(
        work_order_id=work_order_id,
        current_user=current_user,
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    return invoice


# =========================================================
# GENERATE INVOICE
# =========================================================

@router.post(
    "/work-order/{work_order_id}",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_invoice(
    work_order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SERVICE_ADVISOR",
            "ADMIN",
        )
    ),
):
    service = InvoiceService(db)

    try:

        return service.generate_invoice(
            work_order_id
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )