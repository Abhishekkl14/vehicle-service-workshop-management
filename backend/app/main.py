from fastapi import FastAPI

app = FastAPI(
    title="Vehicle Service & Workshop Management System",
    description="API for managing vehicle servicing and workshop operations",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "Vehicle Service & Workshop Management System API",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }