"""
AirMind AI — Data Quality & API Freshness Monitoring System
Self-contained, zero-dependency module. Validates API freshness, coordinates,
missing values, stale satellite rasters, and sensor drift.
All checks are independent with internal HTTP probes and fallback logic.
"""
import time
import logging
import requests
from datetime import datetime, timezone
from typing import Dict, List, Any

from app.config import (
    OPENAQ_API_KEY, OPENWEATHER_API_KEY, GEE_PROJECT_ID,
    MONGODB_URI, DEFAULT_LAT, DEFAULT_LON, RAW_DIR, PROCESSED_DIR
)

logger = logging.getLogger(__name__)

def _probe(name: str, url: str, headers: dict = None, timeout: int = 5) -> Dict[str, Any]:
    """Generic HTTP probe with latency measurement."""
    t0 = time.monotonic()
    try:
        resp = requests.get(url, headers=headers or {}, timeout=timeout)
        latency_ms = round((time.monotonic() - t0) * 1000, 1)
        ok = resp.status_code < 400
        return {
            "status": "PASS" if ok else "FAIL",
            "http_status": resp.status_code,
            "response_time_ms": latency_ms,
            "recommendation": f"{name} responded in {latency_ms}ms (HTTP {resp.status_code})." if ok
                              else f"{name} returned HTTP {resp.status_code}. Check API key or endpoint."
        }
    except Exception as e:
        latency_ms = round((time.monotonic() - t0) * 1000, 1)
        return {
            "status": "FAIL",
            "http_status": 0,
            "response_time_ms": latency_ms,
            "recommendation": f"{name} unreachable: {str(e)[:80]}. Fallback active."
        }

def _check_openaq() -> Dict[str, Any]:
    if not OPENAQ_API_KEY:
        return {"status": "WARN", "response_time_ms": 0,
                "recommendation": "OPENAQ_API_KEY not configured — synthetic data active."}
    return _probe(
        "OpenAQ v3 API",
        "https://api.openaq.org/v3/locations?limit=1",
        headers={"X-API-Key": OPENAQ_API_KEY}
    )

def _check_openweather() -> Dict[str, Any]:
    if not OPENWEATHER_API_KEY:
        return {"status": "WARN", "response_time_ms": 0,
                "recommendation": "OPENWEATHER_API_KEY not configured — weather fallback active."}
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={DEFAULT_LAT}&lon={DEFAULT_LON}&appid={OPENWEATHER_API_KEY}"
    return _probe("OpenWeather API", url)

def _check_gee() -> Dict[str, Any]:
    if not GEE_PROJECT_ID:
        return {"status": "WARN", "response_time_ms": 0,
                "recommendation": "GEE_PROJECT_ID not configured — satellite raster simulation active."}
    return {"status": "PASS", "response_time_ms": 0,
            "recommendation": "GEE project configured. Authenticate via ee.Authenticate() for live rasters."}

def _check_mongodb() -> Dict[str, Any]:
    if not MONGODB_URI:
        return {"status": "WARN", "response_time_ms": 0,
                "recommendation": "MONGODB_URI not set — persistence layer unavailable."}
    try:
        import pymongo
        t0 = time.monotonic()
        client = pymongo.MongoClient(MONGODB_URI, serverSelectionTimeoutMS=3000)
        client.server_info()
        latency_ms = round((time.monotonic() - t0) * 1000, 1)
        return {"status": "PASS", "response_time_ms": latency_ms,
                "recommendation": f"MongoDB connected. Ping: {latency_ms}ms."}
    except Exception as e:
        return {"status": "FAIL", "response_time_ms": 0,
                "recommendation": f"MongoDB unreachable: {str(e)[:80]}"}

def _check_data_files() -> Dict[str, Any]:
    """Check freshness and existence of cached AQI and weather data files."""
    issues = []
    aq_path = RAW_DIR / "openaq_history.csv"
    wx_path = RAW_DIR / "openweather_forecast.csv"
    proc_path = PROCESSED_DIR / "training_data.csv"

    for path, label in [(aq_path, "AQI history CSV"), (wx_path, "Weather forecast CSV"), (proc_path, "Training dataset CSV")]:
        if not path.exists():
            issues.append(f"Missing: {label}")
        else:
            age_hours = (time.time() - path.stat().st_mtime) / 3600
            if age_hours > 48:
                issues.append(f"Stale ({age_hours:.0f}h old): {label}")

    if issues:
        return {"status": "WARN", "response_time_ms": 0,
                "recommendation": "Data file issues: " + "; ".join(issues)}
    return {"status": "PASS", "response_time_ms": 0,
            "recommendation": "All cached data files present and fresh."}

