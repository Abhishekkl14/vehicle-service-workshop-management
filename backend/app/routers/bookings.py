from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.booking import (
    BookingCreate,
    BookingResponse,
)
from app.services.booking_service import BookingService


router = APIRouter(
    prefix="/api/v1/bookings",
    tags=["Bookings"]
)


@router.get(
    "/customer/{customer_id}",
    response_model=list[BookingResponse]
)
def get_customer_bookings(
    customer_id: int,
    db: Session = Depends(get_db)
):
    service = BookingService(db)

    return service.get_customer_bookings(customer_id)


@router.get(
    "/date/{booking_date}",
    response_model=list[BookingResponse]
)
def get_bookings_by_date(
    booking_date: date,
    db: Session = Depends(get_db)
):
    service = BookingService(db)

    return service.get_bookings_by_date(booking_date)


@router.get(
    "/{booking_id}",
    response_model=BookingResponse
)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db)
):
    service = BookingService(db)

    booking = service.get_booking(booking_id)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    return booking


@router.post(
    "/",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED
)
def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db)
):
    service = BookingService(db)

    try:
        return service.create_booking(
            customer_id=data.customer_id,
            vehicle_id=data.vehicle_id,
            service_id=data.service_id,
            booking_date=data.booking_date,
            booking_time=data.booking_time,
            customer_notes=data.customer_notes,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )