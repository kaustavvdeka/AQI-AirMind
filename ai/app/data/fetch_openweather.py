"""
Fetch current conditions and forecast from the OpenWeather API and cache
locally as CSV.

Also generates synthetic weather data as fallback for offline demo.
"""
import logging
from datetime import datetime

import pandas as pd
import requests

from app.config import OPENWEATHER_API_KEY, RAW_DIR, DEFAULT_LAT, DEFAULT_LON, require_key

logger = logging.getLogger(__name__)
BASE_URL = "https://api.openweathermap.org/data/2.5"


def _key() -> str:
    return require_key("OPENWEATHER_API_KEY", OPENWEATHER_API_KEY)


def fetch_current(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON) -> dict:
    resp = requests.get(
        f"{BASE_URL}/weather",
        params={"lat": lat, "lon": lon, "appid": _key(), "units": "metric"},
        timeout=30,
    )
    resp.raise_for_status()
    j = resp.json()
    return {
        "datetime": pd.Timestamp.utcnow(),
        "temperature": j["main"]["temp"],
        "humidity": j["main"]["humidity"],
        "pressure": j["main"]["pressure"],
        "wind_speed": j["wind"]["speed"],
        "rainfall": j.get("rain", {}).get("1h", 0.0),
    }


def fetch_forecast(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON, hours: int = 120) -> pd.DataFrame:
    """5-day/3-hour forecast (OpenWeather free tier), trimmed to requested horizon."""
    resp = requests.get(
        f"{BASE_URL}/forecast",
        params={"lat": lat, "lon": lon, "appid": _key(), "units": "metric"},
        timeout=30,
    )
    resp.raise_for_status()
    j = resp.json()
    rows = []
    for entry in j.get("list", []):
        rows.append({
            "datetime": pd.to_datetime(entry["dt"], unit="s"),
            "temperature": entry["main"]["temp"],
            "humidity": entry["main"]["humidity"],
            "pressure": entry["main"]["pressure"],
            "wind_speed": entry["wind"]["speed"],
            "rainfall": entry.get("rain", {}).get("3h", 0.0),
        })
    df = pd.DataFrame(rows)
    if df.empty:
        return df
    cutoff = pd.Timestamp.utcnow().tz_localize(None) + pd.Timedelta(hours=hours)
    return df[df["datetime"] <= cutoff].reset_index(drop=True)


def synthesize_weather_data(days: int = 90) -> pd.DataFrame:
    """Generate realistic synthetic weather data for Guwahati when API is unavailable."""
    import numpy as np
    logger.warning("OpenWeather API unavailable — generating synthetic weather data.")
    rng = np.random.default_rng(42)
    n = days * 8  # 3-hourly intervals
    timestamps = pd.date_range(end=datetime.now(), periods=n, freq="3h")
    month = timestamps.month.to_numpy()
    hour = timestamps.hour.to_numpy()

    # Guwahati seasonal temp: 15°C winter, 32°C summer, monsoon ~28°C
    base_temp = 24 + 8 * np.sin(2 * np.pi * (month - 3) / 12)
    # Diurnal variation ±4°C
    diurnal = 4 * np.sin(2 * np.pi * (hour - 6) / 24)

    df = pd.DataFrame({
        "datetime": timestamps,
        "temperature": (base_temp + diurnal + rng.normal(0, 2, n)).clip(-5, 45),
        "humidity": (75 + 15 * np.sin(2 * np.pi * month / 12) + rng.normal(0, 8, n)).clip(20, 100),
        "pressure": (1010 + rng.normal(0, 5, n)).clip(985, 1035),
        "wind_speed": (rng.exponential(3, n)).clip(0, 25),
        "rainfall": np.where(
            (month >= 6) & (month <= 9),
            rng.exponential(3, n),  # monsoon
            rng.exponential(0.3, n),  # dry season
        ).clip(0, 50),
    })
    return df


def fetch_and_cache(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON,
                    force: bool = False, days: int = 90) -> pd.DataFrame:
    cache_path = RAW_DIR / "openweather_forecast.csv"
    if cache_path.exists() and not force:
        df = pd.read_csv(cache_path, parse_dates=["datetime"])
        logger.info("Using cached weather data (%d rows)", len(df))
        return df

    # Try real API first; fall back to historical-style synthetic data
    # (The free forecast endpoint only gives 5 days; for training we extend with synthetic)
    try:
        forecast_df = fetch_forecast(lat, lon, hours=120)
        logger.info("Fetched %d rows from OpenWeather forecast API", len(forecast_df))

        # Extend with synthetic historical data (for sufficient training coverage)
        hist_df = synthesize_weather_data(days=days)
        # Filter synthetic to only past data (forecast covers the future)
        hist_df = hist_df[hist_df["datetime"] < forecast_df["datetime"].min()].copy()

        combined = pd.concat([hist_df, forecast_df], ignore_index=True)
        combined = combined.sort_values("datetime").drop_duplicates("datetime").reset_index(drop=True)
        combined.to_csv(cache_path, index=False)
        logger.info("Saved weather data: %d rows (historical+forecast)", len(combined))
        return combined

    except Exception as exc:
        logger.warning("OpenWeather fetch failed: %s — using synthetic data", exc)
        df = synthesize_weather_data(days=days)
        df.to_csv(cache_path, index=False)
        return df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    current = fetch_current()
    print("Current weather:", current)
    forecast = fetch_and_cache(force=True)
    print(f"Weather rows: {len(forecast)} → {RAW_DIR / 'openweather_forecast.csv'}")
