from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.role import Role
from app.models.customer import Customer
from app.core.security import (
    create_access_token,
    hash_password,
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

    def register(
        self,
        first_name: str,
        last_name: str | None,
        email: str,
        phone: str | None,
        password: str,
    ):

        existing = self.db.scalar(
            select(User).where(
                User.email == email
            )
        )

        if existing:
            raise ValueError(
                "An account with this email already exists"
            )

        role = self.db.scalar(
            select(Role).where(
                Role.name == "CUSTOMER"
            )
        )

        if not role:
            raise ValueError(
                "Customer role not found"
            )

        user = User(
            role_id=role.id,
            email=email,
            password_hash=hash_password(password),
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            is_active=True,
        )

        self.db.add(user)
        self.db.flush()

        customer = Customer(
            user_id=user.id,
        )

        self.db.add(customer)
        self.db.commit()
        self.db.refresh(user)

        token = create_access_token(
            {
                "sub": str(user.id),
                "email": user.email,
                "role": "CUSTOMER",
            }
        )

        return token