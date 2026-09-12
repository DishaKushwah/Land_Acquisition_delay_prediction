"""
Trains the XGBoost delay-prediction model on the synthetic dataset and saves
the artifacts the FastAPI backend loads at request time:
  app/ml/xgb_risk_model.joblib   - trained classifier
  app/ml/shap_explainer.joblib   - SHAP TreeExplainer for the "key drivers" endpoint
  app/ml/feature_columns.joblib  - exact one-hot column order used at inference

Run this once (or on a schedule, as new project data comes in — see the
"continuous learning" requirement in the PS) before starting the API.

Usage:
    python train_model.py
"""

import joblib
import pandas as pd
import shap
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from xgboost import XGBClassifier

DATA_PATH = "data/land_acquisition_synthetic_dataset.csv"
MODEL_OUT = "app/ml/xgb_risk_model.joblib"
EXPLAINER_OUT = "app/ml/shap_explainer.joblib"
COLUMNS_OUT = "app/ml/feature_columns.joblib"

CATEGORICAL_COLS = [
    "project_type", "compensation_status", "legal_dispute",
    "approval_stage", "stakeholder_responsiveness",
]
NUMERIC_COLS = [
    "land_area_hectares", "affected_families", "rehabilitation_progress_pct",
    "historical_dept_performance_score", "months_since_initiation",
]

df = pd.read_csv(DATA_PATH)
df["target"] = (df["delay_label"] == "Delayed").astype(int)

X = pd.get_dummies(df[CATEGORICAL_COLS + NUMERIC_COLS], columns=CATEGORICAL_COLS)
y = df["target"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

model = XGBClassifier(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.08,
    subsample=0.9,
    colsample_bytree=0.9,
    eval_metric="logloss",
    random_state=42,
)
model.fit(X_train, y_train)

print(classification_report(y_test, model.predict(X_test)))

explainer = shap.TreeExplainer(model)

joblib.dump(model, MODEL_OUT)
joblib.dump(explainer, EXPLAINER_OUT)
joblib.dump(list(X.columns), COLUMNS_OUT)

print(f"\nSaved model -> {MODEL_OUT}")
print(f"Saved explainer -> {EXPLAINER_OUT}")
print(f"Saved {len(X.columns)} feature columns -> {COLUMNS_OUT}")
