# Architecture

## Services

**frontend/** — Vite + React SPA. Talks only to the Express backend
(never directly to OpenAQ/OpenWeather/Gemini — those keys stay server-side).

**backend/** — Express REST API. Owns MongoDB (users, AQI history,
predictions, reports, notifications). Proxies prediction/explainability
requests to the AI service so the frontend never needs to know it exists.

**ai/** — FastAPI service. Owns the ML lifecycle: fetching raw data,
preprocessing, training, predicting, explaining, and generating
recommendations via Gemini (with a rule-based fallback).

## Data flow

```
OpenAQ API  ─┐
             ├─► ai/app/data/fetch_*.py ─► data/raw/*.csv, *.tif
OpenWeather ─┘
Earth Engine ┘

data/raw ─► ai/app/preprocessing.py ─► data/processed/training_data.csv
         (merge, clean, feature-engineer: hour/day/month/season, lag, rolling avg)

training_data.csv ─► ai/app/train.py ─► ai/models/random_forest.pkl
                                       ─► ai/models/training_report.json
                                       (RF vs XGBoost, best by R² kept)

Client request ─► backend (Express) ─► ai (FastAPI) /predict, /explain
                                     ─► MongoDB (cache/log the result)
                                     ◄─ response
             ◄─ backend
frontend     ◄─
```

## Auth

JWT issued by the backend on `/api/auth/login` / `/register`. Two roles:
`admin` and `citizen`. Admin-only routes (`/api/prediction/train`,
`/api/reports` list, report status updates) are guarded by
`requireRole("admin")` middleware.

## Why the AI service is separate from the backend

Python's ML ecosystem (scikit-learn, XGBoost, GEE/geemap) doesn't belong
in a Node process. Keeping them as separate services also means the AI
service can be scaled, retrained, or redeployed independently of the
request-serving backend — e.g. a scheduled retrain job hitting `/retrain`
without touching the backend's uptime.
