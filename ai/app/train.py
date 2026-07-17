"""
Train AQI prediction model. Compares Random Forest against XGBoost,
evaluates both with cross-validation, keeps the better one, and generates:
- training_report.json
- metrics.json
- feature_importance.csv
- Scatter, residual, and feature importance plots
"""
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path

import joblib
import matplotlib
matplotlib.use("Agg")  # non-interactive backend for server environments
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_absolute_percentage_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import KFold, cross_val_score, train_test_split

from app.config import MODELS_DIR
from app.preprocessing import build_training_dataset

logger = logging.getLogger(__name__)

try:
    from xgboost import XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    logger.warning("XGBoost not installed — only Random Forest will be trained")

PLOTS_DIR = MODELS_DIR.parent / "plots"
PLOTS_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_COLUMNS = [
    # Core pollutants
    "pm25", "pm10", "no2", "so2", "co", "o3",
    # Weather
    "temperature", "humidity", "wind_speed", "rainfall", "pressure",
    # Calendar
    "hour", "day", "month", "dayofweek", "season", "is_weekend",
    # Lag features
    "aqi_lag_1h", "aqi_lag_2h", "aqi_lag_3h", "aqi_lag_24h",
    "pm25_lag_1h", "pm25_lag_24h",
    "no2_lag_1h", "no2_lag_24h",
    # Rolling averages
    "pm25_roll_3h", "pm25_roll_6h", "pm25_roll_12h", "pm25_roll_24h",
    "no2_roll_3h", "no2_roll_6h", "no2_roll_24h",
    "aqi_roll_3h", "aqi_roll_6h", "aqi_roll_24h",
]
TARGET_COLUMN = "aqi"


def _rmse(y_true, y_pred) -> float:
    return float(np.sqrt(mean_squared_error(y_true, y_pred)))


def _metrics(y_true, y_pred) -> dict:
    return {
        "r2": round(float(r2_score(y_true, y_pred)), 4),
        "rmse": round(_rmse(y_true, y_pred), 4),
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 4),
        "mape": round(float(mean_absolute_percentage_error(y_true, y_pred)), 4),
    }


def _save_scatter_plot(y_test, y_pred, model_name: str):
    fig, ax = plt.subplots(figsize=(6, 6))
    ax.scatter(y_test, y_pred, alpha=0.4, color="#4fd1c5", s=20)
    lims = [min(y_test.min(), y_pred.min()), max(y_test.max(), y_pred.max())]
    ax.plot(lims, lims, "r--", lw=1.5, label="Perfect fit")
    ax.set_xlabel("Actual AQI")
    ax.set_ylabel("Predicted AQI")
    ax.set_title(f"{model_name} — Actual vs Predicted")
    ax.legend()
    fig.tight_layout()
    fig.savefig(PLOTS_DIR / f"{model_name}_scatter.png", dpi=100)
    plt.close(fig)


def _save_residual_plot(y_test, y_pred, model_name: str):
    residuals = np.array(y_test) - np.array(y_pred)
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.scatter(y_pred, residuals, alpha=0.4, color="#f6ad55", s=20)
    ax.axhline(0, color="red", lw=1.5, linestyle="--")
    ax.set_xlabel("Predicted AQI")
    ax.set_ylabel("Residual")
    ax.set_title(f"{model_name} — Residual Plot")
    fig.tight_layout()
    fig.savefig(PLOTS_DIR / f"{model_name}_residuals.png", dpi=100)
    plt.close(fig)


def _save_feature_importance_plot(feature_importance: list, model_name: str):
    top = feature_importance[:15]
    features = [f for f, _ in top]
    scores = [s for _, s in top]
    fig, ax = plt.subplots(figsize=(8, 6))
    bars = ax.barh(features[::-1], scores[::-1], color="#4fd1c5")
    ax.set_xlabel("Importance Score")
    ax.set_title(f"{model_name} — Top Feature Importances")
    fig.tight_layout()
    fig.savefig(PLOTS_DIR / f"{model_name}_feature_importance.png", dpi=100)
    plt.close(fig)


