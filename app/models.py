import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, Integer, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"                # full access, manages users
    POLICYMAKER = "policymaker"    # read-only, cross-state view
    DISTRICT_ADMIN = "district_admin"  # read/write, own district only
    IMPLEMENTING_AGENCY = "implementing_agency"  # read/write, own projects only


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.IMPLEMENTING_AGENCY)
    state = Column(String, nullable=True)  # scopes district_admin / agency users
    created_at = Column(DateTime, default=datetime.utcnow)


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_code = Column(String, unique=True, index=True, nullable=False)
    state = Column(String, nullable=False, index=True)
    district = Column(String, nullable=False)
    project_type = Column(String, nullable=False)

    land_area_hectares = Column(Float, nullable=False)
    affected_families = Column(Integer, nullable=False)
    compensation_status = Column(String, nullable=False)   # Paid / Partially Paid / Pending
    legal_dispute = Column(String, nullable=False)          # Yes / No
    approval_stage = Column(String, nullable=False)
    rehabilitation_progress_pct = Column(Integer, nullable=False)
    stakeholder_responsiveness = Column(String, nullable=False)  # Low / Medium / High
    historical_dept_performance_score = Column(Float, nullable=False)
    months_since_initiation = Column(Integer, nullable=False)

    # populated by the AI/ML layer after a /risk/predict call
    risk_score = Column(Float, nullable=True)
    risk_category = Column(String, nullable=True)   # Low / Medium / High
    delay_probability = Column(Float, nullable=True)
    top_delay_drivers = Column(String, nullable=True)  # comma-separated SHAP top features

    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User")
