from pydantic import BaseModel, ConfigDict, Field


class VehicleCreate(BaseModel):
    customer_id: int
    vehicle_type_id: int | None = None

    registration_number: str = Field(
        min_length=1,
        max_length=30
    )

    vin: str | None = Field(
        default=None,
        max_length=50
    )

    make: str = Field(
        min_length=1,
        max_length=100
    )

    model: str = Field(
        min_length=1,
        max_length=100
    )

    manufacturing_year: int | None = None

    color: str | None = None

    mileage: int = Field(
        default=0,
        ge=0
    )


class VehicleResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    customer_id: int
    vehicle_type_id: int | None
    registration_number: str
    vin: str | None
    make: str
    model: str
    manufacturing_year: int | None
    color: str | None
    mileage: int