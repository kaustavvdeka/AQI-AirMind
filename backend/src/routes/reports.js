import { Router } from "express";
import { body, validationResult } from "express-validator";
import Report from "../models/Report.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// POST /api/reports — citizen submits a pollution report (image already
// uploaded to your object storage of choice; this stores the resulting URL).
router.post(
  "/",
  requireAuth,
  [
    body("description").trim().notEmpty(),
    body("lat").isFloat(),
    body("lon").isFloat(),
    body("imageUrl").optional().isURL(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { description, imageUrl, lat, lon } = req.body;
      const report = await Report.create({ user: req.user.id, description, imageUrl, lat, lon });
      res.status(201).json(report);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/reports/mine — citizen's own reports with status
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const reports = await Report.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

// GET /api/reports — admin: all reports
router.get("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const reports = await Report.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/reports/:id/status — admin: update report status
router.patch("/:id/status", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["submitted", "under_review", "resolved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json(report);
  } catch (err) {
    next(err);
  }
});

export default router;
