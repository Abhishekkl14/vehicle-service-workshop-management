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


class BookingUserBrief(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    first_name: str
    last_name: str | None = None
    phone: str | None = None


class BookingCustomerBrief(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    user: BookingUserBrief | None = None


class BookingVehicleBrief(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    registration_number: str
    make: str
    model: str
    manufacturing_year: int | None = None
    color: str | None = None


class BookingServiceBrief(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    name: str


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

    customer: BookingCustomerBrief | None = None
    vehicle: BookingVehicleBrief | None = None
    service: BookingServiceBrief | None = None