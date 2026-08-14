from sqlalchemy.orm import Session

from app.core.auth_dependency import get_current_customer
from app.models.user import User
from app.models.vehicle import Vehicle
from app.repositories.vehicle_repository import VehicleRepository


class VehicleService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = VehicleRepository(db)

    def get_vehicle(self, vehicle_id: int):
        return self.repository.get_by_id(vehicle_id)

    def get_customer_vehicles(self, customer_id: int):
        return self.repository.get_by_customer(customer_id)

    def get_vehicle_for_user(
        self,
        vehicle_id: int,
        current_user: User,
    ):

        role = current_user.role.name

        # Customer → only their own vehicle
        if role == "CUSTOMER":

            current_customer = get_current_customer(
                current_user=current_user,
                db=self.db,
            )

            return self.repository.get_by_id_and_customer(
                vehicle_id,
                current_customer.id,
            )

        # Staff roles → workshop access
        if role in {"ADMIN", "SERVICE_ADVISOR"}:

            return self.repository.get_by_id(
                vehicle_id
            )

        raise PermissionError(
            "You do not have permission to access this resource"
        )

    def get_customer_vehicles_for_user(
        self,
        customer_id: int,
        current_user: User,
    ):

        role = current_user.role.name

        # Customer → only their own vehicles
        if role == "CUSTOMER":

            current_customer = get_current_customer(
                current_user=current_user,
                db=self.db,
            )

            if customer_id != current_customer.id:
                return None

        # Staff roles → workshop access
        elif role not in {"ADMIN", "SERVICE_ADVISOR"}:

            raise PermissionError(
                "You do not have permission to access this resource"
            )

        return self.repository.get_by_customer(
            customer_id
        )

    def create_vehicle_for_user(
        self,
        customer_id: int | None,
        vehicle_type_id: int | None,
        registration_number: str,
        vin: str | None,
        make: str,
        model: str,
        manufacturing_year: int | None,
        color: str | None,
        mileage: int,
        current_user: User,
    ):

        role = current_user.role.name

        # Customer → identity derived from JWT / customer profile
        if role == "CUSTOMER":

            current_customer = get_current_customer(
                current_user=current_user,
                db=self.db,
            )

            customer_id = current_customer.id

        # Staff roles → validate supplied customer
        elif role in {"ADMIN", "SERVICE_ADVISOR"}:

            if customer_id is None:
                raise ValueError(
                    "customer_id is required"
                )

        else:

            raise PermissionError(
                "You do not have permission to create vehicles"
            )

        return self.create_vehicle(
            customer_id=customer_id,
            vehicle_type_id=vehicle_type_id,
            registration_number=registration_number,
            vin=vin,
            make=make,
            model=model,
            manufacturing_year=manufacturing_year,
            color=color,
            mileage=mileage,
        )

    def create_vehicle(
        self,
        customer_id: int,
        vehicle_type_id: int | None,
        registration_number: str,
        vin: str | None,
        make: str,
        model: str,
        manufacturing_year: int | None,
        color: str | None,
        mileage: int,
    ):

        existing = self.repository.get_by_registration(
            registration_number
        )

        if existing:
            raise ValueError(
                "Vehicle with this registration number already exists"
            )

        vehicle = Vehicle(
            customer_id=customer_id,
            vehicle_type_id=vehicle_type_id,
            registration_number=registration_number,
            vin=vin,
            make=make,
            model=model,
            manufacturing_year=manufacturing_year,
            color=color,
            mileage=mileage,
        )

        return self.repository.create(vehicle)