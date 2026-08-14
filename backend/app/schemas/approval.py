from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ApprovalCreate(BaseModel):
    decision: str = Field(
        min_length=1,
        max_length=20
    )

    comments: str | None = None


class ApprovalResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    estimate_id: int
    customer_id: int
    decision: str
    comments: str | None
    decided_at: datetime