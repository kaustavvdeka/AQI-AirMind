"""
AirMind AI — Final System QA & Compliance Verification Runner
Executes end-to-end checks across all core platform modules, ML pipelines,
AirMind Intelligence Agent, Gemini AI Analyst, PDF generator, and Community Leaderboards.
"""
import logging
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger("qa_checker")

from app.config import MODELS_DIR
from app.cpcb_calculator import calculate_cpcb_aqi
from app.spatial_fusion import generate_virtual_observation_points
from app.data_quality import check_data_quality
from app.predict import predict_horizon
from app.agent.airmind_agent import AirMindAgent
from app.agent.community_ranking import CommunityRankingEngine
from app.gemini_analyst import GeminiAnalyst
from app.pdf_generator import generate_pdf_report

def run_all_qa_checks():
    logger.info("Executing AirMind AI System QA & Agent Intelligence Suite Sweep...")
    results = []

    # 1. Master AirMind Intelligence Agent Synthesis Check
    try:
        cpcb_res = calculate_cpcb_aqi({"pm25": 85.0, "pm10": 145.0, "no2": 42.0})
        fc_res = {"24h": {"predicted_aqi": 150.0}, "48h": {"predicted_aqi": 160.0}, "72h": {"predicted_aqi": 140.0}}
        intel_json = AirMindAgent.synthesize_intelligence(
            cpcb_res, fc_res,
            {"temperature": 28.5, "wind_speed": 3.2},
            {"congestion_pct": 75.0},
            {"satellite_no2_mol_m2": 0.00018},
            [],
            {"contributions": {"Traffic": 45.0}, "dominant_source": "Traffic", "confidence_score": 92.0},
            []
        )
        status = "PASS" if intel_json.get("aqi") > 0 and "government_actions" in intel_json else "FAIL"
        results.append({"feature": "Master AirMind Intelligence Agent Synthesis Engine", "status": status, "details": f"AQI: {intel_json['aqi']}, Actions: {len(intel_json['government_actions'])}"})
    except Exception as e:
        results.append({"feature": "Master AirMind Intelligence Agent Synthesis Engine", "status": "FAIL", "details": str(e)})

    # 2. Grounded Gemini AI Analyst Integration Check
    try:
        report = GeminiAnalyst.generate_government_executive_report(intel_json)
        answer = GeminiAnalyst.answer_chat_question("Why is AQI high?", intel_json)
        status = "PASS" if len(report) > 100 and len(answer) > 20 else "FAIL"
        results.append({"feature": "Grounded Gemini AI Analyst Layer (Anti-Hallucination)", "status": status, "details": f"Generated {len(report)} char executive report"})
    except Exception as e:
        results.append({"feature": "Grounded Gemini AI Analyst Layer", "status": "FAIL", "details": str(e)})

    # 3. Community Green Ranking Engine Check
    try:
        ranks = CommunityRankingEngine.get_community_rankings()
        status = "PASS" if len(ranks.get("ward_rankings", [])) >= 4 else "FAIL"
        results.append({"feature": "Community Green Ranking Leaderboard (Weighted Score Formula)", "status": status, "details": f"Ranked {len(ranks.get('ward_rankings', []))} Wards, Top: {ranks['top_performing_community']['name']}"})
    except Exception as e:
        results.append({"feature": "Community Green Ranking Leaderboard", "status": "FAIL", "details": str(e)})

    # 4. Executive PDF Generator Check
    try:
        pdf_bytes = generate_pdf_report(intel_json)
        status = "PASS" if len(pdf_bytes) > 1000 else "FAIL"
        results.append({"feature": "Publication-Quality PDF Executive Report Generator", "status": status, "details": f"Generated {len(pdf_bytes)} bytes PDF buffer"})
    except Exception as e:
        results.append({"feature": "Publication-Quality PDF Report Generator", "status": "FAIL", "details": str(e)})

    # 5. Hybrid Spatial Data Fusion Check
    try:
        vops = generate_virtual_observation_points(grid_size_km=10)
        status = "PASS" if len(vops["features"]) == 100 else "FAIL"
        results.append({"feature": "Hybrid Spatial Data Fusion (Virtual Observation Points)", "status": status, "details": f"Generated {len(vops['features'])} 1km² VOP cells"})
    except Exception as e:
        results.append({"feature": "Hybrid Spatial Data Fusion", "status": "FAIL", "details": str(e)})

    # 6. Data Quality & API Freshness Check
    try:
        dq = check_data_quality()
        status = "PASS" if dq["health_score_pct"] >= 70.0 else "FAIL"
        results.append({"feature": "Data Quality & API Freshness Monitor", "status": status, "details": f"Health Score: {dq['health_score_pct']}%, Status: {dq['overall_status']}"})
    except Exception as e:
        results.append({"feature": "Data Quality & API Freshness Monitor", "status": "FAIL", "details": str(e)})

    # Print Summary Report
    print("\n" + "="*80)
    print("           AIRMIND AI — SYSTEM CERTIFICATION REPORT")
    print("="*80)
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}\n")

    table = "| Feature / Module | Status | Validation Details |\n"
    table += "| :--- | :--- | :--- |\n"
    for r in results:
        table += f"| {r['feature']} | **{r['status']}** | {r['details']} |\n"

    print(table)

    report_path = MODELS_DIR / "final_qa_report.md"
    with open(report_path, "w") as f:
        f.write("# AirMind AI — System Certification Report\n\n")
        f.write(f"Generated at: {datetime.now(timezone.utc).isoformat()}\n\n")
        f.write(table)
    logger.info("QA Report saved to: %s", report_path)

if __name__ == "__main__":
    run_all_qa_checks()
