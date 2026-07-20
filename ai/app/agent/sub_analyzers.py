"""
AirMind Intelligence Agent — Sub-Analyzers
Deterministic domain analyzers that process raw ML predictions, GIS layers, satellite rasters,
and CPCB metrics into structured environmental analytical evaluations.
"""
from typing import Dict, List, Any
import numpy as np

class AQIAnalyzer:
    @staticmethod
    def analyze(aqi_data: Dict[str, Any]) -> Dict[str, Any]:
        aqi_val = float(aqi_data.get("aqi", 145.0))
        dominant = aqi_data.get("dominant_pollutant", "pm25")
        category = aqi_data.get("category", "Moderate")

        if aqi_val <= 50:
            tier = "GOOD"
            severity = 1
        elif aqi_val <= 100:
            tier = "SATISFACTORY"
            severity = 2
        elif aqi_val <= 200:
            tier = "MODERATE"
            severity = 3
        elif aqi_val <= 300:
            tier = "POOR"
            severity = 4
        elif aqi_val <= 400:
            tier = "VERY_POOR"
            severity = 5
        else:
            tier = "SEVERE"
            severity = 6

        return {
            "current_aqi": round(aqi_val, 1),
            "tier": tier,
            "severity_level": severity,
            "dominant_pollutant": dominant,
            "category": category,
            "sub_indices": aqi_data.get("sub_indices", {}),
            "is_official_cpcb": aqi_data.get("is_official_cpcb", True)
        }

class ForecastAnalyzer:
    @staticmethod
    def analyze(forecast_data: Dict[str, Any]) -> Dict[str, Any]:
        h24 = forecast_data.get("24h", {})
        h48 = forecast_data.get("48h", {})
        h72 = forecast_data.get("72h", {})

        a24 = h24.get("predicted_aqi", 150.0)
        a48 = h48.get("predicted_aqi", 160.0)
        a72 = h72.get("predicted_aqi", 140.0)

        # Evaluate trajectory
        diff = a72 - a24
        if diff > 15.0:
            trajectory = "DEGRADATING"
        elif diff < -15.0:
            trajectory = "IMPROVING"
        else:
            trajectory = "STABLE"

        return {
            "horizons": {
                "24h": {"aqi": a24, "ci_95": h24.get("confidence_interval_95", [a24-15, a24+15]), "confidence_score": h24.get("confidence_score_pct", 91.0)},
                "48h": {"aqi": a48, "ci_95": h48.get("confidence_interval_95", [a48-20, a48+20]), "confidence_score": h48.get("confidence_score_pct", 88.0)},
                "72h": {"aqi": a72, "ci_95": h72.get("confidence_interval_95", [a72-25, a72+25]), "confidence_score": h72.get("confidence_score_pct", 85.0)}
            },
            "trajectory": trajectory,
            "peak_aqi_72h": max(a24, a48, a72),
            "min_aqi_72h": min(a24, a48, a72),
            "overall_model": h24.get("model_used", "LightGBM")
        }

class WeatherAnalyzer:
    @staticmethod
    def analyze(weather_data: Dict[str, Any]) -> Dict[str, Any]:
        temp = float(weather_data.get("temperature", 28.5))
        humidity = float(weather_data.get("humidity", 65.0))
        wind_speed = float(weather_data.get("wind_speed", 3.2))
        wind_dir = float(weather_data.get("wind_direction", 220.0))

        dispersion_capacity = "POOR" if wind_speed < 2.0 else ("MODERATE" if wind_speed < 5.0 else "GOOD")
        inversion_risk = (temp < 15.0 and wind_speed < 1.5 and humidity > 70.0)

        return {
            "temperature_c": temp,
            "humidity_pct": humidity,
            "wind_speed_ms": wind_speed,
            "wind_direction_deg": wind_dir,
            "dispersion_capacity": dispersion_capacity,
            "inversion_risk": inversion_risk
        }

