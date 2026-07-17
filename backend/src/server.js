import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./utils/logger.js";

import authRoutes from "./routes/auth.js";
import aqiRoutes from "./routes/aqi.js";
import weatherRoutes from "./routes/weather.js";
import predictionRoutes from "./routes/prediction.js";
import reportsRoutes from "./routes/reports.js";
import historyRoutes from "./routes/history.js";
import recommendationsRoutes from "./routes/recommendations.js";

// Load the shared .env from the monorepo root (../../.env from src/), so
// backend and ai read the exact same secrets — no duplicated keys.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("combined"));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use("/api", limiter);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/aqi", aqiRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/prediction", predictionRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/recommendations", recommendationsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => logger.info(`AirMind backend listening on :${PORT}`));
  } catch (err) {
    logger.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
