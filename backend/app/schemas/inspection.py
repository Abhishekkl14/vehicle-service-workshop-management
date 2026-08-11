from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InspectionCreate(BaseModel):
    work_order_id: int
    mechanic_id: int
    overall_notes: str | None = None


class InspectionItemCreate(BaseModel):
    component: str = Field(
        min_length=1,
        max_length=150
    )

    condition: str = Field(
        min_length=1,
        max_length=100
    )

    severity: str = Field(
        min_length=1,
        max_length=30
    )

    notes: str | None = None

    recommended_action: str | None = None


class InspectionItemResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    inspection_id: int
    component: str
    condition: str
    severity: str
    notes: str | None
    recommended_action: str | None


class InspectionResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    work_order_id: int
    mechanic_id: int
    overall_notes: str | None
    inspected_at: datetime