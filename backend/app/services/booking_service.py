from datetime import date, time

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth_dependency import get_current_customer
from app.models.booking import Booking
from app.models.vehicle import Vehicle
from app.models.service import Service
from app.models.user import User
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

    def get_booking_for_user(
        self,
        booking_id: int,
        current_user: User,
    ):

        role = current_user.role.name

        # Customer → only their own booking
        if role == "CUSTOMER":

            current_customer = get_current_customer(
                current_user=current_user,
                db=self.db,
            )

            return self.repository.get_by_id_and_customer(
                booking_id,
                current_customer.id,
            )

        # Staff roles → workshop access
        if role in {"ADMIN", "SERVICE_ADVISOR"}:

            return self.repository.get_by_id(
                booking_id
            )

        raise PermissionError(
            "You do not have permission to access this resource"
        )

    def get_customer_bookings_for_user(
        self,
        customer_id: int,
        current_user: User,
    ):

        role = current_user.role.name

        # Customer → only their own bookings
        if role == "CUSTOMER":

            current_customer = get_current_customer(
                current_user=current_user,
                db=self.db,
            )

            if customer_id != current_customer.id:
                return None

        # Staff roles → workshop access
        elif role not in {"ADMIN", "SERVICE_ADVISOR"}:

            raise PermissionError(
                "You do not have permission to access this resource"
            )

        return self.repository.get_by_customer(
            customer_id
        )

    def get_bookings_by_date_for_user(
        self,
        booking_date: date,
        current_user: User,
    ):

        role = current_user.role.name

        # Customer → only their own bookings on that date
        if role == "CUSTOMER":

            current_customer = get_current_customer(
                current_user=current_user,
                db=self.db,
            )

            return self.repository.get_by_date_and_customer(
                booking_date,
                current_customer.id,
            )

        # Staff roles → full workshop view
        if role in {"ADMIN", "SERVICE_ADVISOR"}:

            return self.repository.get_by_date(
                booking_date
            )

        raise PermissionError(
            "You do not have permission to access this resource"
        )

    def create_booking_for_user(
        self,
        customer_id: int | None,
        vehicle_id: int,
        service_id: int,
        booking_date: date,
        booking_time: time,
        customer_notes: str | None,
        current_user: User,
    ):

        role = current_user.role.name

        # Customer → identity derived from JWT / customer profile
        if role == "CUSTOMER":

            current_customer = get_current_customer(
                current_user=current_user,
                db=self.db,
            )

            customer_id = current_customer.id

        # Staff roles → validate supplied customer
        elif role in {"ADMIN", "SERVICE_ADVISOR"}:

            if customer_id is None:
                raise ValueError(
                    "customer_id is required"
                )

        else:

            raise PermissionError(
                "You do not have permission to create bookings"
            )

        return self.create_booking(
            customer_id=customer_id,
            vehicle_id=vehicle_id,
            service_id=service_id,
            booking_date=booking_date,
            booking_time=booking_time,
            customer_notes=customer_notes,
        )

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