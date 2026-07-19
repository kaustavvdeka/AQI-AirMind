"""
AirMind AI — Policy Intervention Simulator ("What-If" Engine)
Enables city administrators to simulate policy interventions (Traffic reduction %,
Industrial stack shutdowns, Construction bans, Waste burning bans) and calculate
the predicted AQI reduction, health impact mitigation, and new CPCB category.
"""
from typing import Dict, Any
from app.cpcb_calculator import get_cpcb_category, calculate_cpcb_aqi

def simulate_interventions(
    baseline_aqi: float = 245.0,
    pollutants: Dict[str, float] = None,
    traffic_reduction_pct: float = 0.0,    # 0 to 100%
    industry_shutdown_pct: float = 0.0,   # 0 to 100%
    construction_ban: bool = False,
    waste_burn_ban: bool = False
) -> Dict[str, Any]:
    """
    Simulates the physical reduction of pollutant concentrations from policy interventions.
    """
    if pollutants is None:
        pollutants = {"pm25": 95.0, "pm10": 165.0, "no2": 54.0, "so2": 18.0, "co": 1.4, "o3": 45.0}

    # Deep copy pollutant metrics for simulation
    sim_p = dict(pollutants)

    # 1. Traffic Reduction Impact (primarily reduces NO2, CO, PM2.5)
    if traffic_reduction_pct > 0:
        factor = 1.0 - (min(100.0, traffic_reduction_pct) / 100.0 * 0.45)
        sim_p["no2"] = sim_p.get("no2", 40.0) * factor
        sim_p["co"] = sim_p.get("co", 1.0) * factor
        sim_p["pm25"] = sim_p.get("pm25", 60.0) * (1.0 - (traffic_reduction_pct / 100.0 * 0.25))

    # 2. Industry Shutdown Impact (primarily reduces SO2, NO2, PM10)
    if industry_shutdown_pct > 0:
        factor = 1.0 - (min(100.0, industry_shutdown_pct) / 100.0 * 0.60)
        sim_p["so2"] = sim_p.get("so2", 15.0) * factor
        sim_p["pm10"] = sim_p.get("pm10", 100.0) * (1.0 - (industry_shutdown_pct / 100.0 * 0.20))
        sim_p["no2"] = sim_p.get("no2", 40.0) * (1.0 - (industry_shutdown_pct / 100.0 * 0.15))

    # 3. Construction Ban Impact (primarily reduces coarse PM10)
    if construction_ban:
        sim_p["pm10"] = sim_p.get("pm10", 100.0) * 0.65
        sim_p["pm25"] = sim_p.get("pm25", 60.0) * 0.88

    # 4. Waste Burning Ban Impact (primarily reduces CO, PM2.5)
    if waste_burn_ban:
        sim_p["co"] = sim_p.get("co", 1.0) * 0.55
        sim_p["pm25"] = sim_p.get("pm25", 60.0) * 0.82

    # Re-evaluate CPCB AQI for simulated atmosphere
    cpcb_res = calculate_cpcb_aqi(sim_p)
    new_aqi = cpcb_res["aqi"]

    aqi_reduction = round(baseline_aqi - new_aqi, 1)
    pct_improvement = round((aqi_reduction / baseline_aqi) * 100.0, 1) if baseline_aqi > 0 else 0.0

    old_cat, old_color, _ = get_cpcb_category(baseline_aqi)
    new_cat, new_color, health_impact = get_cpcb_category(new_aqi)

    return {
        "baseline_aqi": baseline_aqi,
        "simulated_aqi": new_aqi,
        "aqi_reduction_points": aqi_reduction,
        "percentage_improvement": pct_improvement,
        "baseline_category": old_cat,
        "simulated_category": new_cat,
        "category_color": new_color,
        "health_impact_after_policy": health_impact,
        "simulated_pollutant_concentrations": {k: round(v, 2) for k, v in sim_p.items()},
        "active_interventions": {
            "traffic_reduction_pct": traffic_reduction_pct,
            "industry_shutdown_pct": industry_shutdown_pct,
            "construction_ban": construction_ban,
            "waste_burn_ban": waste_burn_ban
        }
    }
