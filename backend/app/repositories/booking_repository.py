from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking


class BookingRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, booking_id: int) -> Booking | None:
        statement = select(Booking).where(
            Booking.id == booking_id
        )

        return self.db.scalar(statement)

    def get_by_customer(
        self,
        customer_id: int
    ) -> list[Booking]:

        statement = (
            select(Booking)
            .where(Booking.customer_id == customer_id)
            .order_by(
                Booking.booking_date,
                Booking.booking_time
            )
        )

        return list(self.db.scalars(statement).all())

    def get_by_date(
        self,
        booking_date: date
    ) -> list[Booking]:

        statement = (
            select(Booking)
            .where(Booking.booking_date == booking_date)
            .order_by(Booking.booking_time)
        )

        return list(self.db.scalars(statement).all())

    def create(self, booking: Booking) -> Booking:
        self.db.add(booking)
        self.db.commit()
        self.db.refresh(booking)

        return booking

    def delete(self, booking: Booking) -> None:
        self.db.delete(booking)
        self.db.commit()