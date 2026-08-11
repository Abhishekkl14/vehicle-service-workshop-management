from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WorkOrderCreate(BaseModel):
    booking_id: int
    vehicle_id: int
    complaint: str | None = None
    mechanic_id: int | None = None


class WorkOrderResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    booking_id: int
    vehicle_id: int
    assigned_mechanic_id: int | None
    status: str
    complaint: str | None
    received_at: datetime | None
    started_at: datetime | None
    completed_at: datetime | None