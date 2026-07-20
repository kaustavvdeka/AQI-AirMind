"""
AirMind Intelligence Agent — Community Green Ranking Engine
Evaluates the official weighted Green Community Score formula:
- 40% AQI Improvement
- 20% Pollution Reduction
- 15% Citizen Reports Resolution
- 10% Tree Plantation Drive
- 10% Open Waste Burning Reduction
- 5% Public Awareness & Campaigns

Ranks Wards, Eco-Schools, Housing Societies (RWAs), and Municipalities for recognition & grants.
"""
from typing import Dict, List, Any

def calculate_green_community_score(
    aqi_improvement_pct: float = 18.5,
    pollution_reduction_pct: float = 15.0,
    citizen_report_resolution_pct: float = 92.0,
    tree_plantation_score: float = 85.0,
    waste_burn_reduction_pct: float = 88.0,
    public_awareness_score: float = 90.0
) -> float:
    """
    Calculates weighted Green Community Score on a 0-100 scale.
    """
    # Normalize inputs to 0-100 sub-scores
    s_aqi = min(100.0, max(0.0, aqi_improvement_pct * 3.5))
    s_poll = min(100.0, max(0.0, pollution_reduction_pct * 4.0))
    s_rep = min(100.0, max(0.0, citizen_report_resolution_pct))
    s_trees = min(100.0, max(0.0, tree_plantation_score))
    s_waste = min(100.0, max(0.0, waste_burn_reduction_pct))
    s_aware = min(100.0, max(0.0, public_awareness_score))

    score = (0.40 * s_aqi) + (0.20 * s_poll) + (0.15 * s_rep) + (0.10 * s_trees) + (0.10 * s_waste) + (0.05 * s_aware)
    return round(score, 1)

class CommunityRankingEngine:
    @staticmethod
    def get_community_rankings() -> Dict[str, Any]:
        """
        Generates leaderboard rankings across Wards, Eco-Schools, RWAs, and Municipalities.
        """
        # 1. Municipal Ward Leaderboard
        wards = [
            {
                "rank": 1,
                "name": "Ward 07 — Green Belt Sector",
                "green_score": 92.4,
                "aqi_improvement": "-24.2%",
                "trees_planted": 1450,
                "reports_resolved_pct": 98.0,
                "recognition_tier": "GOLD_EMERALD",
                "award": "Eligible for ₹15 Lakhs Smart City Green Grant"
            },
            {
                "rank": 2,
                "name": "Ward 03 — Eco Valley",
                "green_score": 86.1,
                "aqi_improvement": "-18.5%",
                "trees_planted": 920,
                "reports_resolved_pct": 92.0,
                "recognition_tier": "SILVER_STAR",
                "award": "Certificate of Environmental Excellence"
            },
            {
                "rank": 3,
                "name": "Ward 12 — Industrial Buffer Zone",
                "green_score": 74.8,
                "aqi_improvement": "-11.0%",
                "trees_planted": 640,
                "reports_resolved_pct": 84.0,
                "recognition_tier": "BRONZE",
                "award": "Priority Sprinkler Support"
            },
            {
                "rank": 4,
                "name": "Ward 01 — Commercial Core",
                "green_score": 62.3,
                "aqi_improvement": "-4.2%",
                "trees_planted": 310,
                "reports_resolved_pct": 71.0,
                "recognition_tier": "NEEDS_IMPROVEMENT",
                "award": "Enforcement Taskforce Assigned"
            }
        ]

        # 2. Eco-Schools & University Leaderboard
        schools = [
            {
                "rank": 1,
                "name": "Delhi Public School (Eco Club)",
                "green_score": 95.0,
                "initiatives": "Solar Campus & PM2.5 Anemometer Station",
                "trees_planted": 500
            },
            {
                "rank": 2,
                "name": "Cotton University Green Wing",
                "green_score": 89.2,
                "initiatives": "Student Air Quality Watch Team",
                "trees_planted": 780
            },
            {
                "rank": 3,
                "name": "St. Mary's Higher Secondary",
                "green_score": 83.5,
                "initiatives": "Zero Waste Burning Pledge Drive",
                "trees_planted": 350
            }
        ]

        # 3. Residential Societies (RWA) Leaderboard
        societies = [
            {
                "rank": 1,
                "name": "Greenwood Enclave RWA",
                "green_score": 93.8,
                "initiatives": "100% On-Site Compost & EV Charging Station",
                "aqi_delta": "-28.0%"
            },
            {
                "rank": 2,
                "name": "Brahmaputra View Apartments",
                "green_score": 88.0,
                "initiatives": "Rooftop Air Scrubbing Canopy",
                "aqi_delta": "-19.5%"
            },
            {
                "rank": 3,
                "name": "Royal Palm Heights",
                "green_score": 81.2,
                "initiatives": "No-Vehicle Sunday Drive",
                "aqi_delta": "-14.0%"
            }
        ]

        # 4. Municipality Comparison
        municipalities = [
            {"rank": 1, "city": "Shillong", "average_aqi": 42.0, "green_score": 94.5},
            {"rank": 2, "city": "Guwahati", "average_aqi": 145.0, "green_score": 82.4},
            {"rank": 3, "city": "Delhi NCR", "average_aqi": 285.0, "green_score": 64.1}
        ]

        return {
            "formula_weight_breakdown": {
                "aqi_improvement": "40%",
                "pollution_reduction": "20%",
                "citizen_reports_resolved": "15%",
                "tree_plantation": "10%",
                "waste_burning_reduction": "10%",
                "public_awareness": "5%"
            },
            "ward_rankings": wards,
            "school_rankings": schools,
            "society_rankings": societies,
            "municipality_rankings": municipalities,
            "top_performing_community": wards[0]
        }
