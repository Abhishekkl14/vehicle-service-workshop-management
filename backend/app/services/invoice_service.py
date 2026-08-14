from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.customer import Customer
from app.models.estimate import Estimate
from app.models.estimate_item import EstimateItem
from app.models.invoice import Invoice
from app.models.invoice_item import InvoiceItem
from app.models.user import User
from app.models.work_order import WorkOrder

from app.repositories.invoice_repository import InvoiceRepository


class InvoiceService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = InvoiceRepository(db)

    # ---------------------------------------------------------
    # Get single invoice
    # ---------------------------------------------------------

    def get_invoice(
        self,
        invoice_id: int
    ):
        return self.repository.get_by_id(
            invoice_id
        )

    # ---------------------------------------------------------
    # Get invoice with user ownership check
    # ---------------------------------------------------------

    def get_invoice_for_user(
        self,
        invoice_id: int,
        current_user: User,
    ):

        query = (
            select(Invoice)
            .join(
                WorkOrder,
                WorkOrder.id == Invoice.work_order_id
            )
            .join(
                Booking,
                Booking.id == WorkOrder.booking_id
            )
            .join(
                Customer,
                Customer.id == Booking.customer_id
            )
            .where(
                Invoice.id == invoice_id
            )
        )

        # Customer → only their own invoice
        if current_user.role.name == "CUSTOMER":

            query = query.where(
                Customer.user_id == current_user.id
            )

        # Staff roles → allowed
        elif current_user.role.name not in {
            "ADMIN",
            "SERVICE_ADVISOR",
            "MECHANIC",
        }:
            return None

        return self.db.scalar(query)

    # ---------------------------------------------------------
    # Get work order invoice
    # ---------------------------------------------------------

    def get_work_order_invoice(
        self,
        work_order_id: int
    ):
        return self.repository.get_by_work_order(
            work_order_id
        )

    # ---------------------------------------------------------
    # Get work order invoice with ownership check
    # ---------------------------------------------------------

    def get_work_order_invoice_for_user(
        self,
        work_order_id: int,
        current_user: User,
    ):

        query = (
            select(Invoice)
            .join(
                WorkOrder,
                WorkOrder.id == Invoice.work_order_id
            )
            .join(
                Booking,
                Booking.id == WorkOrder.booking_id
            )
            .join(
                Customer,
                Customer.id == Booking.customer_id
            )
            .where(
                WorkOrder.id == work_order_id
            )
        )

        # Customer → only their own work order
        if current_user.role.name == "CUSTOMER":

            query = query.where(
                Customer.user_id == current_user.id
            )

        # Staff roles → allowed
        elif current_user.role.name not in {
            "ADMIN",
            "SERVICE_ADVISOR",
            "MECHANIC",
        }:
            return None

        return self.db.scalar(query)

    # ---------------------------------------------------------
    # Generate Invoice
    # ---------------------------------------------------------

    def generate_invoice(
        self,
        work_order_id: int
    ):

        # --------------------------------------------------
        # 1. Verify Work Order
        # --------------------------------------------------

        work_order = self.db.scalar(
            select(WorkOrder).where(
                WorkOrder.id == work_order_id
            )
        )

        if not work_order:
            raise ValueError(
                "Work order not found"
            )

        # --------------------------------------------------
        # 2. Work Order must be COMPLETED
        # --------------------------------------------------

        if work_order.status != "COMPLETED":
            raise ValueError(
                "Invoice can only be generated for a completed work order"
            )

        # --------------------------------------------------
        # 3. Check existing invoice
        # --------------------------------------------------

        existing_invoice = (
            self.repository.get_by_work_order(
                work_order_id
            )
        )

        if existing_invoice:
            raise ValueError(
                "Invoice already exists for this work order"
            )

        # --------------------------------------------------
        # 4. Find approved estimate
        # --------------------------------------------------

        estimate = self.db.scalar(
            select(Estimate).where(
                Estimate.work_order_id == work_order_id,
                Estimate.status == "APPROVED"
            )
        )

        if not estimate:
            raise ValueError(
                "Approved estimate not found"
            )

        # --------------------------------------------------
        # 5. Generate invoice number
        # --------------------------------------------------

        invoice_number = (
            f"INV-{datetime.utcnow():%Y%m%d}"
            f"-WO{work_order_id}"
        )

        # --------------------------------------------------
        # 6. Create invoice
        # --------------------------------------------------

        invoice = Invoice(
            work_order_id=work_order_id,
            invoice_number=invoice_number,
            subtotal=Decimal(
                estimate.subtotal
            ),
            tax_amount=Decimal(
                estimate.tax_amount
            ),
            discount_amount=Decimal(
                estimate.discount_amount
            ),
            total_amount=Decimal(
                estimate.total_amount
            ),
            status="UNPAID",
            issued_at=datetime.utcnow(),
            due_at=datetime.utcnow()
                + timedelta(days=7),
        )

        invoice = self.repository.create(
            invoice
        )

        # --------------------------------------------------
        # 7. Copy estimate items
        # --------------------------------------------------

        estimate_items = list(
            self.db.scalars(
                select(EstimateItem).where(
                    EstimateItem.estimate_id == estimate.id
                )
            ).all()
        )

        for estimate_item in estimate_items:

            invoice_item = InvoiceItem(
                invoice_id=invoice.id,
                description=estimate_item.description,
                quantity=estimate_item.quantity,
                unit_price=estimate_item.unit_price,
                total_price=estimate_item.total_price,
            )

            self.repository.add_item(
                invoice_item
            )

        # --------------------------------------------------
        # 8. Commit complete transaction
        # --------------------------------------------------

        try:
            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

        self.db.refresh(invoice)

        return invoice