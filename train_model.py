from pathlib import Path

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBClassifier


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = (BASE_DIR/ "data"/ "land_acquisition_synthetic_forTuning.csv")
df = pd.read_csv(DATA_PATH)

print("Dataset shape:", df.shape)
print("\nTarget distribution:")
print(df["delay_label"].value_counts())

excluded_columns = [
    "project_id",
    "district",
    "notification_delay",
    "approval_delay",
    "compensation_delay",
    "possession_delay",
    "delay_label"
]

X = df.drop(columns=excluded_columns)

# Delayed = 1
# On-Time = 0
y = (df["delay_label"] == "Delayed").astype(int)

print("\nFeatures shape:", X.shape)
print("Target shape:", y.shape)

X_train, X_test, y_train, y_test = train_test_split(X,y,test_size=0.20,random_state=42,stratify=y)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))
print("\nTraining class distribution:")
print(y_train.value_counts())
print("\nTesting class distribution:")
print(y_test.value_counts())

categorical_features = [
    "state",
    "project_type",
    "compensation_status",
    "legal_dispute",
    "approval_stage",
    "stakeholder_responsiveness"
]

numerical_features = [
    "land_area_hectares",
    "affected_families",
    "rehabilitation_progress_pct",
    "historical_dept_performance_score",
    "months_since_initiation"
]

preprocessor = ColumnTransformer(
    transformers=[
        ("categorical",OneHotEncoder(handle_unknown="ignore",sparse_output=False),categorical_features),
        ("numerical","passthrough",numerical_features)
    ]
)

class_counts = y_train.value_counts()
scale_pos_weight = (class_counts[0] / class_counts[1])

print("\nClass counts:")
print(class_counts)
print("\nScale positive weight:",scale_pos_weight)

classifier = XGBClassifier(
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
    eval_metric="logloss"
)

model = Pipeline(
    steps=[("preprocessor", preprocessor),("classifier", classifier)])
print("\nTraining XGBoost model...")

model.fit(X_train,y_train)
print("Training completed successfully.")

# Generate probabilities
y_probability = model.predict_proba(X_test)[:, 1]

# Operational threshold used in the final V5 model
THRESHOLD = 0.40

y_pred = (y_probability >= THRESHOLD).astype(int)

accuracy = accuracy_score(y_test,y_pred)
precision = precision_score(y_test,y_pred,zero_division=0)
recall = recall_score(y_test,y_pred,zero_division=0)
f1 = f1_score(y_test,y_pred,zero_division=0)
roc_auc = roc_auc_score(y_test,y_probability)

print("\n" + "=" * 60)
print("MODEL EVALUATION")
print("=" * 60)

print(f"Threshold : {THRESHOLD:.2f}")
print(f"Accuracy  : {accuracy:.3f}")
print(f"Precision : {precision:.3f}")
print(f"Recall    : {recall:.3f}")
print(f"F1 Score  : {f1:.3f}")
print(f"ROC-AUC   : {roc_auc:.3f}")

print("\nClassification Report:")
print(classification_report(y_test,y_pred,target_names=["On-Time", "Delayed"],zero_division=0))
print("Confusion Matrix:")
print(confusion_matrix(y_test,y_pred))

MODEL_DIR = BASE_DIR / "app" / "ml"
MODEL_DIR.mkdir(parents=True,exist_ok=True)
joblib.dump(model,MODEL_DIR / "risk_model.joblib")

print("\nModel saved to:")
print(MODEL_DIR / "risk_model.joblib")

print("\nTraining pipeline completed.")