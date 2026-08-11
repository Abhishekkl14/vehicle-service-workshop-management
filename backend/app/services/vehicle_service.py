from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle
from app.repositories.vehicle_repository import VehicleRepository


class VehicleService:

    def __init__(self, db: Session):
        self.repository = VehicleRepository(db)

    def get_vehicle(self, vehicle_id: int):
        return self.repository.get_by_id(vehicle_id)

    def get_customer_vehicles(self, customer_id: int):
        return self.repository.get_by_customer(customer_id)

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