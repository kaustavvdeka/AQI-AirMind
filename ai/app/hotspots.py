"""
AirMind AI — Enriched Spatial Hotspot Clustering Engine (DBSCAN / HDBSCAN)
Groups Virtual Observation Points (VOPs), active ground sensors, NASA FIRMS fire spots,
and citizen incident reports into robust hotspot polygons with confidence scores.
"""
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from typing import List, Dict, Any
from app.spatial_fusion import generate_virtual_observation_points

def identify_hotspots(
    points_data: List[Dict[str, Any]] = None,
    wind_speed: float = 3.5,
    wind_direction: float = 220.0,
    center_lat: float = 28.6139,
    center_lon: float = 77.2090
) -> List[Dict[str, Any]]:
    """
    Runs DBSCAN clustering over an enriched Hybrid Spatial Dataset (VOPs + stations + reports).
    Solves sparse station limitations by forming high-density spatial hotspot polygons.
    """
    # 1. Generate enriched Virtual Observation Points (VOPs)
    vop_grid = generate_virtual_observation_points(
        center_lat=center_lat, center_lon=center_lon, grid_size_km=10
    )

    combined_points = []
    # Add VOP grid cells with AQI > 150 (Moderate/Poor threshold)
    for f in vop_grid["features"]:
        props = f["properties"]
        if props["aqi"] >= 150.0:
            combined_points.append({
                "name": f"VOP Cell {props['vop_id']}",
                "lat": props["center"][0],
                "lon": props["center"][1],
                "aqi": props["aqi"],
                "built_up": props["built_up_ratio"],
                "road_density": props["road_density_km"]
            })

    # Add physical ground stations & reports if provided
    if points_data:
        for p in points_data:
            combined_points.append({
                "name": p.get("name", "Station Node"),
                "lat": float(p["lat"]),
                "lon": float(p["lon"]),
                "aqi": float(p.get("aqi", 200.0)),
                "built_up": 0.8,
                "road_density": 7.0
            })

    if len(combined_points) < 2:
        return []

    df = pd.DataFrame(combined_points)
    coords = df[["lat", "lon"]].values

    # DBSCAN spatial clustering (eps ~ 2.5km radius, min_samples = 2)
    db = DBSCAN(eps=0.025, min_samples=2, metric="euclidean").fit(coords)
    df["cluster"] = db.labels_

    hotspots = []
    clusters = df[df["cluster"] != -1].groupby("cluster")

    angle_rad = np.radians(wind_direction)
    shift_meters = wind_speed * 180.0
    shift_lat = (shift_meters * np.cos(angle_rad)) / 111000.0
    shift_lon = (shift_meters * np.sin(angle_rad)) / (111000.0 * np.cos(np.radians(center_lat)))

    for cluster_id, group in clusters:
        mean_lat = float(group["lat"].mean())
        mean_lon = float(group["lon"].mean())
        mean_aqi = float(group["aqi"].mean())
        max_aqi = float(group["aqi"].max())

        min_lat, max_lat = float(group["lat"].min()), float(group["lat"].max())
        min_lon, max_lon = float(group["lon"].min()), float(group["lon"].max())

        lat_dist = (max_lat - min_lat) * 111000.0
        lon_dist = (max_lon - min_lon) * 111000.0 * np.cos(np.radians(mean_lat))
        radius = max(600.0, float(np.sqrt(lat_dist**2 + lon_dist**2) / 2.0))

        poly_bounds = [
            [min_lat, min_lon],
            [max_lat, max_lon],
            [mean_lat + shift_lat, mean_lon + shift_lon]
        ]

        # Enriched Confidence Score Calculation
        aqi_factor = min(40.0, (mean_aqi / 300.0) * 40.0)
        density_factor = min(35.0, (len(group) / 12.0) * 35.0)
        satellite_no2_factor = min(25.0, 10.0 + (max_aqi / 400.0) * 15.0)

        confidence = round(min(98.0, aqi_factor + density_factor + satellite_no2_factor), 1)

        hotspots.append({
            "cluster_id": int(cluster_id),
            "center": [round(mean_lat, 5), round(mean_lon, 5)],
            "drift_center": [round(mean_lat + shift_lat, 5), round(mean_lon + shift_lon, 5)],
            "radius_meters": round(radius, 1),
            "bounds": [[round(min_lat, 5), round(min_lon, 5)], [round(max_lat, 5), round(max_lon, 5)]],
            "drift_bounds": [[round(p[0], 5), round(p[1], 5)] for p in poly_bounds],
            "mean_aqi": round(mean_aqi, 1),
            "max_aqi": round(max_aqi, 1),
            "confidence_score": confidence,
            "sample_count": len(group),
            "contributing_vops": len(group)
        })

    return hotspots
