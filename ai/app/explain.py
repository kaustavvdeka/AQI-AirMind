"""
Explain AQI predictions: global feature importance from training, plus:
- Official CPCB AQI sub-indices calculation steps
- Pollution source apportionment attribution percentages
- Driver readouts relative to reference guidelines
"""
import json
import numpy as np
import pandas as pd

from app.config import MODELS_DIR
from app.predict import _latest_known_row
from app.cpcb_calculator import calculate_cpcb_aqi
from app.attribution import attribute_pollution_sources

TRAINING_REPORT_PATH = MODELS_DIR / "training_report.json"

REFERENCE_LEVELS = {
    "pm25": 12.0, "pm10": 54.0, "no2": 40.0, "so2": 20.0, "co": 4.0, "o3": 100.0,
    "wind_speed": 3.0,
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
    """Why is AQI elevated right now? Compare current readings to CPCB benchmarks and attribute sources."""
    row = _latest_known_row()
    
    # 1. Driver readout (relative to health references)
    drivers = []
    for feature, ref in REFERENCE_LEVELS.items():
        if feature not in row.index or row[feature] is None or pd.isna(row[feature]):
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

    # 2. CPCB sub-index steps calculation
    metrics = {}
    for poll in ["pm25", "pm10", "no2", "so2", "co", "o3"]:
        if poll in row.index and not pd.isna(row[poll]):
            metrics[poll] = float(row[poll])
    cpcb_result = calculate_cpcb_aqi(metrics)

    # 3. Source Apportionment attribution percentage
    weather = {
        "wind_speed": float(row.get("wind_speed", 3.0)),
        "humidity": float(row.get("humidity", 60.0))
    }
    contributions, explanation = attribute_pollution_sources(metrics, weather)

    return {
        "timestamp": row["datetime"].isoformat() if hasattr(row["datetime"], "isoformat") else str(row["datetime"]),
        "current_aqi": round(float(cpcb_result["aqi"]), 1),
        "cpcb_details": {
            "aqi": cpcb_result["aqi"],
            "dominant_pollutant": cpcb_result["dominant_pollutant"],
            "sub_indices": cpcb_result["sub_indices"],
            "calculation_steps": cpcb_result["calculation_steps"],
            "is_official_cpcb": cpcb_result["is_official_cpcb"]
        },
        "source_attribution": {
            "contributions": contributions,
            "explanation": explanation
        },
        "active_drivers": drivers,
        "global_feature_importance": global_feature_importance()[:8],
    }
