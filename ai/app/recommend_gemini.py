"""
Generate action recommendations using Gemini. Falls back to deterministic
rule-based logic if GEMINI_API_KEY isn't configured or the call fails.
"""
import json
import logging

from app.config import GEMINI_API_KEY

logger = logging.getLogger(__name__)

FALLBACK_RULES = [
    (400, [
        "Issue emergency health alert — advise all residents to stay indoors",
        "Halt all construction and industrial activity immediately",
        "Deploy emergency water sprinkling on major roads",
        "Activate air purifiers in schools and hospitals",
        "Restrict heavy vehicles and diesel trucks from entering city limits",
        "Open emergency health monitoring camps in affected zones",
    ]),
    (300, [
        "Issue health advisory for sensitive groups (elderly, children, respiratory patients)",
        "Pause non-essential construction and burning activities",
        "Increase frequency of public transport to reduce private vehicle trips",
        "Deploy mobile air-quality monitoring units to hotspot areas",
        "Coordinate with industries to reduce emissions voluntarily",
    ]),
    (200, [
        "Restrict heavy/diesel vehicles in the most polluted zones",
        "Increase road water sprinkling near industrial areas",
        "Issue public advisory recommending masks for outdoor activities",
        "Alert hospitals to prepare for possible increase in respiratory cases",
    ]),
    (100, [
        "Continue routine monitoring and data collection",
        "Encourage use of electric vehicles and public transport",
        "Remind industries to comply with emission standards",
        "Promote green belt planting in industrial corridors",
    ]),
    (0, [
        "Air quality is good — maintain routine monitoring",
        "Document conditions as baseline for future reference",
        "Continue promoting sustainable transport and green spaces",
    ]),
]


def _fallback(aqi: float) -> list:
    for threshold, actions in FALLBACK_RULES:
        if aqi >= threshold:
            return actions
    return FALLBACK_RULES[-1][1]


def generate_recommendations(aqi: float, drivers: list) -> dict:
    driver_text = ", ".join(d.get("factor", "") for d in drivers[:5]) or "no specific driver data"

    if not GEMINI_API_KEY:
        return {"source": "fallback_rules", "recommendations": _fallback(aqi)}

    try:
        import google.generativeai as genai

        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        prompt = (
            "You are an expert air-quality policy advisor for a city government in India. "
            f"Current AQI is {aqi:.0f} (India CPCB scale, 0-500). "
            f"The main contributing factors are: {driver_text}. "
            "Provide 4-6 short, specific, actionable recommendations for city authorities. "
            "Focus on immediate interventions (traffic, industry, construction, public health). "
            "Return ONLY a valid JSON array of strings with the recommendations, no other text."
        )
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        text = text.strip()
        recommendations = json.loads(text)
        if not isinstance(recommendations, list):
            raise ValueError("Gemini response was not a JSON array")
        return {"source": "gemini-2.0-flash", "recommendations": recommendations}

    except Exception as exc:
        logger.warning("Gemini recommendation failed (%s) — using fallback rules.", exc)
        return {
            "source": "fallback_rules",
            "recommendations": _fallback(aqi),
            "note": f"Gemini unavailable: {exc}",
        }
