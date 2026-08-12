from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.payment import Payment


class PaymentRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(
        self,
        payment_id: int
    ) -> Payment | None:

        statement = select(Payment).where(
            Payment.id == payment_id
        )

        return self.db.scalar(statement)

    def get_by_invoice(
        self,
        invoice_id: int
    ) -> list[Payment]:

        statement = (
            select(Payment)
            .where(
                Payment.invoice_id == invoice_id
            )
            .order_by(Payment.id)
        )

        return list(
            self.db.scalars(statement).all()
        )

    def create(
        self,
        payment: Payment
    ) -> Payment:

        self.db.add(payment)
        self.db.flush()

        return payment