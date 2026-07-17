# AirMind AI — Urban Air Quality Intelligence Platform

Predict. Prevent. Protect.

A three-service platform: a Vite/React frontend, an Express/MongoDB backend, and a FastAPI AI service that fetches data, trains an AQI model, and serves predictions + explainability + AI recommendations.

## Architecture

```
frontend (Vite/React, :5173)
     │  REST (JWT)
     ▼
backend (Express, :5000) ──── MongoDB Atlas / Local MongoDB
     │  REST
     ▼
ai (FastAPI, :8000) ──── OpenAQ / OpenWeather / Earth Engine / Gemini
```

See `docs/architecture.md` for the full data flow diagram.

## Prerequisites

- Node.js 20+
- Python 3.11+
- A MongoDB Atlas cluster (or local `mongod`)
- API keys: OpenAQ, OpenWeather. Optional: Google Earth Engine project, Gemini.

## Setup

```bash
# 1. Clone the project and copy the environment file
cp .env.example .env
# fill in your real keys in .env

# 2. Run the monorepo installer to configure dependencies
npm run install:all
```

## Run (development)

We configure unified scripts at the monorepo root to launch the stack in development:

```bash
# Run both Frontend and Backend concurrently
npm run dev:all

# Run the FastAPI AI Service in another terminal
cd ai && python main.py
```

## Bootstrapping data + model

On startup, the AI service automatically checks if ground measurements and weather data are present:
- **First Run Auto-Fetch:** If data is missing, it auto-fetches OpenAQ and OpenWeather records.
- **First Run Auto-Train:** If no trained model exists, it builds the dataset and selects the best model (RF vs XGBoost) in a background thread.

To manually trigger or force retrain at any time:

```bash
# Force retraining via HTTP POST
curl -X POST http://localhost:8000/train -H "Content-Type: application/json" -d '{"force_rebuild_data": true}'
```

Or trigger data fetch and training from the **Admin Panel** on the frontend.

## Features

- **Real-Time Dashboard:** Animated AQI gauge, 7-day trend line charts, and Ground Sensor Pollutants list.
- **Interactive GIS Map:** Real-time ground station measurements overlayed on Dark Map Tiles with custom translucent pollution heatmaps and municipal layers (hospitals, schools, parks).
- **Satellite Analytics:** Leaflet overlay of high-resolution Sentinel-5P columns (NO₂, SO₂, CO) and MODIS vegetation/temperature maps (NDVI, LST) with responsive dynamic legends.
- **Explainable AI:** Feature Importance bar charts and live local driver analysis identifying exactly which parameters are elevating current AQI.
- **Citizen Portal:** Geolocation-enabled citizen pollution reporting directly to administrative tables with evidence attachments.
- **Admin Panel:** Complete interface to execute retraining cycles and review/update report statuses.

## Docker

```bash
docker compose up --build
```
