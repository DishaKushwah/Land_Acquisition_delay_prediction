import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models import UserRole


# ---------- Auth ----------
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.IMPLEMENTING_AGENCY
    state: Optional[str] = None


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: UserRole
    state: Optional[str]

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Projects ----------
class ProjectCreate(BaseModel):
    project_code: str
    state: str
    district: str
    project_type: str
    land_area_hectares: float
    affected_families: int
    compensation_status: str
    legal_dispute: str
    approval_stage: str
    rehabilitation_progress_pct: int
    stakeholder_responsiveness: str
    historical_dept_performance_score: float
    months_since_initiation: int


class ProjectOut(ProjectCreate):
    id: uuid.UUID
    risk_score: Optional[float] = None
    risk_category: Optional[str] = None
    delay_probability: Optional[float] = None
    top_delay_drivers: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RiskPredictionOut(BaseModel):
    project_id: uuid.UUID
    project_code: str
    delay_probability: float
    risk_category: str
    top_delay_drivers: list[str]
