import os
import joblib
import pandas as pd

_MODEL_PATH = os.path.join(os.path.dirname(__file__), "xgb_risk_model.joblib")
_EXPLAINER_PATH = os.path.join(os.path.dirname(__file__), "shap_explainer.joblib")
_COLUMNS_PATH = os.path.join(os.path.dirname(__file__), "feature_columns.joblib")

CATEGORICAL_COLS = [
    "project_type", "compensation_status", "legal_dispute",
    "approval_stage", "stakeholder_responsiveness",
]
NUMERIC_COLS = [
    "land_area_hectares", "affected_families", "rehabilitation_progress_pct",
    "historical_dept_performance_score", "months_since_initiation",
]

_model = None
_explainer = None
_feature_columns = None


def _load_artifacts():
    global _model, _explainer, _feature_columns
    if _model is None:
        if not os.path.exists(_MODEL_PATH):
            raise RuntimeError(
                "Model artifacts not found. Run `python train_model.py` from the "
                "backend root before starting the API."
            )
        _model = joblib.load(_MODEL_PATH)
        _explainer = joblib.load(_EXPLAINER_PATH)
        _feature_columns = joblib.load(_COLUMNS_PATH)


def _vectorize(project: dict) -> pd.DataFrame:
    row = {col: project[col] for col in CATEGORICAL_COLS + NUMERIC_COLS}
    df = pd.DataFrame([row])
    df = pd.get_dummies(df, columns=CATEGORICAL_COLS)
    # align to the exact training-time column order; any category not seen
    # during training (e.g. a new project_type) safely maps to all-zero dummies
    df = df.reindex(columns=_feature_columns, fill_value=0)
    return df


def predict_risk(project: dict, top_n_drivers: int = 3):
    """
    project: dict with keys matching CATEGORICAL_COLS + NUMERIC_COLS
    Returns: (delay_probability: float, risk_category: str, top_drivers: list[str])
    """
    _load_artifacts()
    X = _vectorize(project)

    probability = float(_model.predict_proba(X)[0][1])

    if probability >= 0.65:
        category = "High"
    elif probability >= 0.35:
        category = "Medium"
    else:
        category = "Low"

    shap_values = _explainer.shap_values(X)
    contributions = pd.Series(shap_values[0], index=X.columns).abs().sort_values(ascending=False)
    top_drivers = [_humanize_feature(f) for f in contributions.head(top_n_drivers).index]

    return probability, category, top_drivers


def _humanize_feature(feature_name: str) -> str:
    """Turns a one-hot column like 'compensation_status_Pending' into 'compensation status: pending'."""
    for col in CATEGORICAL_COLS:
        if feature_name.startswith(col + "_"):
            value = feature_name[len(col) + 1:]
            return f"{col.replace('_', ' ')}: {value.lower()}"
    return feature_name.replace("_", " ")
