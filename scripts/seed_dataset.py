import pandas as pd

from app.database import SessionLocal
from app.models import Project


CSV_PATH = "data/land_acquisition_synthetic_newFeat.csv"


def seed_projects():
    df = pd.read_csv(CSV_PATH)

    print(f"Dataset loaded: {df.shape}")
    print("Columns:", df.columns.tolist())

    db = SessionLocal()

    try:
        inserted = 0
        skipped = 0

        for _, row in df.iterrows():

            project_code = str(row["project_id"])

            # Skip if project already exists
            existing = (
                db.query(Project)
                .filter(Project.project_code == project_code)
                .first()
            )

            if existing:
                skipped += 1
                continue

            project = Project(
                project_code=project_code,
                state=str(row["state"]),
                district=str(row["district"]),
                project_type=str(row["project_type"]),

                land_area_hectares=float(
                    row["land_area_hectares"]
                ),

                affected_families=int(
                    row["affected_families"]
                ),

                compensation_status=str(
                    row["compensation_status"]
                ),

                legal_dispute=str(
                    row["legal_dispute"]
                ),

                approval_stage=str(
                    row["approval_stage"]
                ),

                possession_status=str(
                    row["possession_status"]
                ),

                # DB column is Integer
                rehabilitation_progress_pct=int(
                    round(float(row["rehabilitation_progress_pct"]))
                ),

                stakeholder_responsiveness=str(
                    row["stakeholder_responsiveness"]
                ),

                historical_dept_performance_score=float(
                    row["historical_dept_performance_score"]
                ),

                months_since_initiation=int(
                    row["months_since_initiation"]
                ),

                approval_timeline_days=int(
                    row["approval_timeline_days"]
                ),
            )

            db.add(project)
            inserted += 1

            if inserted % 100 == 0:
                db.commit()
                print(f"Inserted {inserted} projects...")

        db.commit()

        print("\n==============================")
        print("DATASET SEEDING COMPLETE")
        print("==============================")
        print(f"Inserted : {inserted}")
        print(f"Skipped  : {skipped}")
        print(f"CSV rows : {len(df)}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_projects()