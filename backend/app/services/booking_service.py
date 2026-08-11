from datetime import date, time

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.vehicle import Vehicle
from app.models.service import Service
from app.repositories.booking_repository import BookingRepository


class BookingService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = BookingRepository(db)

    def get_booking(self, booking_id: int):
        return self.repository.get_by_id(booking_id)

    def get_customer_bookings(self, customer_id: int):
        return self.repository.get_by_customer(customer_id)

    def get_bookings_by_date(self, booking_date: date):
        return self.repository.get_by_date(booking_date)

    def create_booking(
        self,
        customer_id: int,
        vehicle_id: int,
        service_id: int,
        booking_date: date,
        booking_time: time,
        customer_notes: str | None,
    ):

        # Verify vehicle belongs to customer
        vehicle = self.db.scalar(
            select(Vehicle).where(
                Vehicle.id == vehicle_id,
                Vehicle.customer_id == customer_id
            )
        )

        if not vehicle:
            raise ValueError(
                "Vehicle does not belong to this customer"
            )

        # Verify service exists and is active
        service = self.db.scalar(
            select(Service).where(
                Service.id == service_id,
                Service.is_active.is_(True)
            )
        )

        if not service:
            raise ValueError(
                "Service not found or inactive"
            )

        # Check whether the same vehicle is already booked
        existing_booking = self.db.scalar(
            select(Booking).where(
                Booking.vehicle_id == vehicle_id,
                Booking.booking_date == booking_date,
                Booking.booking_time == booking_time,
                Booking.status.in_(
                    ["PENDING", "CONFIRMED"]
                )
            )
        )

        if existing_booking:
            raise ValueError(
                "Vehicle already has a booking at this time"
            )

        booking = Booking(
            customer_id=customer_id,
            vehicle_id=vehicle_id,
            service_id=service_id,
            booking_date=booking_date,
            booking_time=booking_time,
            status="PENDING",
            customer_notes=customer_notes,
        )

        return self.repository.create(booking)