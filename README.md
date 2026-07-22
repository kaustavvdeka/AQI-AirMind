# 🍃 AirMind AI — Urban Environmental Decision Intelligence Platform

> **ET AI Hackathon 2026 — Problem Statement 5: AI-Powered Urban Air Quality Intelligence for Smart City Intervention**
>
> *Predict. Explain. Attribute. Intervene. Empower.*

---

## 📌 Executive Summary

**AirMind AI** transforms traditional urban air quality monitoring from passive observation into a complete, proactive **AI Decision Intelligence System**. Designed specifically for municipal administrators, environmental scientists, and smart city decision-makers in India, AirMind AI combines **Machine Learning (LightGBM/GPR)**, **Spatial GIS Fusion**, **Satellite Remote Sensing (Sentinel-5P / MODIS)**, **Atmospheric Dispersion Physics**, and **Grounded Gemini AI Reasoning** to predict air quality, detect pollution hotspots, attribute pollution sources, enforce target interventions, and reward green community initiatives.

---

## 🏛️ Platform Architecture

AirMind AI is structured as a high-performance, fault-tolerant three-tier monorepo architecture:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Vite / React 18 Frontend                           │
│     (Interactive GIS Map, 4D Digital Twin, Multi-City Command Center,       │
│      Community Leaderboards, Reports Engine, Floating AI Assistant)         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST / JSON (Port 5173 -> 5001)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Express.js / Node.js Backend                       │
│     (JWT Auth, Mongo DB Collections, Incident Queue, API Proxy Router)      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Proxy / Binary Buffer (Port 5001 -> 8000)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FastAPI AI Intelligence Engine                      │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ • LightGBM Predictor (95% CI)    • Virtual Sensor Network (GPR)       │ │
│ │ • Hybrid Spatial Fusion (VOP Grid) • Satellite Gap Filling Engine       │ │
│ │ • Adaptive HDBSCAN Hotspots      • 4D Atmospheric Digital Twin          │ │
│ │ • Multi-Source Attribution       • Computer Vision Incident Analysis    │ │
│ │ • RAG Knowledge Base (CPCB/WHO)  • Continuous Drift Telemetry (KS Test) │ │
│ │ • AirMind Agent (9 Sub-Analyzers)• Grounded Gemini AI Analyst           │ │
│ │ • Government Dispatch Engine     • Executive ReportLab PDF Generator    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 19 Advanced Software-Only Features & Capabilities

### 1. 🤖 LightGBM High-Precision AQI Forecasting Engine
- **Predictive Horizons**: Generates 24-hour, 48-hour, and 72-hour hourly forecasts with **95% Confidence Intervals (CIs)**.
- **Performance Benchmarks**: Trained on 44 spatiotemporal features ($R^2 = 0.9455$, $RMSE = 7.61$, $MAE = 2.36$).

### 2. 🌐 Hybrid Spatial Data Fusion Engine (1 km² VOP Grid)
- **Sparse Network Solution**: Addresses sparse station coverage (e.g. 2–4 stations across 400 km²) by generating a continuous 1 km × 1 km **Virtual Observation Point (VOP)** spatial grid.
- **Multi-Source Layer Integration**: Fuses OpenAQ, CPCB, OpenWeather, Sentinel-5P $\text{NO}_2$, MODIS NDVI, population density, road network density, and industrial proximity.

### 3. 📡 Intelligent Virtual Sensor Network (GPR & Kriging)
- Uses **Gaussian Process Regression (GPR)** and **Ordinary Kriging** to predict AQI, $\text{PM}_{2.5}$, $\text{PM}_{10}$, and $\text{NO}_2$ for unmonitored geographic coordinates.
- Computes estimated uncertainty standard deviation ($\sigma$) and confidence scores ($40\%-98\%$) for every virtual sensor node.

### 4. 🛰️ AI Satellite Gap Filling Engine
- Reconstructs missing tropospheric $\text{NO}_2$ and $\text{SO}_2$ satellite rasters during heavy monsoon cloud cover and 12–24h orbital revisit gaps using spatio-temporal Kriging and atmospheric wind advection.

### 5. 🔥 Adaptive HDBSCAN Hotspot Clustering Engine
- Dynamically scales `min_cluster_size` based on spatial observation density and population distribution.
- Outlines cluster boundaries, centroid drift vectors, radius, severity tiers, and dominant pollutant drivers.

### 6. 💨 4D Atmospheric Digital Twin Simulation Engine
- Simulates 4D spatiotemporal hourly pollutant transport ($t+0, t+1, t+2 \dots t+6$), wind vector advection, Planetary Boundary Layer (PBL) height fluctuations, and future plume evolution.

