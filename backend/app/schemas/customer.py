from pydantic import BaseModel, ConfigDict


class CustomerResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    user_id: int
    address: str | None
    city: str | None


class CustomerDetailResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    user_id: int
    address: str | None
    city: str | None
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
