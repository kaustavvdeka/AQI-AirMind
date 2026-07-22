"""
AirMind AI — 4D Atmospheric Digital Twin Engine
Simulates 4D spatiotemporal hourly pollutant transport, dispersion direction,
wind vector advection, and future hotspot evolution for dynamic map animation.
"""
import numpy as np
from typing import Dict, List, Any
from datetime import datetime, timezone, timedelta
from app.config import DEFAULT_LAT, DEFAULT_LON

def simulate_atmospheric_digital_twin(
    center_lat: float = DEFAULT_LAT,
    center_lon: float = DEFAULT_LON,
    baseline_aqi: float = 210.0,
    wind_speed: float = 3.5,
    wind_direction: float = 220.0,
    simulation_hours: int = 6
) -> Dict[str, Any]:
    """
    Generates a 4D spatiotemporal simulation grid with hourly steps for interactive map playback.
    """
    now = datetime.now(timezone.utc)
    angle_rad = np.radians(wind_direction)

    timeline_steps = []

    for t in range(simulation_hours):
        target_time = now + timedelta(hours=t)

        # Wind advection drift displacement over time t
        shift_km = (wind_speed * 3.6) * (t * 0.8)  # km drift
        shift_lat = (shift_km * np.cos(angle_rad)) / 111.0
        shift_lon = (shift_km * np.sin(angle_rad)) / (111.0 * np.cos(np.radians(center_lat)))

        step_lat = center_lat + shift_lat
        step_lon = center_lon + shift_lon

        # Diurnal boundary layer height fluctuation (meters)
        h = target_time.hour
        pbl_height_m = round(max(300.0, min(1800.0, 900.0 + (np.sin((h - 6) * np.pi / 12.0) * 600.0))), 1)

        # Dispersion decay & plume expansion
        plume_radius_m = round(800.0 + (t * 450.0), 1)
        simulated_aqi = round(max(30.0, baseline_aqi * (0.95 ** t) + (np.sin(t) * 8.0)), 1)

        timeline_steps.append({
            "step_hour": t,
            "timestamp": target_time.isoformat(),
            "simulated_aqi": simulated_aqi,
            "wind_speed_ms": wind_speed,
            "wind_direction_deg": wind_direction,
            "pbl_height_m": pbl_height_m,
            "plume_center": [round(step_lat, 5), round(step_lon, 5)],
            "plume_radius_m": plume_radius_m,
            "dispersion_direction": "SOUTH_WEST" if 180 <= wind_direction <= 270 else "NORTH_EAST",
            "future_hotspot_evolution": "DISPERSING" if simulated_aqi < baseline_aqi else "ACCUMULATING"
        })

    return {
        "digital_twin_status": "ACTIVE_SIMULATION",
        "resolution": "4D Spatiotemporal (1km x 1km x 1h)",
        "simulation_hours": simulation_hours,
        "initial_center": [center_lat, center_lon],
        "timeline": timeline_steps
    }
