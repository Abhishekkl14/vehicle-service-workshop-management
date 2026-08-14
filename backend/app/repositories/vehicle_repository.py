from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle


class VehicleRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, vehicle_id: int) -> Vehicle | None:
        statement = select(Vehicle).where(
            Vehicle.id == vehicle_id
        )

        return self.db.scalar(statement)

    def get_by_id_and_customer(
        self,
        vehicle_id: int,
        customer_id: int
    ) -> Vehicle | None:

        statement = select(Vehicle).where(
            Vehicle.id == vehicle_id,
            Vehicle.customer_id == customer_id,
        )

        return self.db.scalar(statement)

    def get_by_registration(
        self,
        registration_number: str
    ) -> Vehicle | None:

        statement = select(Vehicle).where(
            Vehicle.registration_number == registration_number
        )

        return self.db.scalar(statement)

    def get_by_customer(
        self,
        customer_id: int
    ) -> list[Vehicle]:

        statement = (
            select(Vehicle)
            .where(Vehicle.customer_id == customer_id)
            .order_by(Vehicle.id)
        )

        return list(self.db.scalars(statement).all())

    def create(self, vehicle: Vehicle) -> Vehicle:
        self.db.add(vehicle)
        self.db.commit()
        self.db.refresh(vehicle)

        return vehicle

    def delete(self, vehicle: Vehicle) -> None:
        self.db.delete(vehicle)
        self.db.commit()