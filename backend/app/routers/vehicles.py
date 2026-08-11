from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.vehicle import VehicleCreate, VehicleResponse
from app.services.vehicle_service import VehicleService


router = APIRouter(
    prefix="/api/v1/vehicles",
    tags=["Vehicles"]
)


@router.get(
    "/customer/{customer_id}",
    response_model=list[VehicleResponse]
)
def get_customer_vehicles(
    customer_id: int,
    db: Session = Depends(get_db)
):
    service = VehicleService(db)

    return service.get_customer_vehicles(customer_id)


@router.get(
    "/{vehicle_id}",
    response_model=VehicleResponse
)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db)
):
    service = VehicleService(db)

    vehicle = service.get_vehicle(vehicle_id)

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    return vehicle


@router.post(
    "/",
    response_model=VehicleResponse,
    status_code=status.HTTP_201_CREATED
)
def create_vehicle(
    data: VehicleCreate,
    db: Session = Depends(get_db)
):
    service = VehicleService(db)

    try:
        return service.create_vehicle(
            customer_id=data.customer_id,
            vehicle_type_id=data.vehicle_type_id,
            registration_number=data.registration_number,
            vin=data.vin,
            make=data.make,
            model=data.model,
            manufacturing_year=data.manufacturing_year,
            color=data.color,
            mileage=data.mileage,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )