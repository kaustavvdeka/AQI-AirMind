import { Router } from "express";
import { aiClient } from "../utils/aiClient.js";

const router = Router();

// GET /api/recommendations — current drivers + AI-generated action recommendations
router.get("/", async (req, res, next) => {
  try {
    const result = await aiClient.explain();
    res.json(result);
  } catch (err) {
    err.status = err.status || 502;
    next(err);
  }
});

export default router;
