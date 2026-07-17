"""
Download satellite layers from Google Earth Engine: Sentinel-5P pollutant
columns, MODIS NDVI / land surface temperature, and ERA5 reanalysis
weather. Requires `earthengine-api` + `geemap`, and a one-time
`earthengine authenticate` login plus a registered GEE project.
"""
from datetime import date, timedelta
import logging
from pathlib import Path
import ee
import geemap as gp

from app.config import GEE_PROJECT_ID, RAW_DIR, require_key

logger = logging.getLogger(__name__)

# Sentinel-5P bands we care about, and the collection each lives in.
S5P_COLLECTIONS = {
    "no2": ("COPERNICUS/S5P/NRTI/L3_NO2", "NO2_column_number_density"),
    "so2": ("COPERNICUS/S5P/NRTI/L3_SO2", "SO2_column_number_density"),
    "co": ("COPERNICUS/S5P/NRTI/L3_CO", "CO_column_number_density"),
    "o3": ("COPERNICUS/S5P/NRTI/L3_O3", "O3_column_number_density"),
}


def _init():
    project = require_key("GEE_PROJECT_ID", GEE_PROJECT_ID)
    ee.Initialize(project=project)


def _default_window(days_back: int = 5):
    end = date.today()
    start = end - timedelta(days=days_back)
    return start.isoformat(), end.isoformat()


def fetch_s5p_pollutant(pollutant: str, region_bbox, days_back: int = 5, scale: int = 10000):
    """pollutant: one of 'no2', 'so2', 'co', 'o3'. region_bbox: (west, south, east, north)."""
    _init()
    if pollutant not in S5P_COLLECTIONS:
        raise ValueError(f"Unknown pollutant '{pollutant}', expected one of {list(S5P_COLLECTIONS)}")

    collection_id, band = S5P_COLLECTIONS[pollutant]
    date_from, date_to = _default_window(days_back)

    mean_image = (
        ee.ImageCollection(collection_id)
        .select(band)
        .filterDate(date_from, date_to)
        .mean()
    )
    region = ee.Geometry.BBox(*region_bbox)
    out_path = RAW_DIR / f"s5p_{pollutant}_mean.tif"

    gp.ee_export_image(
        mean_image, filename=str(out_path), scale=scale, region=region, file_per_band=False
    )
    return out_path


def fetch_modis_ndvi(region_bbox, days_back: int = 16, scale: int = 500):
    """MODIS NDVI (vegetation index) — MOD13A2, 16-day composite."""
    _init()
    date_from, date_to = _default_window(days_back)
    image = (
        ee.ImageCollection("MODIS/061/MOD13A2")
        .select("NDVI")
        .filterDate(date_from, date_to)
        .mean()
    )
    region = ee.Geometry.BBox(*region_bbox)
    out_path = RAW_DIR / "modis_ndvi.tif"
    gp.ee_export_image(image, filename=str(out_path), scale=scale, region=region, file_per_band=False)
    return out_path


def fetch_modis_lst(region_bbox, days_back: int = 8, scale: int = 1000):
    """MODIS Land Surface Temperature — MOD11A2, 8-day composite."""
    _init()
    date_from, date_to = _default_window(days_back)
    image = (
        ee.ImageCollection("MODIS/061/MOD11A2")
        .select("LST_Day_1km")
        .filterDate(date_from, date_to)
        .mean()
        .multiply(0.02)
        .subtract(273.15)  # Kelvin -> Celsius
    )
    region = ee.Geometry.BBox(*region_bbox)
    out_path = RAW_DIR / "modis_lst.tif"
    gp.ee_export_image(image, filename=str(out_path), scale=scale, region=region, file_per_band=False)
    return out_path


def fetch_all(region_bbox=(91.0, 25.5, 92.5, 26.8)):
    """Convenience: pull every satellite layer used by the platform for Guwahati bounding box."""
    results = {}
    for pollutant in S5P_COLLECTIONS:
        try:
            results[pollutant] = fetch_s5p_pollutant(pollutant, region_bbox)
        except Exception as e:
            logger.warning("Could not fetch GEE pollutant %s: %s", pollutant, e)
    
    try:
        results["ndvi"] = fetch_modis_ndvi(region_bbox)
    except Exception as e:
        logger.warning("Could not fetch GEE NDVI: %s", e)

    try:
        results["lst"] = fetch_modis_lst(region_bbox)
    except Exception as e:
        logger.warning("Could not fetch GEE LST: %s", e)

    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    paths = fetch_all()
    for name, path in paths.items():
        print(f"{name}: {path}")
