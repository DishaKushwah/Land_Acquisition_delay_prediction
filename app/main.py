from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth_routes, projects, risk

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Land Acquisition Delay Prediction API",
    description="SIH26 — Predictive Analytics System for Early Detection of Land Acquisition Delays",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to the frontend's origin before deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(projects.router)
app.include_router(risk.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "land-acquisition-delay-api"}
