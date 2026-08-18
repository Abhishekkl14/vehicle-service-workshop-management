from pydantic import BaseModel, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    first_name: str = Field(
        min_length=1,
        max_length=100,
    )
    last_name: str | None = Field(
        default=None,
        max_length=100,
    )
    email: str = Field(
        min_length=1,
        max_length=255,
    )
    phone: str | None = Field(
        default=None,
        max_length=20,
    )
    password: str = Field(
        min_length=6,
        max_length=128,
    )


class UpdateProfileRequest(BaseModel):
    first_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    last_name: str | None = Field(
        default=None,
        max_length=100,
    )
    phone: str | None = Field(
        default=None,
        max_length=20,
    )


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(
        min_length=1,
    )
    new_password: str = Field(
        min_length=6,
        max_length=128,
    )