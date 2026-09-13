from pathlib import Path

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "stage_models"


STAGES = {
    "notification": "notification_model.joblib",
    "approval": "approval_model.joblib",
    "compensation": "compensation_model.joblib",
    "possession": "possession_model.joblib",
}


def predict_stage_risks(project_data: dict) -> dict:
    """
    Predict delay probability for each land-acquisition stage.
    """

    features = pd.DataFrame([project_data])

    results = {}

    for stage, filename in STAGES.items():

        model_path = MODEL_DIR / filename

        artifact = joblib.load(model_path)

        stage_model = artifact["model"]
        preprocessor = artifact["preprocessor"]

        transformed_features = preprocessor.transform(features)

        probability = float(
            stage_model.predict_proba(
                transformed_features
            )[0][1]
        )

        results[stage] = {
            "delay_probability": round(probability, 4),
            "risk_category": get_stage_risk_category(
                probability
            ),
            "delay_prediction": (
                "Delayed"
                if probability >= 0.40
                else "On-Time"
            ),
        }

    return results


def get_stage_risk_category(probability: float) -> str:

    if probability >= 0.70:
        return "HIGH"

    if probability >= 0.40:
        return "MEDIUM"

    return "LOW"