"""
AirMind AI — Multi-City Intelligence Dashboard Engine
Compares air quality, 24h forecasts, trends, active hotspots, and intervention effectiveness
across major Indian metropolitan cities: Delhi, Mumbai, Kolkata, Bengaluru, Chennai, Guwahati.
"""
from typing import Dict, List, Any
from app.cpcb_calculator import get_cpcb_category

CITIES = [
    {"city": "Delhi", "state": "NCR", "lat": 28.6139, "lon": 77.2090, "base_aqi": 312, "pm25": 165.0, "pm10": 280.0, "no2": 72.0, "so2": 18.0, "hotspots": 14},
    {"city": "Kolkata", "state": "West Bengal", "lat": 22.5726, "lon": 88.3639, "base_aqi": 218, "pm25": 98.0, "pm10": 175.0, "no2": 54.0, "so2": 15.0, "hotspots": 8},
    {"city": "Guwahati", "state": "Assam", "lat": 26.1445, "lon": 91.7362, "base_aqi": 185, "pm25": 82.0, "pm10": 145.0, "no2": 42.0, "so2": 14.0, "hotspots": 5},
    {"city": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lon": 72.8777, "base_aqi": 142, "pm25": 58.0, "pm10": 110.0, "no2": 45.0, "so2": 12.0, "hotspots": 6},
    {"city": "Bengaluru", "state": "Karnataka", "lat": 12.9716, "lon": 77.5946, "base_aqi": 88, "pm25": 32.0, "pm10": 70.0, "no2": 32.0, "so2": 8.0, "hotspots": 2},
    {"city": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707, "base_aqi": 76, "pm25": 26.0, "pm10": 62.0, "no2": 28.0, "so2": 7.0, "hotspots": 1},
]

def get_multi_city_comparison() -> Dict[str, Any]:
    """Returns comparative metrics, ranking, and forecast trends across cities."""
    results = []

    for c in CITIES:
        aqi = c["base_aqi"]
        category, color, impact = get_cpcb_category(aqi)
        
        # 24h forecast trend
        forecast_24h = round(aqi * 1.05, 1)
        trend = "Worsening" if forecast_24h > aqi else "Improving"
        
        # Intervention effectiveness score (0 to 100%)
        intervention_score = round(max(40.0, 95.0 - (aqi * 0.15)), 1)
        
        results.append({
            "city": c["city"],
            "state": c["state"],
            "coordinates": [c["lat"], c["lon"]],
            "aqi": aqi,
            "category": category,
            "color": color,
            "health_impact": impact,
            "pm25": c["pm25"],
            "pm10": c["pm10"],
            "no2": c["no2"],
            "so2": c["so2"],
            "forecast_24h": forecast_24h,
            "trend": trend,
            "active_hotspots": c["hotspots"],
            "intervention_effectiveness": intervention_score
        })

    # Sort cities by AQI descending (Rank 1 = Most Polluted)
    results.sort(key=lambda x: x["aqi"], reverse=True)
    
    for rank, city_data in enumerate(results, 1):
        city_data["national_rank"] = rank

    avg_national_aqi = round(sum(r["aqi"] for r in results) / len(results), 1)

    return {
        "cities_count": len(results),
        "national_average_aqi": avg_national_aqi,
        "most_polluted_city": results[0]["city"],
        "cleanest_city": results[-1]["city"],
        "rankings": results
    }
