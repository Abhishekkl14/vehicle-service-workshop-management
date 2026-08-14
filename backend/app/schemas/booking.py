from datetime import date, time

from pydantic import BaseModel, ConfigDict, Field


class BookingCreate(BaseModel):
    customer_id: int | None = None
    vehicle_id: int
    service_id: int

    booking_date: date
    booking_time: time

    customer_notes: str | None = Field(
        default=None,
        max_length=1000
    )


class BookingResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    customer_id: int
    vehicle_id: int
    service_id: int
    booking_date: date
    booking_time: time
    status: str
    customer_notes: str | None