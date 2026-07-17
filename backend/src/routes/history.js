import { Router } from "express";
import Aqi from "../models/Aqi.js";
import Prediction from "../models/Prediction.js";

const router = Router();

/**
 * GET /api/history?location=Guwahati&days=30
 * Returns merged timeline of actual AQI readings + predictions,
 * suitable for charting historical vs forecast data.
 */
router.get("/", async (req, res, next) => {
  try {
    const location = req.query.location || "Guwahati";
    const days = Number(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [actuals, predictions] = await Promise.all([
      Aqi.find({ location, recordedAt: { $gte: since } })
        .sort({ recordedAt: 1 })
        .lean(),
      Prediction.find({ location, createdAt: { $gte: since } })
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    const actualSeries = actuals.map((r) => ({
      time: r.recordedAt,
      aqi: r.aqi,
      type: "actual",
      category: r.category,
    }));

    const predictionSeries = predictions.map((p) => ({
      time: p.targetTime,
      aqi: p.predictedAqi,
      type: "predicted",
      horizonHours: p.horizonHours,
      model: p.modelName,
    }));

    res.json({
      location,
      days,
      actuals: actualSeries,
      predictions: predictionSeries,
      combined: [...actualSeries, ...predictionSeries].sort(
        (a, b) => new Date(a.time) - new Date(b.time)
      ),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
