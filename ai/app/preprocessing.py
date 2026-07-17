"""
Merge OpenAQ pollutant data with OpenWeather conditions, clean it, and
engineer the features the model trains on.
Follows the research methodology: lag features, rolling averages, season,
weekday/weekend flags, IQR-based outlier removal.
"""
import logging
import numpy as np
import pandas as pd

from app.config import RAW_DIR, PROCESSED_DIR

logger = logging.getLogger(__name__)

POLLUTANTS = ["pm25", "pm10", "no2", "so2", "co", "o3"]
WEATHER = ["temperature", "humidity", "pressure", "wind_speed", "rainfall"]

# EPA breakpoints for PM2.5 → AQI (used as target when no direct AQI column)
PM25_BREAKPOINTS = [
    (0.0, 12.0, 0, 50),
    (12.1, 35.4, 51, 100),
    (35.5, 55.4, 101, 150),
    (55.5, 150.4, 151, 200),
    (150.5, 250.4, 201, 300),
    (250.5, 350.4, 301, 400),
    (350.5, 500.4, 401, 500),
]


def pm25_to_aqi(pm25: float) -> float:
    if pd.isna(pm25) or pm25 < 0:
        return np.nan
    for c_lo, c_hi, i_lo, i_hi in PM25_BREAKPOINTS:
        if c_lo <= pm25 <= c_hi:
            return round(((i_hi - i_lo) / (c_hi - c_lo)) * (pm25 - c_lo) + i_lo, 1)
    return 500.0  # cap


def no2_ug_to_aqi(no2_ug: float) -> float:
    """Convert NO2 µg/m³ to AQI sub-index (India CPCB breakpoints)."""
    if pd.isna(no2_ug) or no2_ug < 0:
        return np.nan
    breakpoints = [
        (0, 40, 0, 50), (41, 80, 51, 100), (81, 180, 101, 200),
        (181, 280, 201, 300), (281, 400, 301, 400), (401, 1000, 401, 500),
    ]
    for c_lo, c_hi, i_lo, i_hi in breakpoints:
        if c_lo <= no2_ug <= c_hi:
            return round(((i_hi - i_lo) / (c_hi - c_lo)) * (no2_ug - c_lo) + i_lo, 1)
    return 500.0


def compute_aqi(row: pd.Series) -> float:
    """Compute overall AQI as the max sub-index across all available pollutants."""
    sub_indices = []
    if "pm25" in row and not pd.isna(row["pm25"]):
        sub_indices.append(pm25_to_aqi(row["pm25"]))
    if "no2" in row and not pd.isna(row["no2"]):
        sub_indices.append(no2_ug_to_aqi(row["no2"]))
    return max(sub_indices) if sub_indices else np.nan


def load_raw() -> tuple[pd.DataFrame, pd.DataFrame]:
    aqi_path = RAW_DIR / "openaq_history.csv"
    weather_path = RAW_DIR / "openweather_forecast.csv"

    if not aqi_path.exists():
        raise FileNotFoundError(
            f"Missing {aqi_path}. Run: python -m app.data.fetch_openaq"
        )
    if not weather_path.exists():
        raise FileNotFoundError(
            f"Missing {weather_path}. Run: python -m app.data.fetch_openweather"
        )

    aqi_df = pd.read_csv(aqi_path, parse_dates=["datetime"])
    weather_df = pd.read_csv(weather_path, parse_dates=["datetime"])
    logger.info("Loaded raw data: AQI=%d rows, Weather=%d rows", len(aqi_df), len(weather_df))
    return aqi_df, weather_df


def merge(aqi_df: pd.DataFrame, weather_df: pd.DataFrame) -> pd.DataFrame:
    """Merge on nearest timestamp (weather is 3-hourly, AQI may be hourly)."""
    aqi_df = aqi_df.sort_values("datetime").copy()
    weather_df = weather_df.sort_values("datetime").copy()

    # Remove timezone info for merge_asof compatibility
    if aqi_df["datetime"].dt.tz is not None:
        aqi_df["datetime"] = aqi_df["datetime"].dt.tz_localize(None)
    if weather_df["datetime"].dt.tz is not None:
        weather_df["datetime"] = weather_df["datetime"].dt.tz_localize(None)

    merged = pd.merge_asof(
        aqi_df, weather_df, on="datetime", direction="nearest",
        tolerance=pd.Timedelta("3h")
    )
    logger.info("After merge: %d rows", len(merged))
    return merged


