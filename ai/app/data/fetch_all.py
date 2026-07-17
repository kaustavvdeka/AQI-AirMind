"""
Convenience script: fetch all data sources (OpenAQ, OpenWeather, GEE).
Run from the project root: python -m app.data.fetch_all
"""
import logging
import sys

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("fetch_all")


def run():
    # 1. OpenAQ
    logger.info("=" * 50)
    logger.info("Step 1/3: Fetching OpenAQ air quality data…")
    try:
        from app.data.fetch_openaq import fetch_and_cache as fetch_aq
        df_aq = fetch_aq(force=True)
        logger.info("✅ OpenAQ: %d rows saved", len(df_aq))
    except Exception as e:
        logger.error("❌ OpenAQ fetch failed: %s", e)

    # 2. OpenWeather
    logger.info("=" * 50)
    logger.info("Step 2/3: Fetching OpenWeather data…")
    try:
        from app.data.fetch_openweather import fetch_and_cache as fetch_wx
        df_wx = fetch_wx(force=True)
        logger.info("✅ OpenWeather: %d rows saved", len(df_wx))
    except Exception as e:
        logger.error("❌ OpenWeather fetch failed: %s", e)

    # 3. Google Earth Engine (optional)
    logger.info("=" * 50)
    logger.info("Step 3/3: Fetching GEE satellite data (optional)…")
    try:
        from app.config import GEE_PROJECT_ID
        if not GEE_PROJECT_ID:
            logger.info("GEE_PROJECT_ID not set — skipping satellite data.")
        else:
            from app.data.fetch_gee import fetch_s5p_pollutant
            # Guwahati region bounding box
            bbox = (89.5, 25.5, 93.5, 27.5)
            path = fetch_s5p_pollutant("no2", bbox, days_back=10)
            logger.info("✅ GEE NO2 GeoTIFF saved: %s", path)
    except Exception as e:
        logger.warning("⚠️ GEE fetch skipped: %s", e)

    logger.info("=" * 50)
    logger.info("Data fetch complete.")


if __name__ == "__main__":
    run()
