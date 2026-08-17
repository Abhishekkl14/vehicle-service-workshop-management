from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.service import Service
from app.models.user import User
from app.models.work_order import WorkOrder
from app.models.work_order_service import WorkOrderService
from app.repositories.work_order_service_repository import (
    WorkOrderServiceRepository,
)
from app.services.estimate_service import LABOR_MINUTES, LABOR_RATE


ALLOWED_ITEM_TYPES = {"SERVICE", "CONSUMABLE", "LABOR"}


class WorkOrderServicesService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = WorkOrderServiceRepository(db)

    def get_work_order_services(
        self,
        work_order_id: int
    ):
        return self.repository.get_by_work_order(
            work_order_id
        )

    def get_work_order_services_for_user(
        self,
        work_order_id: int,
        current_user: User,
    ):

        role = current_user.role.name

        # Mechanic → only assigned work orders
        if role == "MECHANIC":

            work_order = self.db.scalar(
                select(WorkOrder).where(
                    WorkOrder.id == work_order_id,
                    WorkOrder.assigned_mechanic_id == current_user.id,
                )
            )

            if not work_order:
                raise PermissionError(
                    "You do not have permission to access this resource"
                )

        # Staff roles → workshop access
        elif role not in {"ADMIN", "SERVICE_ADVISOR"}:

            raise PermissionError(
                "You do not have permission to access this resource"
            )

        return self.repository.get_by_work_order(
            work_order_id
        )

    def add_work_order_service_for_user(
        self,
        work_order_id: int,
        data,
        current_user: User,
    ):

        role = current_user.role.name

        # Mechanic → only assigned, only IN_PROGRESS work orders
        if role == "MECHANIC":

            work_order = self.db.scalar(
                select(WorkOrder).where(
                    WorkOrder.id == work_order_id,
                    WorkOrder.assigned_mechanic_id == current_user.id,
                )
            )

            if not work_order:
                raise PermissionError(
                    "You do not have permission to access this resource"
                )

            if work_order.status != "IN_PROGRESS":
                raise ValueError(
                    "Performed work can only be recorded on IN_PROGRESS work orders"
                )

        # Staff roles → workshop access (record performed work on behalf)
        elif role not in {"ADMIN", "SERVICE_ADVISOR"}:

            raise PermissionError(
                "You do not have permission to record performed work"
            )

        return self.add_work_order_service(
            work_order_id=work_order_id,
            data=data,
        )

    def add_work_order_service(
        self,
        work_order_id: int,
        data,
    ):

        # -----------------------------------------------------
        # Verify work order
        # -----------------------------------------------------

        work_order = self.db.scalar(
            select(WorkOrder).where(
                WorkOrder.id == work_order_id
            )
        )

        if not work_order:
            raise ValueError(
                "Work order not found"
            )

        if work_order.status != "IN_PROGRESS":
            raise ValueError(
                "Performed work can only be recorded on IN_PROGRESS work orders"
            )

        # -----------------------------------------------------
        # Validate item type
        # -----------------------------------------------------

        item_type = data.item_type

        if item_type not in ALLOWED_ITEM_TYPES:
            raise ValueError(
                "item_type must be one of SERVICE, CONSUMABLE, LABOR"
            )

        service_id = data.service_id
        description = data.description
        estimated_minutes = data.estimated_minutes
        unit_price = None

        # -----------------------------------------------------
        # SERVICE — must reference an active catalog service
        # -----------------------------------------------------

        if item_type == "SERVICE":

            if service_id is None:
                raise ValueError(
                    "service_id is required for SERVICE items"
                )

            service = self.db.scalar(
                select(Service).where(
                    Service.id == service_id,
                    Service.is_active.is_(True),
                )
            )

            if not service:
                raise ValueError(
                    "Service not found or inactive"
                )

            # Price is backend-controlled from the catalog.
            unit_price = Decimal(service.base_price)

            # Description defaults from the catalog when absent.
            if not description:
                description = service.name

            # Duration defaults from the catalog when absent.
            if estimated_minutes is None:
                estimated_minutes = service.estimated_duration_minutes

        # -----------------------------------------------------
        # CONSUMABLE — free-text, no catalog service
        # -----------------------------------------------------

        elif item_type == "CONSUMABLE":

            if service_id is not None:
                raise ValueError(
                    "service_id must be NULL for CONSUMABLE items"
                )

            if not description:
                raise ValueError(
                    "description is required for CONSUMABLE items"
                )

            if data.unit_price is None:
                raise ValueError(
                    "unit_price is required for CONSUMABLE items"
                )

            unit_price = Decimal(data.unit_price)

        # -----------------------------------------------------
        # LABOR — reuses existing labor pricing rules
        # -----------------------------------------------------

        elif item_type == "LABOR":

            if service_id is not None:
                raise ValueError(
                    "service_id must be NULL for LABOR items"
                )

            if not description:
                raise ValueError(
                    "description is required for LABOR items"
                )

            # Backend-controlled labor pricing, same rule as estimates.
            unit_price = LABOR_RATE

            if estimated_minutes is None:
                estimated_minutes = LABOR_MINUTES

        # -----------------------------------------------------
        # Compute total_price on the backend (never trust client)
        # -----------------------------------------------------

        quantity = Decimal(data.quantity)

        total_price = (
            quantity * unit_price
        ).quantize(Decimal("0.01"))

        # -----------------------------------------------------
        # Create record — source is always ACTUAL
        # -----------------------------------------------------

        work_order_service = WorkOrderService(
            work_order_id=work_order_id,
            service_id=service_id,
            item_type=item_type,
            description=description,
            quantity=quantity,
            unit_price=unit_price,
            total_price=total_price,
            estimated_minutes=estimated_minutes,
            source="ACTUAL",
            notes=data.notes,
        )

        return self.repository.create(
            work_order_service
        )
