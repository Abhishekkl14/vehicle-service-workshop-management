from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth_dependency import get_current_customer
from app.models.booking import Booking
from app.models.user import User
from app.models.work_order import WorkOrder
from app.repositories.work_order_repository import WorkOrderRepository
from app.models.customer import Customer
from app.services.notification_service import NotificationService


class WorkOrderService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = WorkOrderRepository(db)

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
        if role == "MECHANIC":

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
        if role == "MECHANIC":

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
            if mechanic.role.name != "MECHANIC":
                raise ValueError(
                    "Selected user is not a mechanic"
                )

        work_order = WorkOrder(
            booking_id=booking_id,
            vehicle_id=vehicle_id,
            assigned_mechanic_id=mechanic_id,
            status="CREATED",
            complaint=complaint,
            received_at=datetime.utcnow(),
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
        if role == "MECHANIC":

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

    def complete_work_order_for_user(
        self,
        work_order_id: int,
        current_user: User,
    ):

        role = current_user.role.name

        # Mechanic → must be assigned to the work order
        if role == "MECHANIC":

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

        return self.complete_work_order(
            work_order_id
        )

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

        if work_order.status != "IN_PROGRESS":
            raise ValueError(
                "Only IN_PROGRESS work orders can be started"
            )

        if work_order.started_at is not None:
            raise ValueError(
                "Work order has already been started"
            )

        work_order.started_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(work_order)

        return work_order

    def complete_work_order(
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
                "Only IN_PROGRESS work orders can be completed"
            )

        if work_order.started_at is None:
            raise ValueError(
                "Work order must be started before completion"
            )

        if work_order.completed_at is not None:
            raise ValueError(
                "Work order has already been completed"
            )

        # Complete the work order
        work_order.status = "COMPLETED"
        work_order.completed_at = datetime.utcnow()

        # Find booking
        booking = self.db.scalar(
            select(Booking).where(
                Booking.id == work_order.booking_id
            )
        )

        if not booking:
            raise ValueError(
                "Booking not found"
            )

        # Find customer
        customer = self.db.scalar(
            select(Customer).where(
                Customer.id == booking.customer_id
            )
        )

        if not customer:
            raise ValueError(
                "Customer not found"
            )

        # Create customer notification
        notification_service = NotificationService(
            self.db
        )

        notification_service.create_notification(
            user_id=customer.user_id,
            title="Vehicle Service Completed",
            message=(
                "Your vehicle service has been completed "
                "and your vehicle is ready for pickup."
            ),
            notification_type="SERVICE_COMPLETED",
        )

        self.db.commit()
        self.db.refresh(work_order)

        return work_order