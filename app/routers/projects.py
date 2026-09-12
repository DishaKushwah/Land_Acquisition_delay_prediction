import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_roles
from app.models import UserRole

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/", response_model=schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        require_roles(UserRole.ADMIN, UserRole.DISTRICT_ADMIN, UserRole.IMPLEMENTING_AGENCY)
    ),
):
    if db.query(models.Project).filter(models.Project.project_code == payload.project_code).first():
        raise HTTPException(status_code=400, detail="project_code already exists")

    project = models.Project(**payload.model_dump(), created_by=current_user.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/", response_model=List[schemas.ProjectOut])
def list_projects(
    state: str | None = None,
    risk_category: str | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Project)

    # RBAC scoping: district admins and agencies only see their own state's projects.
    # Policymakers and admins get the full cross-state view.
    if current_user.role in (UserRole.DISTRICT_ADMIN, UserRole.IMPLEMENTING_AGENCY) and current_user.state:
        query = query.filter(models.Project.state == current_user.state)

    if state:
        query = query.filter(models.Project.state == state)
    if risk_category:
        query = query.filter(models.Project.risk_category == risk_category)

    return query.order_by(models.Project.created_at.desc()).all()


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(UserRole.ADMIN)),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
