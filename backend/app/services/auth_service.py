from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.core.security import (
    create_access_token,
    verify_password,
)


class AuthService:

    def __init__(self, db: Session):
        self.db = db

    def login(
        self,
        email: str,
        password: str,
    ):

        user = self.db.scalar(
            select(User).where(
                User.email == email
            )
        )

        if not user:
            raise ValueError(
                "Invalid email or password"
            )

        if not user.is_active:
            raise ValueError(
                "User account is inactive"
            )

        if not verify_password(
            password,
            user.password_hash
        ):
            raise ValueError(
                "Invalid email or password"
            )

        token = create_access_token(
            {
                "sub": str(user.id),
                "email": user.email,
                "role": user.role.name,
            }
        )

        return token