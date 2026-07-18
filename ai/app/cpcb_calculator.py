"""
Official Indian Central Pollution Control Board (CPCB) AQI Engine
Computes pollutant sub-indices, identifies dominant pollutant, and evaluates final AQI.
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
    ]
}


def calculate_sub_index(pollutant: str, val: float) -> Optional[float]:
    """Calculate sub-index for a single pollutant using linear interpolation."""
    if val is None or math.isnan(val) or val < 0:
        return None
        
    if pollutant not in BREAKPOINTS:
        return None
        
    ranges = BREAKPOINTS[pollutant]
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
    Calculate the final CPCB AQI.
    Requires at least 3 pollutants to be monitored, with at least one of them
    being PM2.5 or PM10. If this is not met, returns the PM2.5-based AQI as fallback.
    """
    sub_indices: Dict[str, float] = {}
    steps: Dict[str, str] = {}
    
    # PM2.5 and PM10 are in ug/m³
    # NO2, SO2, O3 are in ug/m³
    # CO is in mg/m³
    for poll, val in metrics.items():
        if val is None or math.isnan(val):
            continue
        sub = calculate_sub_index(poll, val)
        if sub is not None:
            sub_indices[poll] = sub
            # Generate mathematical steps text
            ranges = BREAKPOINTS[poll]
            for c_lo, c_hi, i_lo, i_hi in ranges:
                if c_lo <= val <= c_hi:
                    steps[poll] = f"[{i_hi} - {i_lo}] / [{c_hi} - {c_lo}] * ({val} - {c_lo}) + {i_lo} = {sub}"
                    break
                    
    # Verification criteria check
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
        
    return {
        "aqi": final_aqi,
        "dominant_pollutant": dominant_poll,
        "sub_indices": valid_sub_indices,
        "calculation_steps": steps,
        "is_official_cpcb": is_official_cpcb,
    }
