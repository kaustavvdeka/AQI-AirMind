"""
Official Indian Central Pollution Control Board (CPCB) AQI Engine
Computes pollutant sub-indices, identifies dominant pollutant, and evaluates final AQI
according to standard Indian National Air Quality Index (NAQI) guidelines.
"""
import math
from typing import Dict, Tuple, List, Optional

# Standard CPCB Concentration Breakpoints and corresponding AQI Index Ranges
BREAKPOINTS = {
    "pm25": [
        (0.0, 30.0, 0, 50),
        (30.1, 60.0, 51, 100),
        (60.1, 90.0, 101, 200),
        (90.1, 120.0, 201, 300),
        (120.1, 250.0, 301, 400),
        (250.1, 500.0, 401, 500)
    ],
    "pm10": [
        (0.0, 50.0, 0, 50),
        (50.1, 100.0, 51, 100),
        (100.1, 250.0, 101, 200),
        (250.1, 350.0, 201, 300),
        (350.1, 430.0, 301, 400),
        (430.1, 1000.0, 401, 500)
    ],
    "no2": [
        (0.0, 40.0, 0, 50),
        (40.1, 80.0, 51, 100),
        (80.1, 180.0, 101, 200),
        (180.1, 280.0, 201, 300),
        (280.1, 400.0, 301, 400),
        (400.1, 1000.0, 401, 500)
    ],
    "so2": [
        (0.0, 40.0, 0, 50),
        (40.1, 80.0, 51, 100),
        (80.1, 380.0, 101, 200),
        (380.1, 800.0, 201, 300),
        (800.1, 1600.0, 301, 400),
        (1600.1, 2500.0, 401, 500)
    ],
    "co": [
        (0.0, 1.0, 0, 50),
        (1.01, 2.0, 51, 100),
        (2.01, 10.0, 101, 200),
        (10.01, 17.0, 201, 300),
        (17.01, 34.0, 301, 400),
        (34.01, 100.0, 401, 500)
    ],
    "o3": [
        (0.0, 50.0, 0, 50),
        (50.1, 100.0, 51, 100),
        (100.1, 168.0, 101, 200),
        (168.1, 208.0, 201, 300),
        (208.1, 748.0, 301, 400),
        (748.1, 1000.0, 401, 500)
    ],
    "nh3": [
        (0.0, 200.0, 0, 50),
        (200.1, 400.0, 51, 100),
        (401.0, 800.0, 101, 200),
        (801.0, 1200.0, 201, 300),
        (1201.0, 1800.0, 301, 400),
        (1800.1, 3000.0, 401, 500)
    ],
    "pb": [
        (0.0, 0.5, 0, 50),
        (0.51, 1.0, 51, 100),
        (1.01, 2.0, 101, 200),
        (2.01, 3.0, 201, 300),
        (3.01, 3.5, 301, 400),
        (3.51, 10.0, 401, 500)
    ]
}

def get_cpcb_category(aqi: float) -> Tuple[str, str, str]:
    """Returns (category_name, color_hex, health_impact)."""
    if aqi <= 50:
        return "Good", "#00e676", "Minimal Impact"
    elif aqi <= 100:
        return "Satisfactory", "#76ff03", "Minor breathing discomfort to sensitive people"
    elif aqi <= 200:
        return "Moderate", "#ffea00", "Breathing discomfort to people with lungs, asthma and heart diseases"
    elif aqi <= 300:
        return "Poor", "#ff9100", "Breathing discomfort to most people on prolonged exposure"
    elif aqi <= 400:
        return "Very Poor", "#ff3d00", "Respiratory illness on prolonged exposure"
    else:
        return "Severe", "#dd2c00", "Affects healthy people and seriously impacts those with existing diseases"

def calculate_sub_index(pollutant: str, val: float) -> Optional[float]:
    """Calculate sub-index for a single pollutant using linear interpolation."""
    if val is None or math.isnan(val) or val < 0:
        return None
        
    poll_key = pollutant.lower().replace(".", "")
    if poll_key not in BREAKPOINTS:
        return None
        
    ranges = BREAKPOINTS[poll_key]
    for c_lo, c_hi, i_lo, i_hi in ranges:
        if c_lo <= val <= c_hi:
            # Linear interpolation formula:
            # Sub-Index = [ (I_hi - I_lo) / (C_hi - C_lo) ] * (C_val - C_lo) + I_lo
            sub = ((i_hi - i_lo) / (c_hi - c_lo)) * (val - c_lo) + i_lo
            return round(sub, 1)
            
    # If concentration exceeds highest breakpoint, cap at 500.0
    return 500.0

def calculate_cpcb_aqi(metrics: Dict[str, float]) -> Dict[str, any]:
    """
    Calculate the final official Indian CPCB AQI.
    Requires at least 3 pollutants to be monitored, with at least one of them
    being PM2.5 or PM10.
    """
    sub_indices: Dict[str, float] = {}
    steps: Dict[str, str] = {}
    
    for poll, val in metrics.items():
        if val is None or math.isnan(val):
            continue
        poll_clean = poll.lower().replace(".", "")
        sub = calculate_sub_index(poll_clean, val)
        if sub is not None:
            sub_indices[poll_clean] = sub
            ranges = BREAKPOINTS[poll_clean]
            for c_lo, c_hi, i_lo, i_hi in ranges:
                if c_lo <= val <= c_hi:
                    steps[poll_clean] = f"[{i_hi} - {i_lo}] / [{c_hi} - {c_lo}] * ({val} - {c_lo}) + {i_lo} = {sub}"
                    break
                    
    valid_sub_indices = {k: v for k, v in sub_indices.items() if v is not None}
    pm_present = "pm25" in valid_sub_indices or "pm10" in valid_sub_indices
    enough_pollutants = len(valid_sub_indices) >= 3
    
    if valid_sub_indices:
        dominant_poll = max(valid_sub_indices, key=valid_sub_indices.get)
        final_aqi = valid_sub_indices[dominant_poll]
    else:
        dominant_poll = "pm25"
        final_aqi = 0.0
        
    is_official_cpcb = pm_present and enough_pollutants
    
    # Fallback to PM2.5 subindex if CPCB validation criteria aren't met
    if not is_official_cpcb and "pm25" in valid_sub_indices:
        final_aqi = valid_sub_indices["pm25"]
        dominant_poll = "pm25 (fallback)"
        
    category, color, health_impact = get_cpcb_category(final_aqi)
    
    return {
        "aqi": round(final_aqi, 1),
        "dominant_pollutant": dominant_poll,
        "sub_indices": valid_sub_indices,
        "calculation_steps": steps,
        "category": category,
        "color": color,
        "health_impact": health_impact,
        "is_official_cpcb": is_official_cpcb,
    }
