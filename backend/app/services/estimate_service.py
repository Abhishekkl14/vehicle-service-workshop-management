from decimal import Decimal
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.estimate import Estimate
from app.models.estimate_item import EstimateItem
from app.models.service import Service
from app.models.work_order import WorkOrder
from app.models.work_order_part import WorkOrderPart

from app.repositories.estimate_repository import EstimateRepository


TAX_RATE = Decimal("0.18")
LABOR_RATE = Decimal("1000.00")
LABOR_MINUTES = 60


class EstimateService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = EstimateRepository(db)

    # ---------------------------------------------------------
    # Get single estimate
    # ---------------------------------------------------------

    def get_estimate(
        self,
        estimate_id: int
    ):
        return self.repository.get_by_id(
            estimate_id
        )

    # ---------------------------------------------------------
    # Get all estimates for a work order
    # ---------------------------------------------------------

    def get_work_order_estimates(
        self,
        work_order_id: int
    ):
        return self.repository.get_by_work_order(
            work_order_id
        )

    # ---------------------------------------------------------
    # Create Estimate
    # ---------------------------------------------------------

    def create_estimate(
        self,
        work_order_id: int,
        discount_amount: Decimal = Decimal("0.00")
    ):

        # -----------------------------------------------------
        # Verify work order
        # -----------------------------------------------------

        work_order = self.db.scalar(
            select(WorkOrder).where(
                WorkOrder.id == work_order_id
            )
        )

        if not work_order:
            raise ValueError(
                "Work order not found"
            )

        # -----------------------------------------------------
        # Get work order parts
        # -----------------------------------------------------

        work_order_parts = list(
            self.db.scalars(
                select(WorkOrderPart).where(
                    WorkOrderPart.work_order_id == work_order_id
                )
            ).all()
        )

        if not work_order_parts:
            raise ValueError(
                "No parts have been added to this work order"
            )

        # -----------------------------------------------------
        # Calculate parts total
        # -----------------------------------------------------

        parts_total = sum(
            (
                Decimal(item.total_price)
                for item in work_order_parts
            ),
            Decimal("0.00")
        )

        # -----------------------------------------------------
        # Get service associated with booking
        # -----------------------------------------------------

        service = self.db.scalar(
            select(Service)
            .join(
                WorkOrder.booking
            )
            .where(
                WorkOrder.id == work_order_id
            )
        )

        if not service:
            raise ValueError(
                "Service associated with work order not found"
            )

        # -----------------------------------------------------
        # Labor / Service amount
        # -----------------------------------------------------

        labor_amount = LABOR_RATE

        # -----------------------------------------------------
        # Calculate subtotal
        # -----------------------------------------------------

        subtotal = (
            parts_total
            + labor_amount
        )

        # -----------------------------------------------------
        # Validate discount
        # -----------------------------------------------------

        if discount_amount < Decimal("0.00"):
            raise ValueError(
                "Discount cannot be negative"
            )

        if discount_amount > subtotal:
            raise ValueError(
                "Discount cannot exceed subtotal"
            )

        # -----------------------------------------------------
        # Calculate taxable amount
        # -----------------------------------------------------

        taxable_amount = (
            subtotal - discount_amount
        )

        # -----------------------------------------------------
        # Calculate tax
        # -----------------------------------------------------

        tax_amount = (
            taxable_amount * TAX_RATE
        ).quantize(
            Decimal("0.01")
        )

        # -----------------------------------------------------
        # Calculate final total
        # -----------------------------------------------------

        total_amount = (
            taxable_amount + tax_amount
        ).quantize(
            Decimal("0.01")
        )

        # -----------------------------------------------------
        # Calculate estimated duration
        # -----------------------------------------------------

        estimated_duration = (
            service.estimated_duration_minutes
            + LABOR_MINUTES
        )

        # -----------------------------------------------------
        # Create Estimate
        # -----------------------------------------------------

        estimate = Estimate(
            work_order_id=work_order_id,
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            total_amount=total_amount,
            estimated_duration_minutes=estimated_duration,
            status="DRAFT",
        )

        estimate = self.repository.create(
            estimate
        )

        # -----------------------------------------------------
        # Add Part Items
        # -----------------------------------------------------

        for item in work_order_parts:

            part_item = EstimateItem(
                estimate_id=estimate.id,
                item_type="PART",
                description=f"Part #{item.part_id}",
                quantity=Decimal(item.quantity),
                unit_price=Decimal(item.unit_price),
                estimated_minutes=0,
                total_price=Decimal(item.total_price),
            )

            self.repository.add_item(
                part_item
            )

        # -----------------------------------------------------
        # Add Labor Item
        # -----------------------------------------------------

        labor_item = EstimateItem(
            estimate_id=estimate.id,
            item_type="LABOR",
            description="Service Labor",
            quantity=Decimal("1.00"),
            unit_price=LABOR_RATE,
            estimated_minutes=LABOR_MINUTES,
            total_price=LABOR_RATE,
        )

        self.repository.add_item(
            labor_item
        )

        return estimate

    # ---------------------------------------------------------
    # Send Estimate
    # ---------------------------------------------------------

    def send_estimate(
        self,
        estimate_id: int
    ):

        # -----------------------------------------------------
        # Get estimate
        # -----------------------------------------------------

        estimate = self.repository.get_by_id(
            estimate_id
        )

        if not estimate:
            raise ValueError(
                "Estimate not found"
            )

        # -----------------------------------------------------
        # Only DRAFT estimates can be sent
        # -----------------------------------------------------

        if estimate.status != "DRAFT":
            raise ValueError(
                "Only DRAFT estimates can be sent"
            )

        # -----------------------------------------------------
        # Update estimate status
        # -----------------------------------------------------

        estimate.status = "SENT"

        estimate.sent_at = datetime.utcnow()

        estimate.expires_at = (
            datetime.utcnow()
            + timedelta(days=7)
        )

        # -----------------------------------------------------
        # Get related work order
        # -----------------------------------------------------

        work_order = self.db.scalar(
            select(WorkOrder).where(
                WorkOrder.id == estimate.work_order_id
            )
        )

        # -----------------------------------------------------
        # Update work order status
        # -----------------------------------------------------

        if work_order:
            work_order.status = "WAITING_FOR_APPROVAL"

        # -----------------------------------------------------
        # Commit changes
        # -----------------------------------------------------

        self.db.commit()

        # -----------------------------------------------------
        # Refresh estimate
        # -----------------------------------------------------

        self.db.refresh(
            estimate
        )

        return estimate