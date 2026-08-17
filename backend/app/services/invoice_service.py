from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.customer import Customer
from app.models.estimate import Estimate
from app.models.invoice import Invoice
from app.models.invoice_item import InvoiceItem
from app.models.part import Part
from app.models.user import User
from app.models.work_order import WorkOrder
from app.models.work_order_approval import WorkOrderApproval
from app.models.work_order_part import WorkOrderPart
from app.models.work_order_service import (
    WorkOrderService,
)

from app.repositories.invoice_repository import (
    InvoiceRepository,
)

TAX_RATE = Decimal("0.18")

SERVICE_TO_INVOICE_TYPE = {
    "SERVICE": "SERVICE",
    "CONSUMABLE": "SERVICE",
    "LABOR": "LABOR",
}


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

        # Mechanic → only invoices of assigned work orders
        elif current_user.role.name == "MECHANIC":

            query = query.where(
                WorkOrder.assigned_mechanic_id
                == current_user.id
            )

        # Staff roles → allowed
        elif current_user.role.name not in {
            "ADMIN",
            "SERVICE_ADVISOR",
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

        # Mechanic → only invoices of assigned work orders
        elif current_user.role.name == "MECHANIC":

            query = query.where(
                WorkOrder.assigned_mechanic_id
                == current_user.id
            )

        # Staff roles → allowed
        elif current_user.role.name not in {
            "ADMIN",
            "SERVICE_ADVISOR",
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
                "Invoice can only be generated "
                "for a completed work order"
            )

        # --------------------------------------------------
        # 3. Strict approval gate: approved_by
        # --------------------------------------------------

        if work_order.approved_by is None:
            raise ValueError(
                "Work order has not been approved "
                "by an advisor"
            )

        # --------------------------------------------------
        # 4. Strict approval gate: approved_at
        # --------------------------------------------------

        if work_order.approved_at is None:
            raise ValueError(
                "Work order is missing an approval "
                "timestamp"
            )

        # --------------------------------------------------
        # 5. Strict approval gate: APPROVED record
        # --------------------------------------------------

        approval_record = self.db.scalar(
            select(WorkOrderApproval).where(
                WorkOrderApproval.work_order_id
                == work_order_id,
                WorkOrderApproval.decision
                == "APPROVED",
            )
        )

        if not approval_record:
            raise ValueError(
                "No approved advisor record found "
                "for this work order"
            )

        # --------------------------------------------------
        # 6. Check existing invoice
        # --------------------------------------------------

        existing_invoice = (
            self.repository.get_by_work_order(
                work_order_id
            )
        )

        if existing_invoice:
            raise ValueError(
                "Invoice already exists "
                "for this work order"
            )

        # --------------------------------------------------
        # 7. Find approved estimate (workflow prereq)
        #    Used ONLY for discount carry-forward,
        #    NOT for line-item amounts.
        # --------------------------------------------------

        approved_estimates = list(
            self.db.scalars(
                select(Estimate).where(
                    Estimate.work_order_id
                    == work_order_id,
                    Estimate.status == "APPROVED",
                )
            ).all()
        )

        if not approved_estimates:
            raise ValueError(
                "Approved estimate not found"
            )

        if len(approved_estimates) > 1:
            raise ValueError(
                "Work order has multiple approved "
                "estimates; data correction required"
            )

        estimate = approved_estimates[0]

        # --------------------------------------------------
        # 8. Read ACTUAL parts (source == "ACTUAL")
        # --------------------------------------------------

        actual_parts = list(
            self.db.scalars(
                select(WorkOrderPart).where(
                    WorkOrderPart.work_order_id
                    == work_order_id,
                    WorkOrderPart.source == "ACTUAL",
                )
            ).all()
        )

        # --------------------------------------------------
        # 9. Read ACTUAL services / consumables / labor
        #    (source == "ACTUAL")
        # --------------------------------------------------

        actual_services = list(
            self.db.scalars(
                select(WorkOrderService).where(
                    WorkOrderService.work_order_id
                    == work_order_id,
                    WorkOrderService.source
                    == "ACTUAL",
                )
            ).all()
        )

        # --------------------------------------------------
        # 10. Require at least one billable item
        # --------------------------------------------------

        if not actual_parts and not actual_services:
            raise ValueError(
                "No actual parts or services to bill. "
                "Record performed work before "
                "generating an invoice."
            )

        # --------------------------------------------------
        # 11. Resolve Part names for descriptions
        # --------------------------------------------------

        part_ids = {
            wop.part_id for wop in actual_parts
        }

        part_map = {}

        if part_ids:

            parts = list(
                self.db.scalars(
                    select(Part).where(
                        Part.id.in_(part_ids)
                    )
                ).all()
            )

            part_map = {
                p.id: p for p in parts
            }

        # --------------------------------------------------
        # 12. Build invoice items + compute subtotal
        # --------------------------------------------------

        invoice_items = []

        subtotal = Decimal("0.00")

        for wop in actual_parts:

            part_obj = part_map.get(wop.part_id)

            if part_obj:
                description = (
                    f"Part: {part_obj.name}"
                )
            else:
                description = (
                    f"Part #{wop.part_id}"
                )

            item_total = Decimal(
                str(wop.total_price)
            )

            invoice_items.append(
                InvoiceItem(
                    description=description,
                    quantity=Decimal(
                        str(wop.quantity)
                    ),
                    unit_price=Decimal(
                        str(wop.unit_price)
                    ),
                    total_price=item_total,
                    item_type="PART",
                )
            )

            subtotal += item_total

        for wos in actual_services:

            invoice_item_type = (
                SERVICE_TO_INVOICE_TYPE.get(
                    wos.item_type, "SERVICE"
                )
            )

            item_total = Decimal(
                str(wos.total_price)
            )

            invoice_items.append(
                InvoiceItem(
                    description=wos.description,
                    quantity=Decimal(
                        str(wos.quantity)
                    ),
                    unit_price=Decimal(
                        str(wos.unit_price)
                    ),
                    total_price=item_total,
                    item_type=invoice_item_type,
                )
            )

            subtotal += item_total

        subtotal = subtotal.quantize(
            Decimal("0.01")
        )

        # --------------------------------------------------
        # 13. Discount: carry forward from estimate,
        #     capped at actual subtotal
        # --------------------------------------------------

        estimate_discount = Decimal(
            str(estimate.discount_amount)
        )

        discount = min(estimate_discount, subtotal)

        discount = discount.quantize(
            Decimal("0.01")
        )

        # --------------------------------------------------
        # 14. Tax + total from actual work
        # --------------------------------------------------

        taxable = subtotal - discount

        tax_amount = (
            taxable * TAX_RATE
        ).quantize(Decimal("0.01"))

        total_amount = (
            taxable + tax_amount
        ).quantize(Decimal("0.01"))

        # --------------------------------------------------
        # 15. Generate invoice number
        # --------------------------------------------------

        invoice_number = (
            f"INV-{datetime.utcnow():%Y%m%d}"
            f"-WO{work_order_id}"
        )

        # --------------------------------------------------
        # 16. Create invoice (no line items yet)
        # --------------------------------------------------

        invoice = Invoice(
            work_order_id=work_order_id,
            invoice_number=invoice_number,
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=discount,
            total_amount=total_amount,
            status="UNPAID",
            issued_at=datetime.utcnow(),
            due_at=datetime.utcnow()
            + timedelta(days=7),
        )

        invoice = self.repository.create(
            invoice
        )

        # --------------------------------------------------
        # 17. Attach invoice items
        # --------------------------------------------------

        for inv_item in invoice_items:

            inv_item.invoice_id = invoice.id

            self.repository.add_item(inv_item)

        # --------------------------------------------------
        # 18. Commit atomically — rollback on any
        #     failure so no partial invoice remains
        # --------------------------------------------------

        try:
            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

        self.db.refresh(invoice)

        return invoice
