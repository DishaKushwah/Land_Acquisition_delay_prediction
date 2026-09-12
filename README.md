# Land Acquisition Delay Prediction — Backend (SIH26)

## Setup
```bash
pip install -r requirements.txt
cp .env.example .env   # edit DATABASE_URL / SECRET_KEY
python train_model.py  # trains XGBoost + SHAP, saves artifacts into app/ml/
uvicorn app.main:app --reload
```

Docs at http://localhost:8000/docs

## Flow
1. `POST /auth/register` then `/auth/login` -> JWT
2. `POST /projects/` -> create a project record
3. `POST /risk/predict/{project_id}` -> scores it (XGBoost + SHAP), stores risk_score/category/top_delay_drivers
4. `GET /risk/high-risk` -> feeds the alert/dashboard layer
