from pathlib import Path
from app.ml.recommendations import generate_recommendations 
from app.ml.stage_prediction import predict_stage_risks
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "risk_model.joblib"

model = joblib.load(MODEL_PATH)


FEATURE_COLUMNS = [
    "state",
    "project_type",
    "compensation_status",
    "legal_dispute",
    "approval_stage",
    "stakeholder_responsiveness",
    "possession_status",
    "land_area_hectares",
    "affected_families",
    "rehabilitation_progress_pct",
    "historical_dept_performance_score",
    "months_since_initiation",
    "approval_timeline_days",
]


CATEGORICAL_FEATURES = [
    "state",
    "project_type",
    "compensation_status",
    "legal_dispute",
    "approval_stage",
    "stakeholder_responsiveness",
    "possession_status"
]

NUMERICAL_FEATURES = [
    "land_area_hectares",
    "affected_families",
    "rehabilitation_progress_pct",
    "historical_dept_performance_score",
    "months_since_initiation",
    "approval_timeline_days"
]


PREDICTION_THRESHOLD = 0.40
HIGH_RISK_THRESHOLD = 0.70
MEDIUM_RISK_THRESHOLD = 0.40


def get_risk_category(probability: float) -> str:
    """
    Convert delay probability into a risk category.
    """
    if probability >= HIGH_RISK_THRESHOLD:
        return "HIGH"

    if probability >= MEDIUM_RISK_THRESHOLD:
        return "MEDIUM"

    return "LOW"


def predict_risk(project_data: dict) -> dict:
    """
    Predict delay probability for a single project.
    """
    features = pd.DataFrame(
        [project_data],
        columns=FEATURE_COLUMNS
    )

    # Predict probability of Delayed
    delay_probability = float(
        model.predict_proba(features)[0][1]
    )

    # Convert probability into risk category
    risk_category = get_risk_category(delay_probability)

    # Apply operational prediction threshold
    delay_prediction = (
        "Delayed"
        if delay_probability >= PREDICTION_THRESHOLD
        else "On-Time"
    )

    return {
        "delay_probability": delay_probability,
        "risk_category": risk_category,
        "delay_prediction": delay_prediction,
    }


# ============================================================
# EXPLAINABILITY
# ============================================================
#
# We use XGBoost's native feature contributions instead of
# the SHAP Python package.
#
# This avoids the SciPy dependency that is currently blocked
# by Windows Application Control on this machine.
#
# The contribution values are in the model's prediction
# space (log-odds). Positive values increase delay risk,
# negative values decrease delay risk.
# ============================================================

classifier = model.named_steps["classifier"]
preprocessor = model.named_steps["preprocessor"]

FEATURE_DISPLAY_NAMES = {
    "compensation_status": "Compensation Status",
    "legal_dispute": "Legal Dispute",
    "stakeholder_responsiveness": "Stakeholder Responsiveness",
    "months_since_initiation": "Months Since Initiation",
    "land_area_hectares": "Land Area",
    "affected_families": "Affected Families",
    "rehabilitation_progress_pct": "Rehabilitation Progress",
    "historical_dept_performance_score": "Department Performance",
    "approval_stage": "Approval Stage",
    "project_type": "Project Type",
    "state": "State",
}


def get_grouped_shap(project_data: dict) -> list:
    """
    Calculate XGBoost native feature contributions and group
    one-hot encoded features back into their original features.

    The returned values represent contribution toward the
    model's delay prediction:

        positive -> increases delay risk
        negative -> reduces delay risk

    Returns:
        List sorted by absolute contribution.
    """

    features = pd.DataFrame(
        [project_data],
        columns=FEATURE_COLUMNS
    )

    # Apply the exact preprocessing used during training
    transformed_features = preprocessor.transform(features)

    transformed_feature_names = (
        preprocessor.get_feature_names_out()
    )

    # XGBoost native feature contributions
    dmatrix = xgb.DMatrix(
        transformed_features,
        feature_names=list(transformed_feature_names)
    )

    contributions = classifier.get_booster().predict(
        dmatrix,
        pred_contribs=True
    )

    contributions = np.asarray(contributions)

    # One project -> first row
    if contributions.ndim == 2:
        contributions = contributions[0]

    # Last value is the XGBoost bias/base contribution.
    feature_contributions = contributions[:-1]

    grouped_contributions = {}

    for feature_name, contribution in zip(
        transformed_feature_names,
        feature_contributions
    ):
        # Remove ColumnTransformer prefix
        #
        # Example:
        # categorical__compensation_status_Pending
        #
        # becomes:
        # compensation_status_Pending
        clean_name = feature_name.split(
            "__",
            1
        )[-1]

        original_feature = None

        # Match categorical one-hot features
        for feature in CATEGORICAL_FEATURES:

            if clean_name.startswith(feature + "_"):
                original_feature = feature
                break

        # Match numerical features
        if original_feature is None:

            for feature in NUMERICAL_FEATURES:

                if clean_name == feature:
                    original_feature = feature
                    break

        # Fallback
        if original_feature is None:
            original_feature = clean_name

        grouped_contributions[original_feature] = (
            grouped_contributions.get(
                original_feature,
                0.0
            )
            + float(contribution)
        )

    results = []

    for feature, value in grouped_contributions.items():

        results.append(
            {
                "feature": feature,
                "shap_value": round(value, 4),
                "impact": (
                    "increases delay risk"
                    if value > 0
                    else "reduces delay risk"
                ),
            }
        )

    # Strongest contributors first
    results.sort(
        key=lambda x: abs(x["shap_value"]),
        reverse=True
    )

    return results


def get_top_delay_drivers(
    project_data: dict,
    top_n: int = 5
) -> list:
    """
    Return the strongest delay-risk contributors for a project.
    """

    grouped_shap = get_grouped_shap(project_data)

    top_drivers = []

    for item in grouped_shap[:top_n]:

        feature = item["feature"]

        display_name = FEATURE_DISPLAY_NAMES.get(
            feature,
            feature.replace("_", " ").title()
        )

        top_drivers.append(
            {
                "feature": display_name,
                "shap_value": item["shap_value"],
                "impact": item["impact"],
            }
        )

    return top_drivers


def analyze_risk(project_data: dict) -> dict:
    """
    Complete ML analysis for a project.

    Returns:
        - overall delay probability
        - overall risk category
        - overall delay prediction
        - top delay drivers
        - actionable recommendations
        - stage-wise delay predictions
    """

    # Overall prediction
    prediction = predict_risk(project_data)

    # Explainability
    top_drivers = get_top_delay_drivers(
        project_data
    )

    # Recommendations
    recommendations = generate_recommendations(
        project_data,
        prediction["delay_probability"]
    )

    # Stage-wise prediction
    stage_risks = predict_stage_risks(
        project_data
    )

    return {
        **prediction,
        "top_delay_drivers": top_drivers,
        "recommendations": recommendations,
        "stage_risks": stage_risks,
    }
