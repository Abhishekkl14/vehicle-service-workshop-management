from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.work_order import WorkOrder


class WorkOrderRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(
        self,
        work_order_id: int
    ) -> WorkOrder | None:

        statement = select(WorkOrder).where(
            WorkOrder.id == work_order_id
        )

        return self.db.scalar(statement)

    def get_by_id_and_mechanic(
        self,
        work_order_id: int,
        mechanic_id: int
    ) -> WorkOrder | None:

        statement = select(WorkOrder).where(
            WorkOrder.id == work_order_id,
            WorkOrder.assigned_mechanic_id == mechanic_id,
        )

        return self.db.scalar(statement)

    def get_by_id_and_customer(
        self,
        work_order_id: int,
        customer_id: int
    ) -> WorkOrder | None:

        statement = (
            select(WorkOrder)
            .join(
                Booking,
                Booking.id == WorkOrder.booking_id
            )
            .where(
                WorkOrder.id == work_order_id,
                Booking.customer_id == customer_id,
            )
        )

        return self.db.scalar(statement)

    def get_by_booking(
        self,
        booking_id: int
    ) -> WorkOrder | None:

        statement = select(WorkOrder).where(
            WorkOrder.booking_id == booking_id
        )

        return self.db.scalar(statement)

    def get_by_status(
        self,
        status: str
    ) -> list[WorkOrder]:

        statement = (
            select(WorkOrder)
            .where(WorkOrder.status == status)
            .order_by(WorkOrder.created_at)
        )

        return list(self.db.scalars(statement).all())

    def get_by_status_and_mechanic(
        self,
        status: str,
        mechanic_id: int
    ) -> list[WorkOrder]:

        statement = (
            select(WorkOrder)
            .where(
                WorkOrder.status == status,
                WorkOrder.assigned_mechanic_id == mechanic_id,
            )
            .order_by(WorkOrder.created_at)
        )

        return list(self.db.scalars(statement).all())

    def get_by_status_and_customer(
        self,
        status: str,
        customer_id: int
    ) -> list[WorkOrder]:

        statement = (
            select(WorkOrder)
            .join(
                Booking,
                Booking.id == WorkOrder.booking_id
            )
            .where(
                WorkOrder.status == status,
                Booking.customer_id == customer_id,
            )
            .order_by(WorkOrder.created_at)
        )

        return list(self.db.scalars(statement).all())

    def create(
        self,
        work_order: WorkOrder
    ) -> WorkOrder:

        self.db.add(work_order)
        self.db.commit()
        self.db.refresh(work_order)

        return work_order