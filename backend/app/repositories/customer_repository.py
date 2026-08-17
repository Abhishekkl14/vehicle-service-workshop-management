from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.customer import Customer
from app.models.user import User


class CustomerRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(
        self,
        customer_id: int
    ) -> Customer | None:

        statement = (
            select(Customer)
            .where(Customer.id == customer_id)
        )

        return self.db.scalar(statement)

    def get_all(
        self
    ) -> list[Customer]:

        statement = (
            select(Customer)
            .options(
                joinedload(Customer.user)
            )
            .order_by(Customer.id)
        )

        return list(
            self.db.scalars(statement).unique().all()
        )
