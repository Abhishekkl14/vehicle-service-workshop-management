from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.notification import Notification


class NotificationRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        notification: Notification,
    ):
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)

        return notification

    def get_by_id(
        self,
        notification_id: int,
    ):
        return self.db.scalar(
            select(Notification).where(
                Notification.id == notification_id
            )
        )

    def get_by_user(
        self,
        user_id: int,
        unread_only: bool = False,
    ):
        query = select(Notification).where(
            Notification.user_id == user_id
        )

        if unread_only:
            query = query.where(
                Notification.is_read.is_(False)
            )

        query = query.order_by(
            Notification.created_at.desc()
        )

        return self.db.scalars(query).all()