### 7. ⚖️ Multi-Model Pollution Source Attribution
- Fuses SHAP values, Bayesian multi-pollutant ratios, wind direction vectors, and land-use density.
- Categorizes pollution drivers into **Traffic**, **Industrial Stacks**, **Uncontained Construction**, **Open Waste Burning**, and **Biomass**.

### 8. 👁️ Computer Vision Incident Verification
- Processes citizen-uploaded evidence photos to detect smoke plumes, construction dust, garbage fires, and industrial emissions.
- Assigns automated verification scores ($0-100\%$) and suggested municipal dispatches.

### 9. 📚 RAG Environmental Knowledge Intelligence Engine
- Indexing **CPCB NAQI Guidelines**, **WHO Air Quality Standards**, **National Clean Air Programme (NCAP)** policies, and **GRAP Stage** regulations.
- Ensures AI answers directly cite official environmental policies and standards.

### 10. 🧠 Master AirMind Intelligence Agent & 9 Sub-Analyzers
- Features 9 specialized deterministic sub-analyzers (`AQIAnalyzer`, `ForecastAnalyzer`, `WeatherAnalyzer`, `TrafficAnalyzer`, `SatelliteAnalyzer`, `HotspotAnalyzer`, `PollutionSourceAnalyzer`, `CitizenReportAnalyzer`, `EnvironmentalRiskAnalyzer`).
- Synthesizes all environmental metrics into a canonical `Structured Intelligence JSON`.

### 11. 🛡️ Grounded Gemini AI Analyst Layer (Anti-Hallucination)
- **Strict Grounding Directive**: Gemini converts the `Structured Intelligence JSON` into human-readable text. It **NEVER** generates predictions or invents arbitrary metrics.
- Returns verified fallbacks when data is missing: *"Available environmental evidence is insufficient to make a reliable conclusion."*

### 12. 🚨 Smart Enforcement Recommendation Engine
- Automatically ranks ward intervention priorities, dispatches specific enforcement actions (e.g. truck rerouting, water misting, cease-work orders), and estimates expected AQI reduction metrics.

### 13. 🏆 Community Green Ranking Engine (Green Community Score)
- Implements the 6-factor weighted Green Community Score formula:
  $$\text{Green Score} = 0.40 \cdot \Delta\text{AQI} + 0.20 \cdot \text{PollutionRed} + 0.15 \cdot \text{Reports} + 0.10 \cdot \text{Trees} + 0.10 \cdot \text{WasteBurnRed} + 0.05 \cdot \text{Awareness}$$
- Ranks Municipal Wards, Eco-Schools, RWAs, and Regional Municipalities for green grants.

### 14. 📄 Executive ReportLab PDF Generator
- Renders formal, publication-quality PDF Executive Reports with AQI summaries, 72h forecast tables, priority dispatches, and capital budget breakdowns.

### 15. 🌆 Multi-City Real-Time Intelligence Command Center
- Provides live comparative rankings, CPCB sub-index breakdowns, 24h trends, weather vectors, and auto-refresh timers across 8 Indian metropolises (Delhi, Mumbai, Kolkata, Bengaluru, Chennai, Guwahati, Hyderabad, Pune).

### 16. 🧪 Policy Scenario Simulator
- Enables city administrators to simulate policy interventions (e.g., *Reduce Traffic by 20%*, *Enforce Construction Ban*) and evaluate before-and-after AQI impacts in real time.

### 17. 📈 Continuous Model Monitoring & Drift System
- Tracks prediction accuracy ($R^2$, $RMSE$, $MAE$), feature Kolmogorov-Smirnov (KS) distribution drift, and automatically flags retraining needs when $R^2 < 0.85$.

### 18. 🔔 Smart Environmental Notification Engine
- Generates personalized real-time alerts for AQI deterioration, new hotspot creation, health advisories, and community leaderboard updates.

### 19. 📢 Citizen Reporting & Incident Filing Portal
- Allows citizens to submit geolocation-enabled pollution reports with photo evidence and view demographic-specific health advisories in multiple languages (English, Hindi, Bengali, Assamese).

---

## 🛠️ Technology Stack