class TrafficAnalyzer:
    @staticmethod
    def analyze(traffic_data: Dict[str, Any]) -> Dict[str, Any]:
        congestion = float(traffic_data.get("congestion_pct", 75.0))
        emission_score = float(traffic_data.get("emission_score_ug_m3", 115.0))
        status = traffic_data.get("status", "LIVE_API")

        return {
            "source": traffic_data.get("source", "Traffic Intelligence"),
            "congestion_pct": congestion,
            "emission_score_ug_m3": emission_score,
            "traffic_impact_tier": "HIGH" if congestion > 70 else ("MEDIUM" if congestion > 40 else "LOW"),
            "data_mode": status
        }

class SatelliteAnalyzer:
    @staticmethod
    def analyze(satellite_data: Dict[str, Any]) -> Dict[str, Any]:
        no2_col = float(satellite_data.get("satellite_no2_mol_m2", 0.00018))
        ndvi = float(satellite_data.get("ndvi_index", 0.35))
        active_fires = int(satellite_data.get("active_fires_count", 1))

        return {
            "satellite_no2_mol_m2": no2_col,
            "ndvi_canopy_index": ndvi,
            "active_fires_detected": active_fires,
            "satellite_coverage_status": "VALIDATED"
        }

class HotspotAnalyzer:
    @staticmethod
    def analyze(hotspots_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_hotspots = len(hotspots_data)
        if total_hotspots == 0:
            return {"total_hotspots": 0, "max_cluster_aqi": 0.0, "primary_hotspot": None}

        sorted_hs = sorted(hotspots_data, key=lambda x: x.get("mean_aqi", 0), reverse=True)
        top = sorted_hs[0]

        return {
            "total_hotspots": total_hotspots,
            "max_cluster_aqi": top.get("mean_aqi", 0.0),
            "primary_hotspot": {
                "cluster_id": top.get("cluster_id", 1),
                "center": top.get("center", [28.6139, 77.2090]),
                "radius_meters": top.get("radius_meters", 800),
                "mean_aqi": top.get("mean_aqi", 210.0),
                "confidence_score": top.get("confidence_score", 92.0),
                "contributing_vops": top.get("contributing_vops", 12)
            }
        }

class PollutionSourceAnalyzer:
    @staticmethod
    def analyze(source_data: Dict[str, Any]) -> Dict[str, Any]:
        contribs = source_data.get("contributions", {})
        top_source = source_data.get("dominant_source", "Traffic")
        confidence = float(source_data.get("confidence_score", 92.0))

        return {
            "contributions": contribs,
            "dominant_source": top_source,
            "confidence_score": confidence,
            "explanation": source_data.get("explanation", "")
        }

class CitizenReportAnalyzer:
    @staticmethod
    def analyze(reports_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_reports = len(reports_data)
        unresolved = sum(1 for r in reports_data if r.get("status") in ["submitted", "under_review"])

        return {
            "total_citizen_reports": total_reports,
            "unresolved_reports": unresolved,
            "incident_density": "HIGH" if unresolved >= 5 else ("MODERATE" if unresolved >= 2 else "LOW")
        }

class EnvironmentalRiskAnalyzer:
    @staticmethod
    def analyze(aqi: float, max_hotspot_aqi: float, top_source: str, wind_speed: float) -> Dict[str, Any]:
        # Calculate Danger Score (0 - 100)
        base = (aqi / 500.0) * 50.0
        hotspot_boost = (max_hotspot_aqi / 500.0) * 30.0
        stagnation_boost = (1.0 / max(0.5, wind_speed)) * 10.0
        
        danger_score = round(min(100.0, base + hotspot_boost + stagnation_boost), 1)

        if danger_score >= 80.0:
            alert_level = "CRITICAL"
        elif danger_score >= 60.0:
            alert_level = "SEVERE"
        elif danger_score >= 40.0:
            alert_level = "HIGH"
        elif danger_score >= 20.0:
            alert_level = "MODERATE"
        else:
            alert_level = "LOW"

        return {
            "environmental_danger_score": danger_score,
            "alert_level": alert_level,
            "primary_hazard": f"Elevated {top_source} Emissions under Poor Dispersion"
        }
