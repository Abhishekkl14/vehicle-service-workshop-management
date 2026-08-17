from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.user import User
from app.models.work_order import WorkOrder

from app.repositories.payment_repository import PaymentRepository
from app.services.notification_service import NotificationService


class PaymentService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = PaymentRepository(db)

    # --------------------------------------------------
    # Get payment
    # --------------------------------------------------

    def get_payment(
        self,
        payment_id: int
    ):
        return self.repository.get_by_id(
            payment_id
        )

    # --------------------------------------------------
    # Get payment with ownership check
    # --------------------------------------------------

    def get_payment_for_user(
        self,
        payment_id: int,
        current_user: User,
    ):

        query = (
            select(Payment)
            .join(
                Invoice,
                Invoice.id == Payment.invoice_id
            )
            .join(
                WorkOrder,
                WorkOrder.id == Invoice.work_order_id
            )
            .join(
                Booking,
                Booking.id == WorkOrder.booking_id
            )
            .join(
                Customer,
                Customer.id == Booking.customer_id
            )
            .where(
                Payment.id == payment_id
            )
        )

        # Customer → only their own payment
        if current_user.role.name == "CUSTOMER":

            query = query.where(
                Customer.user_id == current_user.id
            )

        # Staff roles → allowed
        elif current_user.role.name not in {
            "ADMIN",
            "SERVICE_ADVISOR",
        }:
            return None

        return self.db.scalar(query)

    # --------------------------------------------------
    # Get invoice payments
    # --------------------------------------------------

    def get_invoice_payments(
        self,
        invoice_id: int
    ):
        return self.repository.get_by_invoice(
            invoice_id
        )

    # --------------------------------------------------
    # Get invoice payments with ownership check
    # --------------------------------------------------

    def get_invoice_payments_for_user(
        self,
        invoice_id: int,
        current_user: User,
    ):

        query = (
            select(Payment)
            .join(
                Invoice,
                Invoice.id == Payment.invoice_id
            )
            .join(
                WorkOrder,
                WorkOrder.id == Invoice.work_order_id
            )
            .join(
                Booking,
                Booking.id == WorkOrder.booking_id
            )
            .join(
                Customer,
                Customer.id == Booking.customer_id
            )
            .where(
                Invoice.id == invoice_id
            )
        )

        # Customer → only their own invoice payments
        if current_user.role.name == "CUSTOMER":

            query = query.where(
                Customer.user_id == current_user.id
            )

        # Staff roles → allowed
        elif current_user.role.name not in {
            "ADMIN",
            "SERVICE_ADVISOR",
        }:
            return []

        return self.db.scalars(query).all()

    # --------------------------------------------------
    # Create payment
    # --------------------------------------------------

    def create_payment(
        self,
        invoice_id: int,
        amount: Decimal,
        payment_method: str,
        transaction_reference: str | None = None,
        current_user: User | None = None,
    ):

        # --------------------------------------------------
        # 1. Find invoice (row lock acquired here so that
        #    concurrent payments for the same invoice are
        #    serialized BEFORE the balance is calculated)
        # --------------------------------------------------

        invoice = self.db.scalar(
            select(Invoice)
            .where(
                Invoice.id == invoice_id
            )
            .with_for_update()
        )

        if not invoice:
            raise ValueError(
                "Invoice not found"
            )

        # --------------------------------------------------
        # 2. Customer ownership check
        # --------------------------------------------------

        if current_user is not None:

            if current_user.role.name == "CUSTOMER":

                booking = self.db.scalar(
                    select(Booking)
                    .join(
                        WorkOrder,
                        WorkOrder.booking_id == Booking.id
                    )
                    .where(
                        WorkOrder.id == invoice.work_order_id
                    )
                )

                if not booking:
                    raise ValueError(
                        "Booking not found"
                    )

                customer = self.db.scalar(
                    select(Customer).where(
                        Customer.id == booking.customer_id
                    )
                )

                if not customer:
                    raise ValueError(
                        "Customer not found"
                    )

                if customer.user_id != current_user.id:
                    raise ValueError(
                        "You do not have permission to pay this invoice"
                    )

        # --------------------------------------------------
        # 3. Normalize transaction reference
        #    (blank / whitespace-only → None)
        # --------------------------------------------------

        if transaction_reference is not None:

            transaction_reference = transaction_reference.strip()

            if transaction_reference == "":
                transaction_reference = None

        # --------------------------------------------------
        # 4. Idempotency check
        #    Runs inside the locked transaction so concurrent
        #    replays of the same reference are serialized by
        #    the invoice row lock. A SUCCESS payment with the
        #    same non-null reference returns the recorded
        #    payment instead of creating a duplicate.
        # --------------------------------------------------

        if transaction_reference is not None:

            existing = self.repository.get_successful_by_reference(
                transaction_reference
            )

            if existing:

                if existing.invoice_id == invoice_id:
                    return existing

                raise ValueError(
                    "Transaction reference has already been "
                    "used for another invoice"
                )

        # --------------------------------------------------
        # 5. Invoice must not already be paid
        # --------------------------------------------------

        if invoice.status == "PAID":
            raise ValueError(
                "Invoice is already paid"
            )

        if invoice.status not in {
            "UNPAID",
            "PARTIALLY_PAID",
        }:
            raise ValueError(
                "Payment can only be made for an "
                "unpaid or partially paid invoice"
            )

        # --------------------------------------------------
        # 6. Validate payment method
        # --------------------------------------------------

        payment_method = payment_method.upper()

        allowed_methods = {
            "CASH",
            "CARD",
            "UPI",
            "ONLINE",
        }

        if payment_method not in allowed_methods:
            raise ValueError(
                "Invalid payment method"
            )

        # --------------------------------------------------
        # 7. Validate amount
        # --------------------------------------------------

        amount = Decimal(amount)

        if amount <= 0:
            raise ValueError(
                "Payment amount must be greater than zero"
            )

        # --------------------------------------------------
        # 8. Check existing successful payments
        # --------------------------------------------------

        payments = self.repository.get_by_invoice(
            invoice_id
        )

        successful_amount = sum(
            (
                Decimal(payment.amount)
                for payment in payments
                if payment.status == "SUCCESS"
            ),
            Decimal("0.00")
        )

        remaining_amount = (
            Decimal(invoice.total_amount)
            - successful_amount
        )

        if amount > remaining_amount:
            raise ValueError(
                f"Payment exceeds remaining balance of "
                f"{remaining_amount:.2f}"
            )

        # --------------------------------------------------
        # 9. Create payment
        # --------------------------------------------------

        payment = Payment(
            invoice_id=invoice_id,
            amount=amount,
            payment_method=payment_method,
            transaction_reference=transaction_reference,
            status="SUCCESS",
            paid_at=datetime.utcnow(),
        )

        self.repository.create(payment)

        # --------------------------------------------------
        # 10. Update invoice status
        # --------------------------------------------------

        new_paid_amount = (
            successful_amount + amount
        )

        if new_paid_amount >= Decimal(
            invoice.total_amount
        ):
            invoice.status = "PAID"

        else:
            invoice.status = "PARTIALLY_PAID"

        # --------------------------------------------------
        # 11. Find booking through work order
        # --------------------------------------------------

        booking = self.db.scalar(
            select(Booking)
            .join(
                WorkOrder,
                WorkOrder.booking_id == Booking.id
            )
            .where(
                WorkOrder.id == invoice.work_order_id
            )
        )

        # --------------------------------------------------
        # 12. Find customer
        # --------------------------------------------------

        if booking:

            customer = self.db.scalar(
                select(Customer).where(
                    Customer.id == booking.customer_id
                )
            )

            # --------------------------------------------------
            # 13. Create payment notification
            # --------------------------------------------------

            if customer:

                notification_service = (
                    NotificationService(self.db)
                )

                notification_service.create_notification(
                    user_id=customer.user_id,
                    title="Payment Received",
                    message=(
                        f"Payment of ₹{amount:.2f} "
                        "has been received successfully."
                    ),
                    notification_type="PAYMENT_SUCCESS",
                )

        # --------------------------------------------------
        # 14. Commit complete transaction
        # --------------------------------------------------

        try:
            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

        self.db.refresh(payment)

        return payment