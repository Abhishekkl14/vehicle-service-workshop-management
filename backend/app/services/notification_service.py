from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.repositories.notification_repository import (
    NotificationRepository,
)


class NotificationService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = NotificationRepository(db)

    def create_notification(
        self,
        user_id: int,
        title: str,
        message: str,
        notification_type: str,
    ):

        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
        )

        self.repository.create(notification)

        return notification

    def get_notification(
        self,
        notification_id: int
    ):

        return self.repository.get_by_id(
            notification_id
        )

    def get_user_notifications(
        self,
        user_id: int,
        unread_only: bool = False
    ):

        return self.repository.get_by_user(
            user_id,
            unread_only
        )

    def mark_as_read(
        self,
        notification_id: int
    ):

        notification = self.repository.get_by_id(
            notification_id
        )

        if not notification:
            raise ValueError(
                "Notification not found"
            )

        notification.is_read = True

        self.db.commit()
        self.db.refresh(notification)

        return notification