"""
Explain AQI predictions: global feature importance from training, plus a
simple per-prediction driver readout (which inputs are elevated relative
to healthy reference levels).
"""
import json

from app.config import MODELS_DIR
from app.predict import _latest_known_row

TRAINING_REPORT_PATH = MODELS_DIR / "training_report.json"

# Rough "healthy" reference levels used only to flag which inputs are
# currently elevated — not a regulatory standard.
REFERENCE_LEVELS = {
    "pm25": 12.0, "pm10": 54.0, "no2": 40.0, "so2": 20.0, "co": 4.0, "o3": 100.0,
    "wind_speed": 3.0,  # low wind = worse dispersion, flagged in reverse
}

HUMAN_LABELS = {
    "pm25": "Elevated PM2.5", "pm10": "Elevated PM10", "no2": "High NO2 (traffic/industry)",
    "so2": "High SO2 (industrial emissions)", "co": "High CO", "o3": "High ground-level O3",
    "wind_speed": "Low wind speed (poor dispersion)", "rainfall": "Low rainfall (no washout)",
}


def global_feature_importance() -> list:
    if not TRAINING_REPORT_PATH.exists():
        return []
    report = json.loads(TRAINING_REPORT_PATH.read_text())
    return report.get("feature_importance", [])


def explain_current_conditions() -> dict:
    """Why is AQI elevated right now? Compare current readings to reference levels."""
    row = _latest_known_row()
    drivers = []

    for feature, ref in REFERENCE_LEVELS.items():
        if feature not in row.index or row[feature] is None:
            continue
        value = row[feature]
        if feature == "wind_speed":
            if value < ref:
                drivers.append({"factor": HUMAN_LABELS[feature], "value": round(float(value), 1)})
        elif value > ref:
            pct_above = round(((value - ref) / ref) * 100, 1)
            drivers.append(
                {"factor": HUMAN_LABELS[feature], "value": round(float(value), 1), "pct_above_reference": pct_above}
            )

    drivers.sort(key=lambda d: d.get("pct_above_reference", 0), reverse=True)

    return {
        "timestamp": row["datetime"].isoformat() if hasattr(row["datetime"], "isoformat") else str(row["datetime"]),
        "current_aqi": round(float(row.get("aqi", 0)), 1),
        "active_drivers": drivers,
        "global_feature_importance": global_feature_importance()[:8],
    }
