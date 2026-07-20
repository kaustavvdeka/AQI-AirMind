"""
Load the trained model and produce AQI predictions for 24h/48h/72h horizons with 95% Confidence Intervals.
"""
import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd

from app.config import MODELS_DIR, PROCESSED_DIR
from app.cpcb_calculator import get_cpcb_category

MODEL_PATH = MODELS_DIR / "random_forest.pkl"
MODEL_INFO_PATH = MODELS_DIR / "model_info.json"

class ModelNotTrainedError(RuntimeError):
    pass

def load_model():
    if not MODEL_PATH.exists():
        raise ModelNotTrainedError("No trained model found. Call POST /train or wait for auto-training.")
    return joblib.load(MODEL_PATH)

def load_model_info() -> dict:
    if not MODEL_INFO_PATH.exists():
        return {}
    return json.loads(MODEL_INFO_PATH.read_text())

def _latest_known_row() -> pd.Series:
    data_path = PROCESSED_DIR / "training_data.csv"
    if not data_path.exists():
        raise FileNotFoundError(f"Missing {data_path}. Build training dataset first.")
    df = pd.read_csv(data_path, parse_dates=["datetime"])
    return df.sort_values("datetime").iloc[-1]

def predict_horizon(hours_ahead: int) -> dict:
    """Predict AQI with 95% Confidence Intervals (CI) and confidence score."""
    model = load_model()
    info = load_model_info()
    latest = _latest_known_row()

    target_time = latest["datetime"] + pd.Timedelta(hours=hours_ahead)
    row = latest.copy()
    row["hour"] = target_time.hour
    row["day"] = target_time.day
    row["month"] = target_time.month
    row["dayofweek"] = target_time.dayofweek
    row["season"] = target_time.month % 12 // 3 + 1
    row["is_weekend"] = int(target_time.dayofweek >= 5)

    features = info.get("features", list(row.index))
    # Build feature array safely — avoids FutureWarning from fillna on object dtype Series
    feature_vals = {f: (float(row[f]) if f in row.index and not pd.isna(row[f]) else 0.0) for f in features}
    X = pd.DataFrame([feature_vals], columns=features)


    prediction = float(model.predict(X)[0])
    prediction = max(0.0, min(500.0, prediction))

    # Calculate 95% Confidence Interval based on model RMSE
    rmse = info.get("metrics", {}).get("rmse", 12.0)
    # Horizon uncertainty multiplier (longer horizon = wider interval)
    horizon_multiplier = 1.0 + (hours_ahead / 72.0) * 0.4
    margin_error = round(1.96 * rmse * horizon_multiplier, 1)

    ci_lower = max(0.0, round(prediction - margin_error, 1))
    ci_upper = min(500.0, round(prediction + margin_error, 1))

    # Prediction Confidence Score (0 - 100%)
    r2 = info.get("metrics", {}).get("r2", 0.88)
    confidence_score = min(98.0, round(max(50.0, (r2 * 100.0) - (hours_ahead * 0.15)), 1))

    category, color, health_impact = get_cpcb_category(prediction)

    return {
        "target_time": target_time.isoformat(),
        "hours_ahead": hours_ahead,
        "predicted_aqi": round(prediction, 1),
        "confidence_interval_95": [ci_lower, ci_upper],
        "margin_of_error": margin_error,
        "confidence_score_pct": confidence_score,
        "category": category,
        "color": color,
        "health_impact": health_impact,
        "model_used": info.get("model_name", "RandomForest"),
        "model_metrics": info.get("metrics", {})
    }

def predict_all_horizons() -> dict:
    return {
        "24h": predict_horizon(24),
        "48h": predict_horizon(48),
        "72h": predict_horizon(72),
    }
