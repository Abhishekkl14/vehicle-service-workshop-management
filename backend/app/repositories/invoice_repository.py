from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.invoice import Invoice
from app.models.invoice_item import InvoiceItem


class InvoiceRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(
        self,
        invoice_id: int
    ) -> Invoice | None:

        statement = select(Invoice).where(
            Invoice.id == invoice_id
        )

        return self.db.scalar(statement)

    def get_by_work_order(
        self,
        work_order_id: int
    ) -> Invoice | None:

        statement = select(Invoice).where(
            Invoice.work_order_id == work_order_id
        )

        return self.db.scalar(statement)

    def create(
        self,
        invoice: Invoice
    ) -> Invoice:

        self.db.add(invoice)
        self.db.flush()

        return invoice

    def add_item(
        self,
        item: InvoiceItem
    ) -> InvoiceItem:

        self.db.add(item)
        self.db.flush()

        return item