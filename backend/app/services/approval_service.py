from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.approval import Approval
from app.models.customer import Customer
from app.models.estimate import Estimate
from app.models.work_order import WorkOrder
from app.repositories.approval_repository import (
    ApprovalRepository,
)


class ApprovalService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = ApprovalRepository(db)

    # ---------------------------------------------------------
    # Create Approval Decision
    # ---------------------------------------------------------

    def create_decision(
        self,
        estimate_id: int,
        customer_id: int,
        decision: str,
        comments: str | None,
    ):

        # -----------------------------------------------------
        # Validate decision
        # -----------------------------------------------------

        decision = decision.upper()

        if decision not in {
            "APPROVED",
            "REJECTED",
        }:
            raise ValueError(
                "Decision must be APPROVED or REJECTED"
            )

        # -----------------------------------------------------
        # Find estimate
        # -----------------------------------------------------

        estimate = self.db.scalar(
            select(Estimate).where(
                Estimate.id == estimate_id
            )
        )

        if not estimate:
            raise ValueError(
                "Estimate not found"
            )

        # -----------------------------------------------------
        # Estimate must be SENT
        # -----------------------------------------------------

        if estimate.status != "SENT":
            raise ValueError(
                "Only SENT estimates can be approved or rejected"
            )

        # -----------------------------------------------------
        # Find customer
        # -----------------------------------------------------

        customer = self.db.scalar(
            select(Customer).where(
                Customer.id == customer_id
            )
        )

        if not customer:
            raise ValueError(
                "Customer not found"
            )

        # -----------------------------------------------------
        # Create approval record
        # -----------------------------------------------------

        approval = Approval(
            estimate_id=estimate_id,
            customer_id=customer_id,
            decision=decision,
            comments=comments,
        )

        approval = self.repository.create(
            approval
        )

        # -----------------------------------------------------
        # Update estimate status
        # -----------------------------------------------------

        estimate.status = decision

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

            if decision == "APPROVED":
                work_order.status = "IN_PROGRESS"

            elif decision == "REJECTED":
                work_order.status = "INSPECTION"

        # -----------------------------------------------------
        # Commit changes safely
        # -----------------------------------------------------

        try:
            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

        return approval