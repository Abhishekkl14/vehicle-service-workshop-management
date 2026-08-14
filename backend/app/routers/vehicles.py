from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth_dependency import get_current_user
from app.database.database import get_db
from app.models.user import User
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = VehicleService(db)

    try:
        vehicles = service.get_customer_vehicles_for_user(
            customer_id,
            current_user,
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )

    if vehicles is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicles not found",
        )

    return vehicles


@router.get(
    "/{vehicle_id}",
    response_model=VehicleResponse
)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = VehicleService(db)

    try:
        vehicle = service.get_vehicle_for_user(
            vehicle_id,
            current_user,
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = VehicleService(db)

    try:
        return service.create_vehicle_for_user(
            customer_id=data.customer_id,
            vehicle_type_id=data.vehicle_type_id,
            registration_number=data.registration_number,
            vin=data.vin,
            make=data.make,
            model=data.model,
            manufacturing_year=data.manufacturing_year,
            color=data.color,
            mileage=data.mileage,
            current_user=current_user,
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
