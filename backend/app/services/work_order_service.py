from datetime import datetime, UTC

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth_dependency import get_current_customer
from app.models.booking import Booking
from app.models.user import User
from app.models.work_order import WorkOrder
from app.models.work_order_approval import (
    WorkOrderApproval,
)
from app.repositories.work_order_approval_repository import (
    WorkOrderApprovalRepository,
)
from app.repositories.work_order_part_repository import (
    WorkOrderPartRepository,
)
from app.repositories.work_order_repository import WorkOrderRepository
from app.repositories.work_order_service_repository import (
    WorkOrderServiceRepository,
)
from app.services.notification_service import NotificationService


class WorkOrderService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = WorkOrderRepository(db)
        self.part_repository = WorkOrderPartRepository(db)
        self.service_repository = WorkOrderServiceRepository(db)
        self.approval_repository = WorkOrderApprovalRepository(db)

    def get_work_order(
        self,
        work_order_id: int
    ):
        return self.repository.get_by_id(
            work_order_id
        )

    def get_by_status(
        self,
        status: str
    ):
        return self.repository.get_by_status(
            status
        )

    def get_work_order_for_user(
        self,
        work_order_id: int,
        current_user: User,
    ):

        role = current_user.role.name

        # Customer → only work orders of their own booking
        if role == "CUSTOMER":

            current_customer = get_current_customer(
                current_user=current_user,
                db=self.db,
            )

            return self.repository.get_by_id_and_customer(
                work_order_id,
                current_customer.id,
            )

        # Mechanic → only assigned work orders
        if role == "TECHNICIAN":

            return self.repository.get_by_id_and_mechanic(
                work_order_id,
                current_user.id,
            )

        # Staff roles → workshop access
        if role in {"ADMIN", "SERVICE_ADVISOR"}:

            return self.repository.get_by_id(
                work_order_id
            )

        raise PermissionError(
            "You do not have permission to access this resource"
        )

    def get_work_orders_by_status_for_user(
        self,
        status: str,
        current_user: User,
    ):

        role = current_user.role.name

        # Customer → only their own work orders
        if role == "CUSTOMER":

            current_customer = get_current_customer(
                current_user=current_user,
                db=self.db,
            )

            return self.repository.get_by_status_and_customer(
                status,
                current_customer.id,
            )

        # Mechanic → only assigned work orders
        if role == "TECHNICIAN":

            return self.repository.get_by_status_and_mechanic(
                status,
                current_user.id,
            )

        # Staff roles → full workshop view
        if role in {"ADMIN", "SERVICE_ADVISOR"}:

            return self.repository.get_by_status(
                status
            )

        raise PermissionError(
            "You do not have permission to access this resource"
        )

    def create_work_order(
        self,
        booking_id: int,
        vehicle_id: int,
        complaint: str | None,
        mechanic_id: int | None = None,
    ):

        # Verify booking exists
        booking = self.db.scalar(
            select(Booking).where(
                Booking.id == booking_id
            )
        )

        if not booking:
            raise ValueError(
                "Booking not found"
            )

        # Only active bookings can receive a work order
        if booking.status not in {
            "PENDING",
            "CONFIRMED",
        }:
            raise ValueError(
                "Work orders can only be created for PENDING or CONFIRMED bookings"
            )

        # Prevent duplicate work order
        existing = self.repository.get_by_booking(
            booking_id
        )

        if existing:
            raise ValueError(
                "Work order already exists for this booking"
            )

        # Make sure vehicle matches booking
        if booking.vehicle_id != vehicle_id:
            raise ValueError(
                "Vehicle does not match the booking"
            )

        # If mechanic supplied, verify the user exists
        if mechanic_id is not None:

            mechanic = self.db.scalar(
                select(User).where(
                    User.id == mechanic_id
                )
            )

            if not mechanic:
                raise ValueError(
                    "Mechanic not found"
                )

            # Verify role
            if mechanic.role.name != "TECHNICIAN":
                raise ValueError(
                    "Selected user is not a mechanic"
                )

        work_order = WorkOrder(
            booking_id=booking_id,
            vehicle_id=vehicle_id,
            assigned_mechanic_id=mechanic_id,
            status="CREATED",
            complaint=complaint,
            received_at=datetime.now(UTC),
        )

        # Update booking status
        booking.status = "VEHICLE_RECEIVED"

        return self.repository.create(
            work_order
        )

    def start_work_order_for_user(
        self,
        work_order_id: int,
        current_user: User,
    ):

        role = current_user.role.name

        # Mechanic → must be assigned to the work order
        if role == "TECHNICIAN":

            work_order = self.repository.get_by_id_and_mechanic(
                work_order_id,
                current_user.id,
            )

            if not work_order:
                raise PermissionError(
                    "You do not have permission to access this resource"
                )

        # Staff roles → workshop access
        elif role not in {"SERVICE_ADVISOR", "ADMIN"}:

            raise PermissionError(
                "You do not have permission to access this resource"
            )

        return self.start_work_order(
            work_order_id
        )

    # ---------------------------------------------------------
    # GET PENDING APPROVAL WORK ORDERS
    # ---------------------------------------------------------

    def get_pending_approval_work_orders(
        self,
    ):
        statement = (
            select(WorkOrder)
            .where(
                WorkOrder.status
                == "SUBMITTED_FOR_APPROVAL"
            )
            .order_by(WorkOrder.submitted_at.desc())
        )

        return list(
            self.db.scalars(statement).all()
        )

    # ---------------------------------------------------------
    # APPROVE WORK ORDER
    # ---------------------------------------------------------

    def approve_work_order(
        self,
        work_order_id: int,
        advisor_id: int,
        comments: str | None = None,
    ):
        work_order = self.db.scalar(
            select(WorkOrder)
            .where(WorkOrder.id == work_order_id)
            .with_for_update()
        )

        if not work_order:
            raise ValueError(
                "Work order not found"
            )

        if (
            work_order.status
            != "SUBMITTED_FOR_APPROVAL"
        ):
            raise ValueError(
                "Only SUBMITTED_FOR_APPROVAL work orders "
                "can be approved"
            )

        # At least one actual part or service required
        actual_parts = (
            self.part_repository.count_actual_by_work_order(
                work_order_id
            )
        )

        actual_services = (
            self.service_repository.count_actual_by_work_order(
                work_order_id
            )
        )

        if actual_parts == 0 and actual_services == 0:
            raise ValueError(
                "Work order has no actual parts or "
                "performed services to approve"
            )

        now = datetime.now(UTC)

        # Update work order status
        work_order.status = "COMPLETED"
        work_order.approved_at = now
        work_order.approved_by = advisor_id
        work_order.completed_at = now
        work_order.rejected_at = None
        work_order.rejected_by = None
        work_order.rejection_reason = None

        # Create approval record
        approval = WorkOrderApproval(
            work_order_id=work_order_id,
            decision="APPROVED",
            decided_by=advisor_id,
            comments=comments,
            decided_at=now,
        )

        self.approval_repository.create(approval)

        try:
            self.db.commit()
            self.db.refresh(work_order)

        except Exception:
            self.db.rollback()
            raise

        return work_order

    # ---------------------------------------------------------
    # REJECT WORK ORDER
    # ---------------------------------------------------------

    def reject_work_order(
        self,
        work_order_id: int,
        advisor_id: int,
        rejection_reason: str,
    ):
        work_order = self.db.scalar(
            select(WorkOrder)
            .where(WorkOrder.id == work_order_id)
            .with_for_update()
        )

        if not work_order:
            raise ValueError(
                "Work order not found"
            )

        if (
            work_order.status
            != "SUBMITTED_FOR_APPROVAL"
        ):
            raise ValueError(
                "Only SUBMITTED_FOR_APPROVAL work orders "
                "can be rejected"
            )

        now = datetime.now(UTC)

        # Update work order status
        work_order.status = "IN_PROGRESS"
        work_order.rejected_at = now
        work_order.rejected_by = advisor_id
        work_order.rejection_reason = rejection_reason
        work_order.approved_at = None
        work_order.approved_by = None
        work_order.completed_at = None

        # Create approval record
        approval = WorkOrderApproval(
            work_order_id=work_order_id,
            decision="REJECTED",
            decided_by=advisor_id,
            comments=rejection_reason,
            decided_at=now,
        )

        self.approval_repository.create(approval)

        try:
            self.db.commit()
            self.db.refresh(work_order)

        except Exception:
            self.db.rollback()
            raise

        # -------------------------------------------------
        # Notify the assigned mechanic
        # -------------------------------------------------

        if work_order.assigned_mechanic_id:

            try:

                notification_service = NotificationService(
                    self.db
                )

                notification_service.create_notification(
                    user_id=work_order.assigned_mechanic_id,
                    title="Work Order Rejected",
                    message=(
                        f"Work Order #{work_order_id} has been "
                        f"rejected by the advisor. Reason: "
                        f"{rejection_reason}. Please make "
                        f"corrections and resubmit."
                    ),
                    notification_type="WORK_ORDER_REJECTED",
                )

                self.db.commit()

            except Exception:

                self.db.rollback()

        return work_order

    # ---------------------------------------------------------
    # GET WORK ORDER APPROVAL HISTORY
    # ---------------------------------------------------------

    def get_work_order_approvals(
        self,
        work_order_id: int,
    ):
        return self.approval_repository.get_by_work_order(
            work_order_id
        )

    # ---------------------------------------------------------
    # START WORK ORDER (internal)
    # ---------------------------------------------------------

    def start_work_order(
        self,
        work_order_id: int
    ):
        work_order = self.repository.get_by_id(
            work_order_id
        )

        if not work_order:
            raise ValueError(
                "Work order not found"
            )

        # SUBMITTED_FOR_APPROVAL and COMPLETED work orders cannot
        # be started again
        if work_order.status not in {
            "CREATED",
            "INSPECTION",
            "IN_PROGRESS",
        }:
            raise ValueError(
                "Only CREATED, INSPECTION, or IN_PROGRESS work orders can be started"
            )

        if work_order.started_at is not None:
            raise ValueError(
                "Work order has already been started"
            )

        work_order.status = "IN_PROGRESS"
        work_order.started_at = datetime.now(UTC)

        self.db.commit()
        self.db.refresh(work_order)

        return work_order

    def submit_work_order_for_approval_for_user(
        self,
        work_order_id: int,
        current_user: User,
    ):

        # Only the assigned mechanic can submit for approval
        if current_user.role.name != "MECHANIC":
            raise PermissionError(
                "Only the assigned mechanic can submit a work order for approval"
            )

        work_order = self.repository.get_by_id_and_mechanic(
            work_order_id,
            current_user.id,
        )

        if not work_order:
            raise PermissionError(
                "You do not have permission to access this resource"
            )

        return self.submit_work_order_for_approval(
            work_order_id
        )

    def submit_work_order_for_approval(
        self,
        work_order_id: int
    ):
        work_order = self.repository.get_by_id(
            work_order_id
        )

        if not work_order:
            raise ValueError(
                "Work order not found"
            )

        if work_order.status != "IN_PROGRESS":
            raise ValueError(
                "Only IN_PROGRESS work orders can be submitted for approval"
            )

        if work_order.started_at is None:
            raise ValueError(
                "Work order must be started before it can be submitted for approval"
            )

        # At least one piece of actual work is required
        actual_parts = self.part_repository.count_actual_by_work_order(
            work_order_id
        )

        actual_services = self.service_repository.count_actual_by_work_order(
            work_order_id
        )

        if actual_parts == 0 and actual_services == 0:
            raise ValueError(
                "Record at least one actual part or performed service "
                "before submitting the work order for approval"
            )

        work_order.status = "SUBMITTED_FOR_APPROVAL"
        work_order.submitted_at = datetime.now(UTC)

        self.db.commit()
        self.db.refresh(work_order)

        return work_order

    def complete_work_order_for_user(
        self,
        work_order_id: int,
        current_user: User,
    ):

        role = current_user.role.name

        # Mechanics can no longer directly complete work orders. The
        # mechanic must submit the work order for advisor approval
        # instead; the advisor approval step (implemented in a later
        # phase) is the only route that moves SUBMITTED_FOR_APPROVAL
        # → COMPLETED.
        if role == "TECHNICIAN":

            raise PermissionError(
                "Mechanics cannot complete work orders directly. "
                "Submit the work order for advisor approval instead."
            )

        # Service staff / admins can no longer complete an IN_PROGRESS
        # work order directly either — that bypasses the mechanic
        # submission and violates the new approval workflow.
        if role in {"SERVICE_ADVISOR", "ADMIN"}:

            raise ValueError(
                "Work orders can no longer be completed directly. "
                "The mechanic must submit the work order for approval, "
                "and the advisor approval step will mark it completed."
            )

        raise PermissionError(
            "You do not have permission to access this resource"
        )
