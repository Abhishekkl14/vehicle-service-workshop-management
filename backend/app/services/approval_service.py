from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth_dependency import get_current_customer
from app.models.approval import Approval
from app.models.booking import Booking
from app.models.customer import Customer
from app.models.estimate import Estimate
from app.models.role import Role
from app.models.user import User
from app.models.work_order import WorkOrder
from app.repositories.approval_repository import (
    ApprovalRepository,
)
from app.services.notification_service import NotificationService


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
        # Only one APPROVED estimate per work order
        # -----------------------------------------------------

        if decision == "APPROVED":

            # Lock the work order row so concurrent approvals
            # for the same work order are serialized
            work_order = self.db.scalar(
                select(WorkOrder)
                .where(
                    WorkOrder.id == estimate.work_order_id
                )
                .with_for_update()
            )

            existing_approved = self.db.scalar(
                select(Estimate).where(
                    Estimate.work_order_id == estimate.work_order_id,
                    Estimate.status == "APPROVED",
                    Estimate.id != estimate.id,
                )
            )

            if existing_approved:
                raise ValueError(
                    "An approved estimate already exists for this work order"
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

        if decision != "APPROVED":

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

        # -----------------------------------------------------
        # Notify all service advisors
        # -----------------------------------------------------

        try:

            advisor_role = self.db.scalar(
                select(Role).where(
                    Role.name == "SERVICE_ADVISOR"
                )
            )

            if advisor_role:

                advisors = self.db.scalars(
                    select(User).where(
                        User.role_id == advisor_role.id
                    )
                ).all()

                notification_service = NotificationService(
                    self.db
                )

                decision_label = (
                    "approved" if decision == "APPROVED"
                    else "rejected"
                )

                for advisor in advisors:

                    notification_service.create_notification(
                        user_id=advisor.id,
                        title=f"Estimate {decision_label.title()}",
                        message=(
                            f"Estimate #{estimate_id} has been "
                            f"{decision_label} by the customer "
                            f"for Work Order #{estimate.work_order_id}."
                        ),
                        notification_type="ESTIMATE_DECISION",
                    )

                self.db.commit()

        except Exception:

            self.db.rollback()

        return approval

    # ---------------------------------------------------------
    # Create Approval Decision with ownership check
    # ---------------------------------------------------------

    def create_decision_for_user(
        self,
        estimate_id: int,
        current_user: User,
        decision: str,
        comments: str | None,
    ):

        # -----------------------------------------------------
        # Resolve the authenticated customer from the JWT
        # -----------------------------------------------------

        current_customer = get_current_customer(
            current_user=current_user,
            db=self.db,
        )

        # -----------------------------------------------------
        # Find estimate for ownership check
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
        # Ownership chain:
        # Estimate -> WorkOrder -> Booking -> Customer
        # -----------------------------------------------------

        booking = self.db.scalar(
            select(Booking)
            .join(
                WorkOrder,
                WorkOrder.id == estimate.work_order_id
            )
            .where(
                Booking.id == WorkOrder.booking_id
            )
        )

        if not booking:
            raise ValueError(
                "Booking not found"
            )

        if booking.customer_id != current_customer.id:
            raise PermissionError(
                "You do not have permission to access this resource"
            )

        # -----------------------------------------------------
        # Delegate to create_decision which handles
        # validation, approval record, and status updates
        # -----------------------------------------------------

        return self.create_decision(
            estimate_id=estimate_id,
            customer_id=current_customer.id,
            decision=decision,
            comments=comments,
        )

    # ---------------------------------------------------------
    # Get Approvals by Estimate
    # ---------------------------------------------------------

    def get_estimate_approvals(
        self,
        estimate_id: int,
    ):
        return self.repository.get_by_estimate(
            estimate_id
        )