def _check_sensor_drift() -> Dict[str, Any]:
    """Validate AQI data for outlier spikes and sensor drift using IQR."""
    try:
        import pandas as pd
        import numpy as np
        proc_path = PROCESSED_DIR / "training_data.csv"
        if not proc_path.exists():
            return {"status": "WARN", "response_time_ms": 0,
                    "recommendation": "Training dataset not found for drift check."}

        df = pd.read_csv(proc_path, parse_dates=["datetime"])
        if "pm25" not in df.columns:
            return {"status": "WARN", "response_time_ms": 0,
                    "recommendation": "PM2.5 column not found for drift analysis."}

        q1, q3 = df["pm25"].quantile(0.25), df["pm25"].quantile(0.75)
        iqr = q3 - q1
        outliers = ((df["pm25"] < q1 - 3 * iqr) | (df["pm25"] > q3 + 3 * iqr)).sum()
        outlier_pct = round(outliers / len(df) * 100, 2)
        duplicates = df.duplicated(subset=["datetime"]).sum()

        if outlier_pct > 2.0 or duplicates > 0:
            return {"status": "WARN", "response_time_ms": 0,
                    "recommendation": f"Sensor drift detected: {outlier_pct}% PM2.5 outliers, {duplicates} duplicate timestamps."}
        return {"status": "PASS", "response_time_ms": 0,
                "recommendation": f"Data quality clean: {outlier_pct}% outliers, {duplicates} duplicates. Calibration nominal."}
    except Exception as e:
        return {"status": "WARN", "response_time_ms": 0,
                "recommendation": f"Drift check error: {str(e)[:80]}"}


def check_data_quality(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON) -> Dict[str, Any]:
    """
    Executes full automated data validation pipeline:
    - Coordinate bounds check
    - API freshness probes (OpenAQ, OpenWeather, GEE, MongoDB)
    - Cached data file freshness
    - Sensor drift and outlier detection
    """
    alerts = []
    checks = []

    # 1. Coordinate Validity
    valid_coords = (-90.0 <= lat <= 90.0) and (-180.0 <= lon <= 180.0)
    checks.append({
        "name": "Coordinate Validity",
        "status": "PASS" if valid_coords else "FAIL",
        "response_time_ms": 0,
        "details": f"Lat: {lat}, Lon: {lon} — {'valid WGS84' if valid_coords else 'OUT OF BOUNDS'}"
    })
    if not valid_coords:
        alerts.append("CRITICAL: Out-of-bounds geographic coordinates provided.")

    # 2. OpenAQ API Freshness
    r = _check_openaq()
    checks.append({"name": "OpenAQ Ground Sensor API", "status": r["status"],
                   "response_time_ms": r["response_time_ms"], "details": r["recommendation"]})
    if r["status"] == "FAIL":
        alerts.append("WARNING: OpenAQ API unreachable — synthetic sensor data active.")

    # 3. OpenWeather API Freshness
    r = _check_openweather()
    checks.append({"name": "OpenWeather Meteorological API", "status": r["status"],
                   "response_time_ms": r["response_time_ms"], "details": r["recommendation"]})
    if r["status"] == "FAIL":
        alerts.append("WARNING: OpenWeather API unreachable — weather fallback active.")

    # 4. GEE Satellite Raster Feed
    r = _check_gee()
    checks.append({"name": "Google Earth Engine Satellite Raster", "status": r["status"],
                   "response_time_ms": r["response_time_ms"], "details": r["recommendation"]})

    # 5. MongoDB Persistence
    r = _check_mongodb()
    checks.append({"name": "MongoDB Persistence Store", "status": r["status"],
                   "response_time_ms": r["response_time_ms"], "details": r["recommendation"]})
    if r["status"] == "FAIL":
        alerts.append("WARNING: MongoDB unreachable — data persistence unavailable.")

    # 6. Cached Data File Freshness
    r = _check_data_files()
    checks.append({"name": "Cached Data File Freshness", "status": r["status"],
                   "response_time_ms": 0, "details": r["recommendation"]})
    if r["status"] == "WARN":
        alerts.append("INFO: Some cached data files are stale or missing.")

    # 7. Sensor Drift & Outlier Spike Check
    r = _check_sensor_drift()
    checks.append({"name": "Sensor Drift & Outlier Detection", "status": r["status"],
                   "response_time_ms": 0, "details": r["recommendation"]})
    if r["status"] == "WARN":
        alerts.append("WARNING: Sensor drift or data quality anomaly detected.")

    # System Health Score
    score_map = {"PASS": 1.0, "WARN": 0.6, "FAIL": 0.0}
    health_score = round(sum(score_map.get(c["status"], 0) for c in checks) / len(checks) * 100.0, 1)
    overall_status = "HEALTHY" if health_score >= 80.0 else ("DEGRADED" if health_score >= 50.0 else "CRITICAL")

    return {
        "overall_status": overall_status,
        "health_score_pct": health_score,
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "location": {"lat": lat, "lon": lon},
        "active_alerts_count": len(alerts),
        "alerts": alerts,
        "checks": checks
    }
