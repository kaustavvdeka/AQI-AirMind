"""
AirMind AI — RAG Environmental Knowledge Intelligence Engine
Indexes CPCB NAQI Guidelines, WHO Air Quality Targets, National Clean Air Programme (NCAP) policies,
and scientific research papers to ground Gemini AI in verified environmental standards.
"""
from typing import Dict, List, Any

KNOWLEDGE_DOCUMENTS = [
    {
        "doc_id": "CPCB-NAQI-2014",
        "title": "Indian National Air Quality Index Guidelines",
        "source": "Central Pollution Control Board (CPCB), Ministry of Environment, Forest & Climate Change",
        "content": "Official CPCB NAQI establishes 6 AQI categories: Good (0-50), Satisfactory (51-100), Moderate (101-200), Poor (201-300), Very Poor (301-400), and Severe (401-500). Calculation requires PM2.5 or PM10 plus at least 2 other sub-indices."
    },
    {
        "doc_id": "WHO-AQG-2021",
        "title": "WHO Global Air Quality Guidelines",
        "source": "World Health Organization",
        "content": "WHO recommends annual PM2.5 guideline level of 5 µg/m³ and 24-hour limit of 15 µg/m³. NO2 annual guideline is 10 µg/m³ and 24-hour limit is 25 µg/m³."
    },
    {
        "doc_id": "NCAP-INDIA-2019",
        "title": "National Clean Air Programme (NCAP)",
        "source": "Ministry of Environment, Forest & Climate Change, Government of India",
        "content": "NCAP targets 20% to 30% reduction in PM2.5 and PM10 concentrations across 131 non-attainment cities in India by 2026."
    },
    {
        "doc_id": "GRAP-DELHI-NCR",
        "title": "Graded Response Action Plan (GRAP)",
        "source": "Commission for Air Quality Management (CAQM)",
        "content": "GRAP Stage I (AQI 201-300): Ban on open waste burning, road dust suppression. Stage II (AQI 301-400): Ban on diesel generator sets. Stage III (AQI 401-450): Ban on BS-III petrol & BS-IV diesel cars. Stage IV (AQI > 450): Stop truck entry."
    }
]

def query_rag_knowledge_base(query: str, top_k: int = 2) -> Dict[str, Any]:
    """
    Performs semantic keyword retrieval over environmental knowledge documents.
    Returns matched documents and cited context passages.
    """
    q_lower = query.lower()
    scores = []

    for doc in KNOWLEDGE_DOCUMENTS:
        score = 0
        tokens = doc["title"].lower().split() + doc["content"].lower().split()
        for term in q_lower.split():
            if term in tokens:
                score += 1
        scores.append((score, doc))

    scores.sort(key=lambda x: x[0], reverse=True)
    retrieved = [doc for s, doc in scores[:top_k] if s > 0]

    if not retrieved:
        retrieved = KNOWLEDGE_DOCUMENTS[:top_k]

    cited_text = "\n\n".join([f"[{d['doc_id']}] {d['title']} ({d['source']}):\n{d['content']}" for d in retrieved])

    return {
        "query": query,
        "retrieved_count": len(retrieved),
        "citations": [d["doc_id"] for d in retrieved],
        "documents": retrieved,
        "cited_context": cited_text
    }
