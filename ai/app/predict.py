"""
Load the trained model and produce AQI predictions for 24h/48h/72h horizons,
using the latest known readings plus forecast weather.
"""
import json
from pathlib import Path

import joblib
import pandas as pd

from app.config import MODELS_DIR, PROCESSED_DIR
from app.train import FEATURE_COLUMNS

MODEL_PATH = MODELS_DIR / "random_forest.pkl"
MODEL_INFO_PATH = MODELS_DIR / "model_info.json"

AQI_CATEGORIES = [
    (50, "Good", "#00e400"),
    (100, "Satisfactory", "#92d050"),
    (200, "Moderate", "#ffff00"),
    (300, "Poor", "#ff7e00"),
    (400, "Very Poor", "#ff0000"),
    (500, "Severe", "#99004c"),
]


class ModelNotTrainedError(RuntimeError):
    pass


def aqi_category(aqi: float) -> tuple[str, str]:
    for threshold, label, color in AQI_CATEGORIES:
        if aqi <= threshold:
            return label, color
    return "Severe", "#99004c"


def load_model():
    if not MODEL_PATH.exists():
        raise ModelNotTrainedError(
            "No trained model found. Call POST /train or wait for auto-training to complete."
        )
    return joblib.load(MODEL_PATH)


def load_model_info() -> dict:
    if not MODEL_INFO_PATH.exists():
        return {}
    return json.loads(MODEL_INFO_PATH.read_text())


def _latest_known_row() -> pd.Series:
    data_path = PROCESSED_DIR / "training_data.csv"
    if not data_path.exists():
        raise FileNotFoundError(
            f"Missing {data_path}. Build the training dataset first via POST /train."
        )
    df = pd.read_csv(data_path, parse_dates=["datetime"])
    return df.sort_values("datetime").iloc[-1]


def predict_horizon(hours_ahead: int) -> dict:
    """Predict AQI `hours_ahead` hours from the latest known data point."""
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

    features = [c for c in FEATURE_COLUMNS if c in row.index]
    X = pd.DataFrame([row[features].fillna(0)])
    prediction = float(model.predict(X)[0])
    prediction = max(0, min(500, prediction))  # clamp to valid range

    category, color = aqi_category(prediction)

    return {
        "target_time": target_time.isoformat(),
        "hours_ahead": hours_ahead,
        "predicted_aqi": round(prediction, 1),
        "category": category,
        "color": color,
        "model": info.get("model_name", "unknown"),
        "model_metrics": info.get("metrics", {}),
    }


def predict_all_horizons() -> dict:
    return {
        "24h": predict_horizon(24),
        "48h": predict_horizon(48),
        "72h": predict_horizon(72),
    }
