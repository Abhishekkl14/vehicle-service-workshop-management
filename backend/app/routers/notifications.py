from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.notification import NotificationResponse
from app.services.notification_service import NotificationService
from app.core.auth_dependency import get_current_user

from app.models.user import User


router = APIRouter(
    prefix="/api/v1/notifications",
    tags=["Notifications"],
)


# =========================================================
# GET CURRENT USER NOTIFICATIONS
# =========================================================

@router.get(
    "",
    response_model=list[NotificationResponse],
)
def get_my_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = NotificationService(db)

    return service.get_user_notifications(
        user_id=current_user.id,
        unread_only=unread_only,
    )


# =========================================================
# GET SINGLE NOTIFICATION
# =========================================================

@router.get(
    "/{notification_id}",
    response_model=NotificationResponse,
)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = NotificationService(db)

    notification = service.get_notification(
        notification_id
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    # Ownership check
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this notification",
        )

    return notification


# =========================================================
# MARK NOTIFICATION AS READ
# =========================================================

@router.post(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = NotificationService(db)

    notification = service.get_notification(
        notification_id
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    # Ownership check
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this notification",
        )

    try:

        return service.mark_as_read(
            notification_id
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )