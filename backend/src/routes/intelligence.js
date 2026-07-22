import express from "express";
import { logger } from "../utils/logger.js";

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// Helper for proxying requests to AI service with support for JSON and binary responses (e.g. PDF)
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
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/pdf")) {
      const buffer = await response.arrayBuffer();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=AirMind_Executive_Report.pdf");
      return res.status(response.status).send(Buffer.from(buffer));
    }

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

// Advanced Software-Only Enhancement Proxy Endpoints
router.get("/virtual-sensors", (req, res) => proxyToAI(res, "/virtual-sensors", "get", null, req.query));
router.get("/satellite-gap-fill", (req, res) => proxyToAI(res, "/satellite-gap-fill", "get", null, req.query));
router.get("/digital-twin", (req, res) => proxyToAI(res, "/digital-twin", "get", null, req.query));
router.post("/verify-incident-image", (req, res) => proxyToAI(res, "/verify-incident-image", "post", req.body));
router.get("/rag-query", (req, res) => proxyToAI(res, "/rag-query", "get", null, req.query));
router.get("/model-monitoring", (req, res) => proxyToAI(res, "/model-monitoring", "get", null, req.query));
router.get("/notifications", (req, res) => proxyToAI(res, "/notifications", "get", null, req.query));

// AirMind Intelligence Agent Endpoints
router.get("/agent/intelligence-json", (req, res) => proxyToAI(res, "/agent/intelligence-json", "get", null, req.query));
router.get("/agent/explain-gemini", (req, res) => proxyToAI(res, "/agent/explain-gemini", "get", null, req.query));
router.get("/agent/community-rankings", (req, res) => proxyToAI(res, "/agent/community-rankings", "get", null, req.query));
router.get("/agent/report/pdf", (req, res) => proxyToAI(res, "/agent/report/pdf", "get", null, req.query));
router.post("/agent/chat", (req, res) => proxyToAI(res, "/agent/chat", "post", req.body));

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
