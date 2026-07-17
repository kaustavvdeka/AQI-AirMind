import { Router } from "express";
import Prediction from "../models/Prediction.js";
import { aiClient } from "../utils/aiClient.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/prediction?hours=24|48|72 (omit for all three horizons)
router.get("/", async (req, res, next) => {
  try {
    const hours = req.query.hours ? Number(req.query.hours) : undefined;
    const result = await aiClient.predict(hours);

    const toSave = hours ? [result] : Object.values(result);
    await Prediction.insertMany(
      toSave.map((p) => ({
        location: req.query.location || "Guwahati",
        horizonHours: p.hours_ahead,
        predictedAqi: p.predicted_aqi,
        targetTime: p.target_time,
        modelName: p.model,
        modelMetrics: p.model_metrics,
      }))
    );

    res.json(result);
  } catch (err) {
    err.status = err.status || 502;
    next(err);
  }
});

// POST /api/prediction/train — admin only, kicks off model training
router.post("/train", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const report = await aiClient.train(Boolean(req.body?.forceRebuildData));
    res.json(report);
  } catch (err) {
    err.status = err.status || 502;
    next(err);
  }
});

// POST /api/prediction/retrain — admin only
router.post("/retrain", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const report = await aiClient.retrain();
    res.json(report);
  } catch (err) {
    err.status = err.status || 502;
    next(err);
  }
});

export default router;
