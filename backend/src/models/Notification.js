import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null = broadcast to all
    type: { type: String, enum: ["aqi_alert", "report_update", "system"], default: "aqi_alert" },
    severity: { type: String, enum: ["info", "warning", "critical"], default: "info" },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
