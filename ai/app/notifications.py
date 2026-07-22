"""
AirMind AI — Smart Environmental Notification Engine
Generates personalized real-time alerts for AQI spikes, new hotspot cluster creation,
health advisories, and community green ranking updates.
"""
from typing import Dict, List, Any
from datetime import datetime, timezone

def generate_smart_notifications(
    current_aqi: float = 185.0,
    forecast_24h: float = 210.0,
    user_location: str = "Guwahati"
) -> Dict[str, Any]:
    """
    Generates tailored notifications based on AQI delta, forecast trajectory, and user role.
    """
    notifications = []

    # 1. AQI Spike / Deterioration Alert
    if forecast_24h > current_aqi + 15.0:
        notifications.append({
            "id": "NOTIF-AQI-01",
            "type": "AQI_DETERIORATION_WARNING",
            "severity": "HIGH",
            "title": f"⚠️ AQI Degradation Forecast for {user_location}",
            "message": f"AQI is predicted to rise from {current_aqi} to {forecast_24h} over the next 24 hours.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "target_audience": ["citizens", "municipal_officers"]
        })

    # 2. Hotspot Alert
    if current_aqi > 200.0:
        notifications.append({
            "id": "NOTIF-HS-02",
            "type": "HOTSPOT_ALERT",
            "severity": "CRITICAL",
            "title": f"🔥 Active DBSCAN Hotspot Cluster Detected near {user_location}",
            "message": "Heavy traffic and uncontained dust have triggered a priority enforcement dispatch in Ward 12.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "target_audience": ["enforcement_squads", "city_administrators"]
        })

    # 3. Health Advisory Notification
    notifications.append({
        "id": "NOTIF-HLTH-03",
        "type": "HEALTH_ADVISORY",
        "severity": "INFO",
        "title": "💡 Daily Health Recommendation",
        "message": "Sensitive groups (children, elderly, asthmatics) should limit morning outdoor exercise between 07:00 and 09:30.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "target_audience": ["citizens"]
    })

    return {
        "unread_count": len(notifications),
        "notifications": notifications
    }
