from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.user import User
from app.models.work_order import WorkOrder
from app.repositories.work_order_repository import WorkOrderRepository


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

        work_order.status = "COMPLETED"
        work_order.completed_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(work_order)

        return work_order