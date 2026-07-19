"""
AirMind AI — Multilingual Citizen Health Advisory Engine
Generates demographically targeted health guidance for vulnerable populations:
Children, Senior Citizens, Pregnant Women, Outdoor Workers, Schools, and Hospitals.
Supports English, Hindi, Bengali, and Assamese languages.
"""
from typing import Dict, List, Any
from app.cpcb_calculator import get_cpcb_category

ADVISORIES = {
    "English": {
        "Severe": {
            "general": "Emergency air quality condition. Stay indoors and use HEPA air purifiers.",
            "children": "Cancel all outdoor sports and physical activities at schools.",
            "seniors": "Avoid morning/evening walks. Keep emergency respiratory medications accessible.",
            "pregnant_women": "Strictly remain indoors. Use N95 masks if outdoor movement is unavoidable.",
            "outdoor_workers": "Limit continuous shift duration to 2 hours. Employers must provide N95 respirators.",
            "hospitals": "Activate emergency respiratory triage units and Nebulizer stations."
        },
        "Very Poor": {
            "general": "Avoid prolonged outdoor exposure. Wear N95 masks when stepping out.",
            "children": "Limit outdoor playtime. Keep classroom windows closed.",
            "seniors": "Avoid outdoor physical exertion. Monitor blood pressure and pulse ox.",
            "pregnant_women": "Minimize outdoor trips. Maintain indoor air hydration.",
            "outdoor_workers": "Take 15-minute indoor rest breaks every hour. Wear dust/particle masks.",
            "hospitals": "Ensure stock of bronchodilator inhalers and oxygen cylinders."
        },
        "Poor": {
            "general": "Sensitive groups should reduce outdoor activity.",
            "children": "Avoid strenuous outdoor exercise during peak traffic hours.",
            "seniors": "Limit strenuous walks during early morning inversion hours.",
            "pregnant_women": "Wear protective mask in congested traffic zones.",
            "outdoor_workers": "Stay hydrated and wear protective particulate masks.",
            "hospitals": "Monitor pediatric and geriatric outpatient surge."
        },
        "Moderate": {
            "general": "Air quality is acceptable. Sensitive individuals may experience mild discomfort.",
            "children": "Normal school activities permitted with hydration breaks.",
            "seniors": "Light morning walks permitted in open green parks.",
            "pregnant_women": "Normal activities permitted; avoid heavy traffic corridors.",
            "outdoor_workers": "Standard work schedules permitted with adequate water intake.",
            "hospitals": "Routine operations."
        }
    },
    "Hindi": {
        "Severe": {
            "general": "आपातकालीन वायु गुणवत्ता स्थिति। घर के अंदर रहें और वायु शोधक (Air Purifier) का उपयोग करें।",
            "children": "स्कूलों में सभी बाहरी खेल और शारीरिक गतिविधियों को रद्द करें।",
            "seniors": "सुबह/शाम की सैर से बचें। आपातकालीन सांस की दवाएं पास रखें।",
            "pregnant_women": "सख्ती से घर के अंदर रहें। यदि बाहर जाना अनिवार्य हो तो N95 मास्क पहनें।",
            "outdoor_workers": "बाहरी कार्य अवधि 2 घंटे तक सीमित रखें। नियोक्ता N95 मास्क प्रदान करें।",
            "hospitals": "आपातकालीन श्वसन वार्ड और नेब्युलाइज़र स्टेशन सक्रिय करें।"
        },
        "Very Poor": {
            "general": "लंबी बाहरी गतिविधियों से बचें। बाहर निकलते समय N95 मास्क पहनें।",
            "children": "बच्चों के बाहर खेलने का समय सीमित करें। कक्षा की खिड़कियां बंद रखें।",
            "seniors": "बाहरी शारीरिक परिश्रम से बचें। बीपी और ऑक्सीजन की निगरानी करें।",
            "pregnant_women": "बाहरी यात्राएं कम करें।",
            "outdoor_workers": "हर घंटे 15 मिनट का विश्राम लें। मास्क पहनें।",
            "hospitals": "ऑक्सीजन सिलेंडरों और इनहेलर्स का पर्याप्त स्टॉक बनाए रखें।"
        }
    },
    "Bengali": {
        "Severe": {
            "general": "জরুরী বায়ুর গুণমান পরিস্থিতি। ঘরের ভেতরে থাকুন এবং এয়ার পিউরিফায়ার ব্যবহার করুন।",
            "children": "স্কুলে সমস্ত আউটডোর খেলাধুলা বাতিল করুন।",
            "seniors": "সকালের হাঁটাহাঁটি এড়িয়ে চলুন। প্রয়োজনীয় ওষুধ সাথে রাখুন।",
            "pregnant_women": "ঘরের ভেতরে থাকুন। বাইরে বের হলে N95 মাস্ক ব্যবহার করুন।",
            "outdoor_workers": "বাইরে কাজের সময় সীমিত করুন। N95 মাস্ক পরিধান করুন।",
            "hospitals": "জরুরী নেবুলাইজার এবং শ্বাসকষ্ট বিভাগ সক্রিয় করুন।"
        }
    },
    "Assamese": {
        "Severe": {
            "general": "জৰুৰীকালীন বায়ু মান অৱস্থা। ঘৰৰ ভিতৰত থাকক আৰু মাস্ক ব্যৱহাৰ কৰক।",
            "children": "বিদ্যালয়সমূহত সকলো ধৰণৰ বাহিৰৰ খেল-ধেমালি বন্ধ ৰাখক।",
            "seniors": "পুৱা/গধূলি ফুৰা-চকা নকৰিব। প্ৰয়োজনীয় ঔষধ কাষত ৰাখক।",
            "pregnant_women": "ঘৰৰ ভিতৰতে থাকক। জৰুৰী হ'লে N95 মাস্ক পিন্ধক।",
            "outdoor_workers": "বাহিৰত কাম কৰাৰ সময় হ্ৰাস কৰক। মাস্ক ব্যৱহাৰ কৰক।",
            "hospitals": "হাস্পতালত জৰুৰীকালীন শ্বাস-প্ৰশ্বাস সেৱা সক্ৰিয় কৰক।"
        }
    }
}

def generate_health_advisory(
    aqi: float = 245.0,
    language: str = "English",
    ward_name: str = "Ward 12 - Central District"
) -> Dict[str, Any]:
    """Generates localized, demographic-specific advisories."""
    category, color, impact = get_cpcb_category(aqi)

    # Key lookup fallback
    cat_key = category if category in ["Severe", "Very Poor", "Poor"] else "Moderate"
    lang_key = language if language in ADVISORIES else "English"
    
    lang_dict = ADVISORIES.get(lang_key, ADVISORIES["English"])
    advisories_dict = lang_dict.get(cat_key, lang_dict.get("Poor", ADVISORIES["English"]["Poor"]))

    return {
        "ward": ward_name,
        "current_aqi": aqi,
        "cpcb_category": category,
        "color": color,
        "language": lang_key,
        "advisories": advisories_dict,
        "vulnerable_groups_covered": [
            "Children & Schools",
            "Senior Citizens",
            "Pregnant Women",
            "Outdoor Workers & Laborers",
            "Hospitals & Clinics"
        ]
    }
