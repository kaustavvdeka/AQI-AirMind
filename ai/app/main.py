"""
AirMind AI — FastAPI prediction service.

Startup behavior:
  1. If no raw data exists → run the data fetchers automatically.
  2. If no trained model exists → train one automatically on startup.
  3. Start serving traffic on port 8000.

All of this is non-blocking: the app starts immediately, and data
fetch + training run in a background thread if needed.
"""
import logging
import threading

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import MODELS_DIR, RAW_DIR

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger("airmind-ai")

app = FastAPI(
    title="AirMind AI Service",
    version="1.0.0",
    description="AI-powered AQI prediction and explainability for AirMind."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global status flags for startup tasks
_startup_status = {"phase": "starting", "message": "Initializing…", "ready": False}
_startup_lock = threading.Lock()


def _auto_setup():
    """Background thread: fetch data + train model if not already done."""
    global _startup_status
    try:
        # Step 1: Fetch data if needed
        aq_path = RAW_DIR / "openaq_history.csv"
        wx_path = RAW_DIR / "openweather_forecast.csv"

        if not aq_path.exists() or not wx_path.exists():
            with _startup_lock:
                _startup_status = {"phase": "fetching_data", "message": "Fetching air quality and weather data…", "ready": False}
            logger.info("Auto-fetching data…")
            from app.data.fetch_openaq import fetch_and_cache as fetch_aq
            from app.data.fetch_openweather import fetch_and_cache as fetch_wx
            fetch_aq()
            fetch_wx()
            logger.info("Data fetch complete.")

        # Step 2: Train model if needed
        model_path = MODELS_DIR / "random_forest.pkl"
        if not model_path.exists():
            with _startup_lock:
                _startup_status = {"phase": "training", "message": "Training AI model (first run — takes ~60s)…", "ready": False}
            logger.info("Auto-training model…")
            from app.train import train_and_select_best
            report = train_and_select_best()
            logger.info(
                "Training complete: %s (R²=%.4f, RMSE=%.2f)",
                report["best_model"], report["best_metrics"]["r2"], report["best_metrics"]["rmse"]
            )

        with _startup_lock:
            _startup_status = {"phase": "ready", "message": "Ready to serve predictions.", "ready": True}
        logger.info("AirMind AI service is ready.")

    except Exception as exc:
        with _startup_lock:
            _startup_status = {"phase": "error", "message": str(exc), "ready": False}
        logger.error("Startup failed: %s", exc, exc_info=True)


@app.on_event("startup")
async def startup_event():
    """Kick off background initialization on server startup."""
    t = threading.Thread(target=_auto_setup, daemon=True, name="airmind-setup")
    t.start()


# ---- Import prediction/explain modules after startup hook ----
from app.predict import ModelNotTrainedError, load_model_info, predict_all_horizons, predict_horizon
from app.explain import explain_current_conditions
from app.recommend_gemini import generate_recommendations
from app.train import train_and_select_best


class TrainRequest(BaseModel):
    force_rebuild_data: bool = False


@app.get("/")
def root():
    return {"service": "AirMind AI", "version": "1.0.0", "status": "running"}


@app.get("/health")
def health():
    with _startup_lock:
        status = dict(_startup_status)
    return {"status": "ok" if status["ready"] else "initializing", **status}


@app.get("/data/status")
def data_status():
    """Show what raw data files exist and their sizes."""
    files = {}
    for name in ["openaq_history.csv", "openweather_forecast.csv"]:
        p = RAW_DIR / name
        files[name] = {"exists": p.exists(), "size_kb": round(p.stat().st_size / 1024, 1) if p.exists() else 0}
    return {"raw_data": files, "model_exists": (MODELS_DIR / "random_forest.pkl").exists()}


@app.get("/model-info")
def model_info():
    info = load_model_info()
    if not info:
        raise HTTPException(
            status_code=404,
            detail="No trained model yet. Call /train first, or wait for auto-training to complete."
        )
    return info


@app.post("/train")
def train(req: TrainRequest = TrainRequest()):
    try:
        report = train_and_select_best(force_rebuild_data=req.force_rebuild_data)
        with _startup_lock:
            _startup_status["ready"] = True
            _startup_status["phase"] = "ready"
        return report
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"{exc}. Run the data fetchers first: POST /data/fetch",
        )


@app.post("/retrain")
def retrain():
    """Force rebuild dataset and retrain."""
    try:
        report = train_and_select_best(force_rebuild_data=True)
        with _startup_lock:
            _startup_status["ready"] = True
        return report
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/data/fetch")
def trigger_data_fetch(background_tasks: BackgroundTasks):
    """Trigger data fetch in background (non-blocking)."""
    def _fetch():
        from app.data.fetch_openaq import fetch_and_cache as fetch_aq
        from app.data.fetch_openweather import fetch_and_cache as fetch_wx
        fetch_aq(force=True)
        fetch_wx(force=True)
        logger.info("Manual data fetch complete.")
    background_tasks.add_task(_fetch)
    return {"message": "Data fetch triggered in background."}


@app.get("/predict")
def predict(hours: int | None = None):
    with _startup_lock:
        ready = _startup_status["ready"]
    if not ready:
        raise HTTPException(
            status_code=503,
            detail=f"Service initializing: {_startup_status['message']} Check /health for status."
        )
    try:
        if hours is not None:
            if hours not in (24, 48, 72):
                raise HTTPException(status_code=400, detail="hours must be 24, 48, or 72")
            return predict_horizon(hours)
        return predict_all_horizons()
    except ModelNotTrainedError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/explain")
def explain():
    try:
        result = explain_current_conditions()
        rec = generate_recommendations(result["current_aqi"], result["active_drivers"])
        result["recommendations"] = rec
        return result
    except FileNotFoundError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


from pymongo import MongoClient
from app.config import MONGODB_URI
from app.hotspots import identify_hotspots

@app.get("/hotspots")
def hotspots(wind_speed: float = 3.0, wind_direction: float = 180.0):
    try:
        client = MongoClient(MONGODB_URI)
        db = client.get_database()
        
        # Pull station AQI records
        aqi_records = list(db["aqis"].find({}, {"_id": 0, "location": 1, "lat": 1, "lon": 1, "aqi": 1}))
        # Pull citizen reports
        report_records = list(db["reports"].find({"status": {"$ne": "rejected"}}, {"_id": 0, "description": 1, "lat": 1, "lon": 1}))
        
        points = []
        for r in aqi_records:
            points.append({
                "name": r.get("location"),
                "lat": float(r["lat"]),
                "lon": float(r["lon"]),
                "aqi": float(r["aqi"])
            })
        for r in report_records:
            points.append({
                "name": r.get("description", "Reported Incident")[:30],
                "lat": float(r["lat"]),
                "lon": float(r["lon"]),
                "aqi": 250.0
            })
            
        if len(points) < 2:
            points = [
                {"name": "Guwahati Central", "lat": 26.1445, "lon": 91.7362, "aqi": 154.0},
                {"name": "Jalukbari", "lat": 26.152, "lon": 91.674, "aqi": 185.0},
                {"name": "Khanapara", "lat": 26.115, "lon": 91.815, "aqi": 240.0},
                {"name": "Dispur", "lat": 26.1398, "lon": 91.7915, "aqi": 82.0},
                {"name": "Incident 1", "lat": 26.1420, "lon": 91.7310, "aqi": 250.0},
                {"name": "Incident 2", "lat": 26.1460, "lon": 91.7400, "aqi": 250.0},
            ]
            
        results = identify_hotspots(points, wind_speed, wind_direction)
        return results
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
