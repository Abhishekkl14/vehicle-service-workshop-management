from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


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
    submitted_at: datetime | None
    approved_at: datetime | None
    approved_by: int | None
    rejected_at: datetime | None
    rejected_by: int | None
    rejection_reason: str | None


class WorkOrderApproveRequest(BaseModel):
    comments: str | None = None


class WorkOrderRejectRequest(BaseModel):
    rejection_reason: str = Field(
        min_length=1,
        max_length=500,
    )


class WorkOrderApprovalResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    work_order_id: int
    decision: str
    decided_by: int
    comments: str | None
    decided_at: datetime