| Layer | Technology Used |
| :--- | :--- |
| **Frontend UI** | React 18, Vite, Leaflet GIS, Recharts, Custom Dark Glassmorphism CSS |
| **Backend Proxy** | Node.js, Express.js, Mongoose, JWT Authentication |
| **Database** | MongoDB Atlas / Local MongoDB |
| **AI / ML Service** | FastAPI, Python 3.11+, scikit-learn, LightGBM, NumPy, Pandas |
| **Geospatial & Remote Sensing** | SciPy, Gaussian Process Regression, Kriging, HDBSCAN, Shapely |
| **AI LLM & Vision** | Google Gemini API (Grounded Prompting & Image Analysis) |
| **PDF Generation** | ReportLab PDF Engine |

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/intelligence/agent/intelligence-json` | Canonical Structured Intelligence JSON output |
| `GET` | `/api/intelligence/agent/explain-gemini` | Grounded Gemini Executive Report |
| `GET` | `/api/intelligence/agent/community-rankings` | Weighted Green Community Leaderboard |
| `GET` | `/api/intelligence/agent/report/pdf` | Downloadable Executive PDF Report |
| `POST` | `/api/intelligence/agent/chat` | Grounded AI Assistant Question Answering |
| `GET` | `/api/intelligence/virtual-sensors` | Virtual Sensor Network with GPR & Uncertainty Bounds |
| `GET` | `/api/intelligence/satellite-gap-fill` | Satellite Cloud & Swath Reconstruction |
| `GET` | `/api/intelligence/digital-twin` | 4D Spatiotemporal Hourly Dispersion Simulation |
| `POST` | `/api/intelligence/verify-incident-image` | Computer Vision Image Incident Verification |
| `GET` | `/api/intelligence/rag-query` | RAG Search over CPCB, WHO, and NCAP Policy Documents |
| `GET` | `/api/intelligence/model-monitoring` | Model Telemetry, Drift Analysis & Health Score |
| `GET` | `/api/intelligence/notifications` | Smart Environmental Alerts |
| `GET` | `/api/intelligence/multi-city` | Dynamic Multi-City Real-Time Intelligence Feeds |
| `POST` | `/api/intelligence/simulator` | Environmental Policy Scenario Simulator |

---

## ⚡ Quickstart & Installation Guide

### 1. Prerequisites
- **Node.js**: v20+
- **Python**: v3.11+ (with Miniconda / virtual environment)
- **MongoDB**: Local `mongod` or MongoDB Atlas URI

### 2. Setup Environment
```bash
# Clone the repository
git clone https://github.com/kaustavvdeka/AQI-AirMind.git
cd AQI-AirMind

# Copy environment template
cp .env.example .env
# Edit .env and supply OPENWEATHER_API_KEY, GEMINI_API_KEY, and MONGO_URI
```

### 3. Install Dependencies
```bash
# Install Node dependencies across monorepo
npm run install:all

# Install Python AI dependencies
cd ai
pip install -r requirements.txt
cd ..
```

---

## 🚦 Running the Platform

Launch all services concurrently using terminal windows or background tasks:

```bash
# Terminal 1: Launch React Frontend (Port 5173) & Express Backend (Port 5001)
npm run dev:all

# Terminal 2: Launch FastAPI AI Service (Port 8000)
cd ai
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Access the UI in your browser:
👉 **`http://localhost:5173`**

---

## 🧪 System QA & Automated Certification

To run the complete automated end-to-end verification suite across all 19 software enhancement modules:

```bash
python ai/qa_checker.py
```

### QA Certification Results

```
================================================================================
           AIRMIND AI — COMPREHENSIVE SYSTEM CERTIFICATION REPORT
================================================================================

| Feature / Module | Status | Validation Details |
| :--- | :--- | :--- |
| Master AirMind Intelligence Agent Synthesis Engine | PASS | AQI: 183.4, Actions: 3 |
| Grounded Gemini AI Analyst Layer (Anti-Hallucination) | PASS | Generated 1253 char executive report |
| Community Green Ranking Leaderboard (Weighted Score Formula) | PASS | Ranked 4 Wards, Top: Ward 07 — Green Belt Sector |
| Publication-Quality PDF Executive Report Generator | PASS | Generated 3459 bytes PDF buffer |
| Hybrid Spatial Data Fusion (Virtual Observation Points) | PASS | Generated 100 1km² VOP cells |
| Intelligent Virtual Sensor Network (GPR & Kriging) | PASS | Generated 64 virtual sensors with uncertainty bounds |
| AI Satellite Gap Filling Engine (Cloud & Swath Reconstruction) | PASS | Reconstructed 32/64 satellite pixels |
| Adaptive HDBSCAN Hotspot Detection Engine | PASS | Identified 10 adaptive hotspot polygons |
| 4D Atmospheric Digital Twin Simulation Engine | PASS | Simulated 6 hourly spatiotemporal dispersion steps |
| Computer Vision Incident Detection Engine | PASS | Type: OPEN_WASTE_BURNING, Verification Score: 89.8% |
| RAG Environmental Knowledge Intelligence Engine | PASS | Retrieved 2 policy documents, Citations: ['CPCB-NAQI-2014', 'WHO-AQG-2021'] |
| Continuous Model Monitoring & Drift System | PASS | Status: HEALTHY, R²: 0.9455 |
| Smart Environmental Notification Engine | PASS | Generated 2 personalized alerts |
```

---

## 📜 License

This project is licensed under the MIT License — see the `LICENSE` file for details.
