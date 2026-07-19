"""
AirMind AI — Atmospheric Dispersion Physics Engine (Gaussian Plume Model)
Computes spatial pollutant dispersion downwind from emission sources using wind vector,
stack height, atmospheric stability class, and Gaussian Plume physics.
"""
import numpy as np
from typing import Dict, List, Any

# Pasquill-Gifford dispersion parameters: sigma_y = a * x^b, sigma_z = c * x^d
STABILITY_PARAMS = {
    "A": (0.22, 0.91, 0.20, 0.91),  # Extremely unstable
    "B": (0.16, 0.91, 0.12, 0.91),  # Moderately unstable
    "C": (0.11, 0.91, 0.08, 0.91),  # Slightly unstable
    "D": (0.08, 0.91, 0.06, 0.91),  # Neutral
    "E": (0.06, 0.91, 0.03, 0.91),  # Slightly stable
    "F": (0.04, 0.91, 0.016, 0.91), # Moderately stable
}

def compute_gaussian_plume(
    source_lat: float = 26.1445,
    source_lon: float = 91.7362,
    wind_speed: float = 3.5,
    wind_direction: float = 180.0, # Wind coming FROM South (moving North)
    emission_rate_q: float = 500.0, # g/s
    stack_height_h: float = 45.0, # meters
    stability_class: str = "C",
    max_distance_km: float = 10.0
) -> Dict[str, Any]:
    """
    Computes Gaussian Plume concentration field downwind.
    Returns GeoJSON contours, dispersion vectors for animation, and affected area stats.
    """
    speed = max(0.5, wind_speed)
    stability = stability_class.upper() if stability_class.upper() in STABILITY_PARAMS else "C"
    a, b, c, d = STABILITY_PARAMS[stability]

    # Wind direction conversion: direction is where wind comes from.
    # Motion vector goes towards (wind_direction + 180) % 360
    motion_angle_rad = np.radians((wind_direction + 180.0) % 360.0)

    # Downwind distance steps (x axis along plume centerline)
    x_steps = np.linspace(100.0, max_distance_km * 1000.0, 20)

    contours = []
    vectors = []

    # Calculate centerline peak concentrations and lateral plume width
    for x in x_steps:
        sigma_y = a * (x ** b)
        sigma_z = c * (x ** d)

        # Centerline ground-level concentration (y = 0, z = 0)
        c_ground = (emission_rate_q / (np.pi * speed * sigma_y * sigma_z)) * np.exp(-0.5 * (stack_height_h / sigma_z) ** 2)

        # Plume width (y boundary where concentration drops to 10% of centerline)
        width_y = np.sqrt(-2.0 * (sigma_y ** 2) * np.log(0.1)) if c_ground > 0 else 50.0

        # Convert local downwind displacement (x, y) into geographic (lat, lon)
        # Centerline point at distance x
        dx_lat = (x * np.cos(motion_angle_rad)) / 111000.0
        dx_lon = (x * np.sin(motion_angle_rad)) / (111000.0 * np.cos(np.radians(source_lat)))

        center_lat = source_lat + dx_lat
        center_lon = source_lon + dx_lon

        # Perpendicular angle for width
        perp_angle_rad = motion_angle_rad + (np.pi / 2.0)
        dy_lat = (width_y * np.cos(perp_angle_rad)) / 111000.0
        dy_lon = (width_y * np.sin(perp_angle_rad)) / (111000.0 * np.cos(np.radians(source_lat)))

        left_lat, left_lon = center_lat + dy_lat, center_lon + dy_lon
        right_lat, right_lon = center_lat - dy_lat, center_lon - dy_lon

        vectors.append({
            "distance_m": round(float(x), 1),
            "center": [round(float(center_lat), 5), round(float(center_lon), 5)],
            "left_bound": [round(float(left_lat), 5), round(float(left_lon), 5)],
            "right_bound": [round(float(right_lat), 5), round(float(right_lon), 5)],
            "ground_concentration_ug_m3": round(float(c_ground * 1e6), 2),
            "plume_width_m": round(float(width_y * 2.0), 1)
        })

    # Construct GeoJSON Polygon representing the entire plume boundary
    polygon_coords = []
    # Left edge going out
    for v in vectors:
        polygon_coords.append(v["left_bound"])
    # Right edge returning back
    for v in reversed(vectors):
        polygon_coords.append(v["right_bound"])
    polygon_coords.append(vectors[0]["left_bound"])  # Close loop

    geojson_plume = {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[p[1], p[0]] for p in polygon_coords]]  # [lon, lat]
        },
        "properties": {
            "source": [source_lat, source_lon],
            "wind_speed_ms": speed,
            "wind_direction_deg": wind_direction,
            "stability_class": stability,
            "emission_rate_g_s": emission_rate_q,
            "max_distance_km": max_distance_km,
            "peak_concentration_ug_m3": vectors[0]["ground_concentration_ug_m3"]
        }
    }

    return {
        "plume_geojson": geojson_plume,
        "plume_vectors": vectors,
        "summary": {
            "source_coordinates": [source_lat, source_lon],
            "drift_heading_degrees": round((wind_direction + 180.0) % 360.0, 1),
            "max_reach_km": max_distance_km,
            "affected_area_sq_km": round((max_distance_km * (vectors[-1]["plume_width_m"] / 1000.0)), 2)
        }
    }
