import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema(
  {
    location: { type: String, required: true },
    horizonHours: { type: Number, enum: [24, 48, 72], required: true },
    predictedAqi: { type: Number, required: true },
    targetTime: { type: Date, required: true },
    modelName: String,
    modelMetrics: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model("Prediction", predictionSchema);
