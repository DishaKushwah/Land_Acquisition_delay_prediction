import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.ml.risk_model import analyze_risk
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
    "state": project.state,
    "project_type": project.project_type,
    "land_area_hectares": project.land_area_hectares,
    "affected_families": project.affected_families,
    "compensation_status": project.compensation_status,
    "legal_dispute": project.legal_dispute,
    "approval_stage": project.approval_stage,
    "possession_status": project.possession_status,
    "rehabilitation_progress_pct": project.rehabilitation_progress_pct,
    "stakeholder_responsiveness": project.stakeholder_responsiveness,
    "historical_dept_performance_score": project.historical_dept_performance_score,
    "months_since_initiation": project.months_since_initiation,
    "approval_timeline_days": project.approval_timeline_days,
}

    analysis = analyze_risk(features)

    probability = analysis["delay_probability"]
    category = analysis["risk_category"]
    top_drivers = analysis["top_delay_drivers"]

    project.delay_probability = probability
    project.risk_category = category
    project.risk_score = round(probability * 10, 2)

    project.top_delay_drivers = ", ".join(
        driver["feature"] for driver in top_drivers
    )

    db.commit()

    return {
        "project_id": project.id,
        "project_code": project.project_code,
        "delay_probability": probability,
        "risk_category": category,
        "delay_prediction": analysis["delay_prediction"],
        "top_delay_drivers": top_drivers,
        "recommendations": analysis["recommendations"],
        "stage_risks": analysis["stage_risks"],
    }


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
