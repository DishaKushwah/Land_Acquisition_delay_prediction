from pathlib import Path

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBClassifier


BASE_DIR = Path(__file__).resolve().parent

DATA_PATH = (BASE_DIR/ "data"/ "land_acquisition_synthetic_newFeat.csv")


MODEL_DIR = BASE_DIR / "app" / "ml" / "stage_models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(DATA_PATH)

print("Dataset shape:", df.shape)

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

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=False
            ),
            CATEGORICAL_FEATURES,
        ),
        (
            "numerical",
            "passthrough",
            NUMERICAL_FEATURES,
        ),
    ]
)

STAGES = {
    "notification": "notification_delay",
    "approval": "approval_delay",
    "compensation": "compensation_delay",
    "possession": "possession_delay",
}


for stage_name, target_column in STAGES.items():

    print("\n" + "=" * 60)
    print(f"Training {stage_name.upper()} model")
    print("=" * 60)

    X = df[FEATURE_COLUMNS]

    y = (
        df[target_column] == "Delayed"
    ).astype(int)

    print(
        "Target distribution:",
        y.value_counts().to_dict()
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    # Fit preprocessing separately for each model
    stage_preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False
                ),
                CATEGORICAL_FEATURES,
            ),
            (
                "numerical",
                "passthrough",
                NUMERICAL_FEATURES,
            ),
        ]
    )

    X_train_transformed = (
        stage_preprocessor.fit_transform(X_train)
    )

    X_test_transformed = (
        stage_preprocessor.transform(X_test)
    )

    class_counts = y_train.value_counts()

    scale_pos_weight = (
        class_counts[0] / class_counts[1]
    )

    model = XGBClassifier(
        n_estimators=500,
        max_depth=5,
        learning_rate=0.03,
        subsample=0.9,
        colsample_bytree=0.9,
        min_child_weight=2,
        reg_alpha=0.1,
        reg_lambda=1,
        scale_pos_weight=scale_pos_weight,
        random_state=42,
        eval_metric="logloss",
    )

    model.fit(
        X_train_transformed,
        y_train
    )

    artifact = {
        "model": model,
        "preprocessor": stage_preprocessor,
        "features": FEATURE_COLUMNS,
    }

    model_path = (
        MODEL_DIR
        / f"{stage_name}_model.joblib"
    )

    joblib.dump(
        artifact,
        model_path
    )

    print(
        f"Saved: {model_path}"
    )

print("\nAll stage models trained successfully.")