from app.database import SessionLocal
from app.models import Project
from app.ml.risk_model import predict_risk, get_top_delay_drivers


def score_all_projects():
    db = SessionLocal()

    try:
        projects = db.query(Project).all()

        total = len(projects)
        scored = 0

        print(f"Found {total} projects")
        print("Starting bulk risk scoring...\n")

        for i, project in enumerate(projects, start=1):

            project_data = {
                "state": project.state,
                "project_type": project.project_type,
                "compensation_status": project.compensation_status,
                "legal_dispute": project.legal_dispute,
                "approval_stage": project.approval_stage,
                "possession_status": project.possession_status,
                "stakeholder_responsiveness": project.stakeholder_responsiveness,
                "land_area_hectares": project.land_area_hectares,
                "affected_families": project.affected_families,
                "rehabilitation_progress_pct": project.rehabilitation_progress_pct,
                "historical_dept_performance_score":
                    project.historical_dept_performance_score,
                "months_since_initiation":
                    project.months_since_initiation,
                "approval_timeline_days":
                    project.approval_timeline_days,
            }

            prediction = predict_risk(project_data)
            drivers = get_top_delay_drivers(project_data)

            project.delay_probability = prediction["delay_probability"]
            project.risk_category = prediction["risk_category"]

            project.risk_score = prediction["delay_probability"] * 100

            project.top_delay_drivers = ", ".join(
                driver["feature"]
                for driver in drivers[:5]
            )

            scored += 1

            if i % 100 == 0:
                db.commit()
                print(f"Scored {i}/{total} projects")

        db.commit()

        print("\n================================")
        print("BULK SCORING COMPLETE")
        print("================================")
        print(f"Projects scored : {scored}")

    except Exception as e:
        db.rollback()
        print("\nERROR:", e)
        raise

    finally:
        db.close()


if __name__ == "__main__":
    score_all_projects()