import { Router } from "express";
import Weather from "../models/Weather.js";

const router = Router();

// GET /api/weather/live?lat=&lon= — proxies OpenWeather so the API key
// never reaches the frontend.
router.get("/live", async (req, res, next) => {
  try {
    const key = process.env.OPENWEATHER_API_KEY || process.env.OpenWeather_api_key;
    if (!key) return res.status(500).json({ error: "OPENWEATHER_API_KEY not configured on the server" });

    const lat = req.query.lat || process.env.DEFAULT_LAT || "26.1445";
    const lon = req.query.lon || process.env.DEFAULT_LON || "91.7362";

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json({ error: data.message || "OpenWeather request failed" });

    res.json({
      temperature: data.main?.temp,
      humidity: data.main?.humidity,
      pressure: data.main?.pressure,
      windSpeed: data.wind?.speed,
      windDeg: data.wind?.deg || 180,
      rainfall: data.rain?.["1h"] || 0,
      recordedAt: new Date(),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/weather/history?location=Guwahati&days=7
router.get("/history", async (req, res, next) => {
  try {
    const location = req.query.location || "Guwahati";
    const days = Number(req.query.days) || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const records = await Weather.find({ location, recordedAt: { $gte: since } }).sort({ recordedAt: 1 });
    res.json({ location, days, count: records.length, records });
  } catch (err) {
    next(err);
  }
});

export default router;
