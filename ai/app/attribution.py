"""
AirMind AI — Pollution Source Apportionment Model
Uses pollutant ratios (PM2.5/PM10, NO2/SO2/CO) and weather interaction profiles
to estimate source percentage contributions.
"""
from typing import Dict, Tuple

def attribute_pollution_sources(pollutants: Dict[str, float], weather: Dict[str, float]) -> Tuple[Dict[str, float], str]:
    """
    Estimates likely pollution sources: Traffic, Industry, Construction, Biomass, Waste Burning, Dust, Natural.
    Returns: (percentages, explanation_text)
    """
    # Fallback default weights if metrics are missing
    pm25 = pollutants.get("pm25", 35.0)
    pm10 = pollutants.get("pm10", 65.0)
    no2 = pollutants.get("no2", 30.0)
    so2 = pollutants.get("so2", 10.0)
    co = pollutants.get("co", 0.8)
    o3 = pollutants.get("o3", 45.0)
    
    wind_speed = weather.get("wind_speed", 3.0)
    humidity = weather.get("humidity", 60.0)
    
    # 1. PM2.5 / PM10 Ratio Heuristic
    # Ratio > 0.65 suggests dominance of combustion / secondary aerosols.
    # Ratio < 0.40 suggests dominance of mechanical dust / construction.
    pm_ratio = pm25 / pm10 if pm10 > 0 else 0.5
    
    # Compute initial raw scoring weights
    w_traffic = 15.0
    w_industry = 15.0
    w_construction = 10.0
    w_biomass = 10.0
    w_waste = 10.0
    w_dust = 5.0
    w_natural = 5.0
    
    # Heuristics adjustment
    if pm_ratio > 0.65:
        # Secondary fine aerosol / combustion dominance
        w_traffic += 25.0
        w_biomass += 15.0
        w_waste += 10.0
        w_industry += 10.0
    elif pm_ratio < 0.40:
        # Coarse particulate dominance
        w_construction += 30.0
        w_dust += 20.0
        w_natural += 10.0
        
    # Industrial indicators (SO2 is primarily produced by coal and industrial fuel combustion)
    if so2 > 25.0:
        w_industry += (so2 - 25.0) * 1.2
        
    # Traffic indicators (NO2 is a primary indicator of road transport emissions)
    if no2 > 40.0:
        w_traffic += (no2 - 40.0) * 1.0
        
    # Incomplete combustion (CO is released from biomass and open waste burning)
    if co > 1.5:
        w_biomass += (co - 1.5) * 15.0
        w_waste += (co - 1.5) * 10.0
        
    # Dust storm / Natural indicators (dry, high wind conditions kick up crustal dust)
    if wind_speed > 8.0 and humidity < 35.0:
        w_dust += (wind_speed - 8.0) * 12.0
        w_natural += 5.0
        w_traffic -= 10.0  # wind disperses localized vehicle exhaust
        w_industry -= 5.0
        
    # Ensure all scores are non-negative
    w_traffic = max(5.0, w_traffic)
    w_industry = max(5.0, w_industry)
    w_construction = max(5.0, w_construction)
    w_biomass = max(5.0, w_biomass)
    w_waste = max(5.0, w_waste)
    w_dust = max(5.0, w_dust)
    w_natural = max(5.0, w_natural)
    
    total = w_traffic + w_industry + w_construction + w_biomass + w_waste + w_dust + w_natural
    
    # Calculate percentage contributions
    contributions = {
        "Traffic": round((w_traffic / total) * 100, 1),
        "Industry": round((w_industry / total) * 100, 1),
        "Construction": round((w_construction / total) * 100, 1),
        "Biomass Burning": round((w_biomass / total) * 100, 1),
        "Waste Burning": round((w_waste / total) * 100, 1),
        "Dust Storm": round((w_dust / total) * 100, 1),
        "Natural Sources": round((w_natural / total) * 100, 1),
    }
    
    # Ensure exactly 100% sum after rounding adjustments
    diff = 100.0 - sum(contributions.values())
    if diff != 0:
        max_key = max(contributions, key=contributions.get)
        contributions[max_key] = round(contributions[max_key] + diff, 1)
        
    # Generate explainable reasons text
    reasons = []
    if pm_ratio > 0.65:
        reasons.append(f"High PM2.5/PM10 ratio ({pm_ratio:.2f}) indicates fine secondary aerosols from vehicle tailpipes and combustion.")
    elif pm_ratio < 0.40:
        reasons.append(f"Low PM2.5/PM10 ratio ({pm_ratio:.2f}) indicates coarse mechanical dust typical of construction sites and dry soil erosion.")
        
    if no2 > 40.0:
        reasons.append(f"Elevated NO2 concentration ({no2:.1f} µg/m³) points directly to road traffic combustion emissions.")
    if so2 > 25.0:
        reasons.append(f"Elevated SO2 concentration ({so2:.1f} µg/m³) strongly indicates coal-fired stacks or industrial boiler emissions.")
    if co > 1.5:
        reasons.append(f"Elevated CO concentration ({co:.2f} mg/m³) indicates incomplete combustion from open biomass or municipal waste burning.")
    if wind_speed > 8.0:
        reasons.append(f"High wind speeds ({wind_speed:.1f} m/s) and dry atmosphere are conducive to lifting crustal dust particles.")
        
    if not reasons:
        reasons.append("Pollutants are within moderate baseline ranges. Standard urban mix contribution patterns apply.")
        
    explanation = " ".join(reasons)
    
    return contributions, explanation
