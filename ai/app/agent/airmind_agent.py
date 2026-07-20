"""
AirMind Intelligence Agent — Master Synthesis Engine
Orchestrates all deterministic sub-analyzers, ML predictions, GIS hotspots, source attributions,
and government dispatches into the canonical `Structured Intelligence JSON`.
"""
from typing import Dict, List, Any
from datetime import datetime, timezone

from app.agent.sub_analyzers import (
    AQIAnalyzer, ForecastAnalyzer, WeatherAnalyzer, TrafficAnalyzer,
    SatelliteAnalyzer, HotspotAnalyzer, PollutionSourceAnalyzer,
    CitizenReportAnalyzer, EnvironmentalRiskAnalyzer
)
from app.agent.government_engine import GovernmentEngine
from app.agent.community_ranking import CommunityRankingEngine, calculate_green_community_score

class AirMindAgent:
    @staticmethod
    def synthesize_intelligence(
        aqi_metrics: Dict[str, Any],
        forecast_data: Dict[str, Any],
        weather_data: Dict[str, Any],
        traffic_data: Dict[str, Any],
        satellite_data: Dict[str, Any],
        hotspots_data: List[Dict[str, Any]],
        source_data: Dict[str, Any],
        reports_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Synthesizes raw environmental metrics into a single unified Structured Intelligence JSON.
        """
        # Execute Sub-Analyzers
        aqi_eval = AQIAnalyzer.analyze(aqi_metrics)
        fc_eval = ForecastAnalyzer.analyze(forecast_data)
        wx_eval = WeatherAnalyzer.analyze(weather_data)
        tf_eval = TrafficAnalyzer.analyze(traffic_data)
        sat_eval = SatelliteAnalyzer.analyze(satellite_data)
        hs_eval = HotspotAnalyzer.analyze(hotspots_data)
        src_eval = PollutionSourceAnalyzer.analyze(source_data)
        rep_eval = CitizenReportAnalyzer.analyze(reports_data)

        # Environmental Risk Evaluator
        risk_eval = EnvironmentalRiskAnalyzer.analyze(
            aqi=aqi_eval["current_aqi"],
            max_hotspot_aqi=hs_eval["max_cluster_aqi"],
            top_source=src_eval["dominant_source"],
            wind_speed=wx_eval["wind_speed_ms"]
        )

        # Government Action Dispatches Engine
        govt_eval = GovernmentEngine.generate_recommendations(
            aqi=aqi_eval["current_aqi"],
            dominant_source=src_eval["dominant_source"],
            hotspots=hotspots_data,
            wind_speed=wx_eval["wind_speed_ms"]
        )

        # Community Rankings Engine
        community_eval = CommunityRankingEngine.get_community_rankings()

        # Calculate Green Community Score
        comm_score = calculate_green_community_score(
            aqi_improvement_pct=18.5,
            pollution_reduction_pct=15.0,
            citizen_report_resolution_pct=88.0,
            tree_plantation_score=85.0,
            waste_burn_reduction_pct=90.0,
            public_awareness_score=92.0
        )

        # Citizen Health Actions
        citizen_actions = [
            "Wear N95/FFP2 masks during morning peak traffic (07:00 - 10:00).",
            "Keep indoor air purifiers active with HEPA filtration.",
            "Avoid intense outdoor physical exercise near major traffic corridors.",
            "Report uncontained construction dust or open waste burning via the AirMind App."
        ]

        # Construct Canonical Structured Intelligence JSON
        return {
            "aqi": aqi_eval["current_aqi"],
            "category": aqi_eval["category"],
            "dominant_pollutant": aqi_eval["dominant_pollutant"],
            "severity_tier": aqi_eval["tier"],
            "forecast": {
                "24h": fc_eval["horizons"]["24h"]["aqi"],
                "48h": fc_eval["horizons"]["48h"]["aqi"],
                "72h": fc_eval["horizons"]["72h"]["aqi"],
                "trajectory": fc_eval["trajectory"],
                "horizons_detail": fc_eval["horizons"]
            },
            "hotspots": hotspots_data,
            "hotspots_summary": hs_eval,
            "sources": src_eval["contributions"],
            "dominant_source": src_eval["dominant_source"],
            "source_explanation": src_eval["explanation"],
            "environmental_risk": risk_eval,
            "weather": wx_eval,
            "traffic": tf_eval,
            "satellite": sat_eval,
            "citizen_reports_summary": rep_eval,
            "government_actions": govt_eval["enforcement_actions"],
            "priority_inspection_wards": govt_eval["priority_wards"],
            "policy_recommendations": govt_eval["policy_recommendations"],
            "budget_recommendation": govt_eval["budget_recommendation"],
            "citizen_actions": citizen_actions,
            "community_score": comm_score,
            "community_rankings": community_eval,
            "confidence": src_eval["confidence_score"],
            "synthesized_at": datetime.now(timezone.utc).isoformat()
        }
