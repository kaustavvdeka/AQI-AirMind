# API Reference

## Backend (Express) — base URL `http://localhost:5000`

### Auth
| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/api/auth/register` | none | `{name, email, password}` | role defaults to `citizen` |
| POST | `/api/auth/login` | none | `{email, password}` | returns `{token, user}` |

### AQI
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/aqi/current?location=` | none | latest cached reading |
| GET | `/api/aqi/history?location=&days=` | none | time series |
| POST | `/api/aqi` | none* | ingest a reading — lock this down in production |

### Weather
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/weather/live?lat=&lon=` | none | proxies OpenWeather |
| GET | `/api/weather/history?location=&days=` | none | cached history |

### Prediction
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/prediction?hours=24\|48\|72` | none | omit `hours` for all three |
| POST | `/api/prediction/train` | admin | `{forceRebuildData}` |
| POST | `/api/prediction/retrain` | admin | always rebuilds from raw cache |

### Recommendations
| Method | Path | Auth |
|---|---|---|
| GET | `/api/recommendations` | none |

### History
| Method | Path | Auth |
|---|---|---|
| GET | `/api/history?location=&days=` | none |

### Reports (citizen portal)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/reports` | citizen+ | `{description, imageUrl?, lat, lon}` |
| GET | `/api/reports/mine` | citizen+ | own reports |
| GET | `/api/reports` | admin | all reports |
| PATCH | `/api/reports/:id/status` | admin | `{status}` |

---

## AI service (FastAPI) — base URL `http://localhost:8000`

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/model-info` | — | 404 if no model trained yet |
| POST | `/train` | `{force_rebuild_data}` | trains RF + XGBoost, keeps the best |
| POST | `/retrain` | — | alias for train with forced rebuild |
| GET | `/predict?hours=24\|48\|72` | — | omit `hours` for all three horizons |
| GET | `/explain` | — | drivers + feature importance + Gemini/fallback recommendations |

All error responses are JSON: `{"detail": "..."}` (FastAPI) or
`{"error": "..."}` (Express).
