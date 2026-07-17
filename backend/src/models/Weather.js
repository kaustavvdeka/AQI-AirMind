import mongoose from "mongoose";

const weatherSchema = new mongoose.Schema(
  {
    location: { type: String, required: true },
    temperature: Number,
    humidity: Number,
    pressure: Number,
    windSpeed: Number,
    rainfall: Number,
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Weather", weatherSchema);
