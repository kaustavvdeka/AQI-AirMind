"""
Central configuration for the AirMind AI service.
All secrets come from environment variables (.env) — never hardcoded.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the project root (one level up from /ai)
ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")

# --- API keys -------------------------------------------------------
OPENAQ_API_KEY = os.getenv("OPENAQ_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY") or os.getenv("OpenWeather_api_key")
GEE_PROJECT_ID = os.getenv("GEE_PROJECT_ID")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI")

# --- Location (default demo city: Guwahati) --------------------------
DEFAULT_LAT = float(os.getenv("DEFAULT_LAT", "26.1445"))
DEFAULT_LON = float(os.getenv("DEFAULT_LON", "91.7362"))
DEFAULT_CITY = os.getenv("DEFAULT_CITY", "Guwahati")

# --- Paths ------------------------------------------------------------
DATA_DIR = ROOT_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
MODELS_DIR = Path(__file__).resolve().parents[1] / "models"

for d in (RAW_DIR, PROCESSED_DIR, MODELS_DIR):
    d.mkdir(parents=True, exist_ok=True)


def require_key(name: str, value: str | None) -> str:
    """Raise a clear error instead of silently using an empty/None key."""
    if not value:
        raise RuntimeError(
            f"{name} is not set. Add it to your .env file at the project root."
        )
    return value