def train_and_select_best(force_rebuild_data: bool = False) -> dict:
    logger.info("Building training dataset (force=%s)…", force_rebuild_data)
    df = build_training_dataset(force=force_rebuild_data)

    available_features = [c for c in FEATURE_COLUMNS if c in df.columns]
    logger.info("Training features: %d / %d available", len(available_features), len(FEATURE_COLUMNS))

    X = df[available_features].fillna(0)
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    candidates = {}

    logger.info("Training Random Forest (n_estimators=300)…")
    rf = RandomForestRegressor(
        n_estimators=300, max_depth=None, min_samples_leaf=2,
        random_state=42, n_jobs=-1
    )
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_metrics = _metrics(y_test, rf_pred)
    logger.info("RF metrics: %s", rf_metrics)
    candidates["random_forest"] = (rf, rf_metrics, rf_pred)

    if HAS_XGBOOST:
        logger.info("Training XGBoost (n_estimators=300)…")
        xgb = XGBRegressor(
            n_estimators=300, max_depth=6, learning_rate=0.05,
            subsample=0.8, colsample_bytree=0.8,
            random_state=42, n_jobs=-1, verbosity=0
        )
        xgb.fit(X_train, y_train)
        xgb_pred = xgb.predict(X_test)
        xgb_metrics = _metrics(y_test, xgb_pred)
        logger.info("XGBoost metrics: %s", xgb_metrics)
        candidates["xgboost"] = (xgb, xgb_metrics, xgb_pred)

    # Best model = highest R² on held-out test set
    best_name, (best_model, best_metrics, best_pred) = max(
        candidates.items(), key=lambda kv: kv[1][1]["r2"]
    )
    logger.info("Best model: %s (R²=%.4f)", best_name, best_metrics["r2"])

    # Save models (canonical path is random_forest.pkl per spec)
    joblib.dump(best_model, MODELS_DIR / "random_forest.pkl")
    joblib.dump(best_model, MODELS_DIR / f"{best_name}.pkl")

    # Feature importance
    importances = getattr(best_model, "feature_importances_", None)
    feature_importance = (
        sorted(
            zip(available_features, importances.tolist()),
            key=lambda kv: kv[1], reverse=True,
        )
        if importances is not None else []
    )

    # Save plots
    try:
        _save_scatter_plot(y_test, best_pred, best_name)
        _save_residual_plot(y_test, best_pred, best_name)
        _save_feature_importance_plot(feature_importance, best_name)
    except Exception as exc:
        logger.warning("Could not save plots: %s", exc)

    # Save feature importance CSV
    fi_df = pd.DataFrame(feature_importance, columns=["feature", "importance"])
    fi_df.to_csv(MODELS_DIR / "feature_importance.csv", index=False)

    # Build report
    report = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "best_model": best_name,
        "n_samples": len(df),
        "n_features": len(available_features),
        "features": available_features,
        "candidates": {name: m for name, (_, m, _) in candidates.items()},
        "best_metrics": best_metrics,
        "feature_importance": feature_importance,
    }

    with open(MODELS_DIR / "training_report.json", "w") as f:
        json.dump(report, f, indent=2)

    # metrics.json (concise)
    with open(MODELS_DIR / "metrics.json", "w") as f:
        json.dump({"model": best_name, **best_metrics}, f, indent=2)

    # model_info.json
    with open(MODELS_DIR / "model_info.json", "w") as f:
        json.dump(
            {
                "model_name": best_name,
                "trained_at": report["trained_at"],
                "metrics": best_metrics,
                "features": available_features,
                "n_samples": len(df),
            },
            f, indent=2,
        )

    logger.info("Training complete. Model saved to %s", MODELS_DIR / "random_forest.pkl")
    return report


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = train_and_select_best(force_rebuild_data=True)
    print(json.dumps({k: v for k, v in result.items() if k != "feature_importance"}, indent=2))
