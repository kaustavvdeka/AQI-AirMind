import express from "express";
import { logger } from "../utils/logger.js";

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// Helper for proxying requests to AI service with error fallback
async function proxyToAI(res, endpoint, method = "GET", data = null, params = {}) {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = `${AI_SERVICE_URL}${endpoint}${queryString ? `?${queryString}` : ""}`;
    const options = {
      method: method.toUpperCase(),
      headers: { "Content-Type": "application/json" }
    };
    if (data) options.body = JSON.stringify(data);

    const response = await fetch(url, options);
    const json = await response.json();
    return res.status(response.status).json(json);
  } catch (error) {
    logger.error(`AI Proxy error for ${endpoint}:`, error.message);
    return res.status(502).json({
      error: "AI Intelligence service unavailable",
      details: error.message
    });
  }
}

router.get("/grid-prediction", (req, res) => proxyToAI(res, "/grid-prediction", "get", null, req.query));
router.get("/predict", (req, res) => proxyToAI(res, "/predict", "get", null, req.query));
router.get("/spatial-fusion", (req, res) => proxyToAI(res, "/spatial-fusion", "get", null, req.query));
router.get("/data-quality", (req, res) => proxyToAI(res, "/data-quality", "get", null, req.query));
router.get("/source-attribution", (req, res) => proxyToAI(res, "/source-attribution", "get", null, req.query));
router.get("/dispersion", (req, res) => proxyToAI(res, "/dispersion", "get", null, req.query));
router.get("/layers/traffic", (req, res) => proxyToAI(res, "/layers/traffic", "get", null, req.query));
router.get("/layers/industry", (req, res) => proxyToAI(res, "/layers/industry", "get", null, req.query));
router.get("/layers/construction", (req, res) => proxyToAI(res, "/layers/construction", "get", null, req.query));
router.get("/layers/waste-burning", (req, res) => proxyToAI(res, "/layers/waste-burning", "get", null, req.query));
router.get("/enforcement", (req, res) => proxyToAI(res, "/enforcement", "get", null, req.query));
router.get("/multi-city", (req, res) => proxyToAI(res, "/multi-city", "get", null, req.query));
router.get("/health-advisory", (req, res) => proxyToAI(res, "/health-advisory", "get", null, req.query));
router.get("/explain/shap", (req, res) => proxyToAI(res, "/explain/shap", "get", null, req.query));
router.get("/forecast-validation", (req, res) => proxyToAI(res, "/forecast-validation", "get", null, req.query));
router.post("/simulator", (req, res) => proxyToAI(res, "/simulator", "post", req.body));

export default router;
