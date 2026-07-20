"""
AirMind Intelligence Agent — Government Recommendation & Enforcement Engine
Generates priority ward inspection targets, enforcement action items, policy advice,
and expected AQI reduction metrics for municipal administrators.
"""
from typing import Dict, List, Any

class GovernmentEngine:
    @staticmethod
    def generate_recommendations(
        aqi: float,
        dominant_source: str,
        hotspots: List[Dict[str, Any]],
        wind_speed: float
    ) -> Dict[str, Any]:
        """
        Generates actionable government dispatches and policy interventions.
        """
        actions = []
        priority_wards = []

        # 1. Enforcement Actions based on dominant source & AQI
        if dominant_source == "Traffic" or aqi > 200:
            actions.append({
                "action_id": "ENF-TR-01",
                "title": "Heavy Truck Rerouting & Traffic Signal Optimization",
                "priority": "HIGH",
                "target_department": "Traffic Police & Smart City Transport",
                "description": "Restrict heavy diesel trucks (>12 tonnes) from entering inner city arterials between 06:00 and 22:00. Divert via Peripheral Bypass.",
                "expected_aqi_reduction": "-18 to -25 AQI points",
                "compliance_deadline": "Immediate (Within 4 Hours)"
            })
            actions.append({
                "action_id": "ENF-TR-02",
                "title": "High-Frequency Mechanical Road Water Sprinkling",
                "priority": "MEDIUM",
                "target_department": "Municipal Public Works Department",
                "description": "Deploy anti-smog guns and mechanical water sprinklers on major high-density traffic corridors.",
                "expected_aqi_reduction": "-12 to -18 AQI points",
                "compliance_deadline": "24 Hours"
            })

        if dominant_source == "Industry" or aqi > 250:
            actions.append({
                "action_id": "ENF-IND-01",
                "title": "Industrial Stack Emission Audit & Fuel Verification",
                "priority": "HIGH",
                "target_department": "State Pollution Control Board (SPCB)",
                "description": "Conduct surprise inspections on uncertified brick kilns and factory boilers. Mandate 30% capacity reduction during low-dispersion window.",
                "expected_aqi_reduction": "-22 to -30 AQI points",
                "compliance_deadline": "12 Hours"
            })

        if dominant_source == "Construction" or aqi > 180:
            actions.append({
                "action_id": "ENF-CON-01",
                "title": "Uncovered Construction Site Cease-Work Notice",
                "priority": "HIGH",
                "target_department": "Urban Development & Building Inspection",
                "description": "Enforce mandatory dust screens, water misting, and covered transit of loose building materials at all active sites >500 sqm.",
                "expected_aqi_reduction": "-15 to -20 AQI points",
                "compliance_deadline": "Immediate"
            })

        if dominant_source == "Waste Burning" or aqi > 200:
            actions.append({
                "action_id": "ENF-WB-01",
                "title": "Zero-Tolerance Patrols for Open Municipal Waste Burning",
                "priority": "HIGH",
                "target_department": "Sanitation & Solid Waste Management",
                "description": "Deploy mobile night-patrol enforcement squads equipped with thermal cameras in open dumping grounds.",
                "expected_aqi_reduction": "-10 to -16 AQI points",
                "compliance_deadline": "Immediate"
            })

        # 2. Priority Wards Identification
        if hotspots:
            for idx, hs in enumerate(hotspots[:3]):
                center = hs.get("center", [28.6139, 77.2090])
                priority_wards.append({
                    "ward_id": f"Ward-{idx+4:02d}",
                    "cluster_id": hs.get("cluster_id", idx+1),
                    "center_coordinates": center,
                    "cluster_mean_aqi": hs.get("mean_aqi", 220.0),
                    "primary_reason": f"Active DBSCAN Hotspot (AQI {hs.get('mean_aqi', 220.0)}) with {hs.get('contributing_vops', 8)} VOP nodes",
                    "urgent_action": "Deploy mobile anti-smog unit & inspect commercial stack emissions"
                })
        else:
            priority_wards.append({
                "ward_id": "Ward-04 (Central Business District)",
                "center_coordinates": [28.6139, 77.2090],
                "cluster_mean_aqi": round(aqi * 1.1, 1),
                "primary_reason": "High traffic density & building canopy obstruction",
                "urgent_action": "Deploy road water sweepers"
            })

        # 3. Policy & Budget Allocations
        policy_recommendations = [
            "Mandate CEMS telemetry integration for all Category-A industrial stacks.",
            "Expand municipal subsidy for zero-emission electric garbage haulers.",
            "Establish GRAP (Graded Response Action Plan) Emergency Task Force."
        ]

        budget_recommendation = {
            "recommended_allocation_inr_lakhs": 65.0,
            "breakdown": {
                "Anti-Smog Water Guns & Sweepers": 35.0,
                "IoT Sensor Density Expansion": 18.0,
                "Public Awareness & Enforcement Squads": 12.0
            }
        }

        return {
            "priority_wards": priority_wards,
            "enforcement_actions": actions,
            "policy_recommendations": policy_recommendations,
            "budget_recommendation": budget_recommendation,
            "total_actions_count": len(actions)
        }
