import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.ml.risk_model import predict_risk

router = APIRouter(prefix="/risk", tags=["risk"])


@router.post("/predict/{project_id}", response_model=schemas.RiskPredictionOut)
def predict_project_risk(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    features = {
        "project_type": project.project_type,
        "compensation_status": project.compensation_status,
        "legal_dispute": project.legal_dispute,
        "approval_stage": project.approval_stage,
        "stakeholder_responsiveness": project.stakeholder_responsiveness,
        "land_area_hectares": project.land_area_hectares,
        "affected_families": project.affected_families,
        "rehabilitation_progress_pct": project.rehabilitation_progress_pct,
        "historical_dept_performance_score": project.historical_dept_performance_score,
        "months_since_initiation": project.months_since_initiation,
    }

    probability, category, top_drivers = predict_risk(features)

    project.delay_probability = probability
    project.risk_category = category
    project.risk_score = round(probability * 10, 2)
    project.top_delay_drivers = ", ".join(top_drivers)
    db.commit()

    return schemas.RiskPredictionOut(
        project_id=project.id,
        project_code=project.project_code,
        delay_probability=probability,
        risk_category=category,
        top_delay_drivers=top_drivers,
    )


@router.get("/high-risk", response_model=List[schemas.ProjectOut])
def list_high_risk_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Feeds the SMS/email alert service — anything already scored High risk."""
    return (
        db.query(models.Project)
        .filter(models.Project.risk_category == "High")
        .order_by(models.Project.risk_score.desc())
        .all()
    )
