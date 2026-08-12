from sqlalchemy import text
from sqlalchemy.orm import Session


class CustomerHistoryRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_customer(
        self,
        customer_id: int
    ):

        query = text("""
            SELECT
                customer_id,
                first_name,
                last_name,
                vehicle_id,
                registration_number,
                make,
                model,
                booking_id,
                booking_date,
                service_name,
                work_order_id,
                work_order_status,
                invoice_number,
                invoice_total,
                invoice_status
            FROM customer_service_history
            WHERE customer_id = :customer_id
            ORDER BY booking_date DESC
        """)

        result = self.db.execute(
            query,
            {
                "customer_id": customer_id
            }
        )

        return result.mappings().all()