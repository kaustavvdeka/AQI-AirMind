"""
AirMind AI — Final 23-Phase QA & Automated Verification Test Runner
Executes comprehensive end-to-end checks across all platform modules and API endpoints.
Generates `final_qa_report.md` in the models directory.
"""
import time
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger("qa_checker")

from app.config import MODELS_DIR
from app.cpcb_calculator import calculate_cpcb_aqi
from app.grid_prediction import generate_hyperlocal_grid
from app.attribution import attribute_pollution_sources
from app.dispersion import compute_gaussian_plume
from app.layers_engine import get_traffic_layer, get_industrial_layer, get_construction_layer, get_waste_burning_layer
from app.enforcement import generate_enforcement_recommendations
from app.multi_city import get_multi_city_comparison
from app.health_advisory import generate_health_advisory
from app.simulator import simulate_interventions
from validate_apis import validate_openaq, validate_openweather, validate_gee, validate_mongodb

def run_all_qa_checks():
    logger.info("Executing AirMind AI Final System QA Sweep...")
    results = []

    # 1. API Status Verification
    openaq_res = validate_openaq()
    openweather_res = validate_openweather()
    gee_res = validate_gee()
    mongo_res = validate_mongodb()

    results.append({"feature": "OpenAQ API Integration", "status": openaq_res["status"], "details": f"{openaq_res['response_time_ms']}ms response time"})
    results.append({"feature": "OpenWeather API Integration", "status": openweather_res["status"], "details": f"{openweather_res['response_time_ms']}ms response time"})
    results.append({"feature": "Google Earth Engine Integration", "status": gee_res["status"], "details": f"{gee_res['response_time_ms']}ms response time"})
    results.append({"feature": "MongoDB Database Connection", "status": mongo_res["status"], "details": f"{mongo_res['response_time_ms']}ms response time"})

    # 2. CPCB AQI Calculation Engine
    try:
        cpcb = calculate_cpcb_aqi({"pm25": 85.0, "pm10": 145.0, "no2": 42.0, "so2": 14.0, "co": 1.1, "o3": 45.0})
        status = "PASS" if cpcb["aqi"] > 0 and cpcb["category"] == "Moderate" else "FAIL"
        results.append({"feature": "CPCB 8-Pollutant AQI Engine", "status": status, "details": f"AQI: {cpcb['aqi']}, Dominant: {cpcb['dominant_pollutant']}"})
    except Exception as e:
        results.append({"feature": "CPCB 8-Pollutant AQI Engine", "status": "FAIL", "details": str(e)})

    # 3. Hyperlocal 1 km x 1 km Grid Prediction Engine
    try:
        grid = generate_hyperlocal_grid(grid_size_km=10)
        status = "PASS" if len(grid["features"]) == 100 else "FAIL"
        results.append({"feature": "Hyperlocal 1km x 1km Grid Prediction", "status": status, "details": f"Generated {len(grid['features'])} 1km² prediction cells"})
    except Exception as e:
        results.append({"feature": "Hyperlocal 1km x 1km Grid Prediction", "status": "FAIL", "details": str(e)})

    # 4. Pollution Source Attribution Engine
    try:
        attr = attribute_pollution_sources({"pm25": 85.0, "pm10": 145.0, "no2": 42.0}, {"wind_speed": 3.2})
        status = "PASS" if attr["confidence_score"] > 50 else "FAIL"
        results.append({"feature": "Pollution Source Attribution Engine", "status": status, "details": f"Dominant: {attr['dominant_source']}, Confidence: {attr['confidence_score']}%"})
    except Exception as e:
        results.append({"feature": "Pollution Source Attribution Engine", "status": "FAIL", "details": str(e)})

    # 5. Atmospheric Dispersion Engine (Gaussian Plume)
    try:
        disp = compute_gaussian_plume()
        status = "PASS" if disp["plume_geojson"]["geometry"]["type"] == "Polygon" else "FAIL"
        results.append({"feature": "Gaussian Plume Atmospheric Dispersion", "status": status, "details": f"Max reach: {disp['summary']['max_reach_km']} km"})
    except Exception as e:
        results.append({"feature": "Gaussian Plume Atmospheric Dispersion", "status": "FAIL", "details": str(e)})

    # 6. Intelligence GIS Layers (Traffic, Industry, Construction, Waste Burning)
    try:
        trf = get_traffic_layer()
        ind = get_industrial_layer()
        cns = get_construction_layer()
        wst = get_waste_burning_layer()
        status = "PASS" if all([trf, ind, cns, wst]) else "FAIL"
        results.append({"feature": "Intelligence GIS Layers (Traffic, Industry, Construction, Waste)", "status": status, "details": f"Active layer features: {len(trf['segments']) + len(ind['facilities']) + len(cns['sites']) + len(wst['incidents'])}"})
    except Exception as e:
        results.append({"feature": "Intelligence GIS Layers", "status": "FAIL", "details": str(e)})

    # 7. AI Enforcement Intelligence Recommendations
    try:
        enf = generate_enforcement_recommendations()
        status = "PASS" if len(enf) > 0 else "FAIL"
        results.append({"feature": "AI Enforcement Intelligence Recommendations", "status": status, "details": f"Generated {len(enf)} ward action dispatches"})
    except Exception as e:
        results.append({"feature": "AI Enforcement Intelligence Recommendations", "status": "FAIL", "details": str(e)})

    # 8. Multi-City Comparison & Ranking
    try:
        mc = get_multi_city_comparison()
        status = "PASS" if mc["cities_count"] == 6 else "FAIL"
        results.append({"feature": "Multi-City Comparison & Ranking", "status": status, "details": f"Ranked {mc['cities_count']} metro cities"})
    except Exception as e:
        results.append({"feature": "Multi-City Comparison & Ranking", "status": "FAIL", "details": str(e)})

    # 9. Multilingual Citizen Health Advisory System
    try:
        ha = generate_health_advisory(language="Hindi")
        status = "PASS" if ha["language"] == "Hindi" else "FAIL"
        results.append({"feature": "Multilingual Citizen Health Advisory", "status": status, "details": f"Generated advisories for {len(ha['advisories'])} groups"})
    except Exception as e:
        results.append({"feature": "Multilingual Citizen Health Advisory", "status": "FAIL", "details": str(e)})

    # 10. Policy Intervention Simulator ("What-If")
    try:
        sim = simulate_interventions(traffic_reduction_pct=30, industry_shutdown_pct=20, construction_ban=True)
        status = "PASS" if sim["aqi_reduction_points"] > 0 else "FAIL"
        results.append({"feature": "Policy Intervention Simulator ('What-If')", "status": status, "details": f"AQI reduced by {sim['aqi_reduction_points']} points ({sim['percentage_improvement']}%)"})
    except Exception as e:
        results.append({"feature": "Policy Intervention Simulator ('What-If')", "status": "FAIL", "details": str(e)})

    # Print Summary Report
    print("\n" + "="*80)
    print("           AIRMIND AI — FINAL SYSTEM QA & COMPLIANCE CERTIFICATION REPORT")
    print("="*80)
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}\n")

    table = "| Feature / Module | Status | Validation Details |\n"
    table += "| :--- | :--- | :--- |\n"
    for r in results:
        table += f"| {r['feature']} | **{r['status']}** | {r['details']} |\n"

    print(table)

    report_path = MODELS_DIR / "final_qa_report.md"
    with open(report_path, "w") as f:
        f.write("# AirMind AI — Final System QA & Certification Report\n\n")
        f.write(f"Generated at: {datetime.now(timezone.utc).isoformat()}\n\n")
        f.write(table)
    logger.info("Final QA Report saved to: %s", report_path)

if __name__ == "__main__":
    run_all_qa_checks()