def remove_outliers_iqr(df: pd.DataFrame, columns: list) -> pd.DataFrame:
    """Remove rows where a column value is beyond 3×IQR from Q1/Q3."""
    mask = pd.Series(True, index=df.index)
    for col in columns:
        if col not in df.columns:
            continue
        q1, q3 = df[col].quantile(0.25), df[col].quantile(0.75)
        iqr = q3 - q1
        lower, upper = q1 - 3 * iqr, q3 + 3 * iqr
        col_mask = df[col].between(lower, upper) | df[col].isna()
        mask &= col_mask
    removed = (~mask).sum()
    if removed > 0:
        logger.info("IQR outlier removal: removed %d rows", removed)
    return df[mask].copy()


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.drop_duplicates(subset="datetime").reset_index(drop=True)

    # Interpolate short gaps (up to 3 readings) in pollutant/weather columns
    cols = [c for c in POLLUTANTS + WEATHER if c in df.columns]
    df[cols] = df[cols].interpolate(method="linear", limit=3).ffill().bfill()

    # Remove IQR-based outliers for core pollutants
    df = remove_outliers_iqr(df, [c for c in POLLUTANTS if c in df.columns])

    # Clip physically impossible values
    clip_ranges = {
        "pm25": (0, 999), "pm10": (0, 999), "no2": (0, 500),
        "so2": (0, 500), "co": (0, 100), "o3": (0, 500),
        "temperature": (-50, 60), "humidity": (0, 100),
        "wind_speed": (0, 100), "pressure": (850, 1100),
    }
    for col, (lo, hi) in clip_ranges.items():
        if col in df.columns:
            df[col] = df[col].clip(lo, hi)

    df = df.dropna(subset=["pm25"]).reset_index(drop=True)
    logger.info("After cleaning: %d rows", len(df))
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values("datetime").reset_index(drop=True)

    # Target: AQI from multi-pollutant sub-indices
    df["aqi"] = df.apply(compute_aqi, axis=1)
    df["aqi"] = df["aqi"].fillna(df["pm25"].apply(pm25_to_aqi))

    # Calendar features
    df["hour"] = df["datetime"].dt.hour
    df["day"] = df["datetime"].dt.day
    df["month"] = df["datetime"].dt.month
    df["dayofweek"] = df["datetime"].dt.dayofweek
    df["season"] = (df["month"] % 12 // 3 + 1)  # 1=winter 2=spring 3=summer 4=fall
    df["is_weekend"] = (df["dayofweek"] >= 5).astype(int)

    # Lag features (t-1, t-2, t-3 hours and t-24)
    for col in ["aqi", "pm25", "no2"]:
        if col not in df.columns:
            continue
        df[f"{col}_lag_1h"] = df[col].shift(1)
        df[f"{col}_lag_2h"] = df[col].shift(2)
        df[f"{col}_lag_3h"] = df[col].shift(3)
        df[f"{col}_lag_24h"] = df[col].shift(24)

    # Rolling averages
    for col in ["pm25", "no2", "aqi"]:
        if col not in df.columns:
            continue
        for window in [3, 6, 12, 24]:
            df[f"{col}_roll_{window}h"] = df[col].rolling(window=window, min_periods=1).mean()

    # Drop rows where core lag features are still NaN (first 24 rows)
    df = df.dropna(subset=["aqi_lag_24h", "aqi"]).reset_index(drop=True)
    logger.info("After feature engineering: %d rows, %d columns", len(df), len(df.columns))
    return df


def build_training_dataset(force: bool = False) -> pd.DataFrame:
    out_path = PROCESSED_DIR / "training_data.csv"
    if out_path.exists() and not force:
        logger.info("Loading cached training dataset from %s", out_path)
        return pd.read_csv(out_path, parse_dates=["datetime"])

    aqi_df, weather_df = load_raw()
    merged = merge(aqi_df, weather_df)
    cleaned = clean(merged)
    featured = engineer_features(cleaned)
    featured.to_csv(out_path, index=False)
    logger.info("Training dataset saved: %d rows → %s", len(featured), out_path)
    return featured


if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    data = build_training_dataset(force=True)
    print(f"Training dataset: {data.shape} → {PROCESSED_DIR / 'training_data.csv'}")
    print(data.describe())
