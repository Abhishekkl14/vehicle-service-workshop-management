from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.routers.roles import router as roles_router
from app.routers.vehicles import router as vehicles_router
from app.routers.bookings import router as bookings_router
from app.routers.work_orders import router as work_orders_router
from app.routers.inspections import router as inspections_router
from app.routers.parts import router as parts_router
from app.routers.work_order_parts import router as work_order_parts_router
from app.routers.work_order_services import (
    router as work_order_services_router
)
from app.routers.estimates import router as estimates_router
from app.routers.approvals import router as approvals_router
from app.routers.invoices import router as invoices_router
from app.routers.payments import router as payments_router
from app.routers.customer_history import (
    router as customer_history_router
)
from app.routers.auth import router as auth_router
from app.routers.notifications import router as notifications_router
from app.routers.services import (
    router as services_router
)


app = FastAPI(
    title="Vehicle Service & Workshop Management System",
    version="1.0.0",
    description="MVP backend for vehicle service and workshop management"
)
app.add_middleware(
    CORSMiddleware,
   allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "https://vehicle-service-workshop-management.onrender.com",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(roles_router)
app.include_router(vehicles_router)
app.include_router(bookings_router)
app.include_router(work_orders_router)
app.include_router(inspections_router)
app.include_router(parts_router)
app.include_router(work_order_parts_router)
app.include_router(work_order_services_router)
app.include_router(estimates_router)
app.include_router(approvals_router)
app.include_router(invoices_router)
app.include_router(payments_router)
app.include_router(
    customer_history_router
)
app.include_router(auth_router)
app.include_router(notifications_router)
app.include_router(
    services_router
)


@app.get("/")
def root():
    return {
        "message": "Vehicle Service & Workshop Management API",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.get("/health/database")
def database_health(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1"))

    return {
        "database": "connected",
        "result": result.scalar()
    }