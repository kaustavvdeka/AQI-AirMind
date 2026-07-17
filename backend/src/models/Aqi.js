import mongoose from "mongoose";

const aqiSchema = new mongoose.Schema(
  {
    location: { type: String, required: true },
    lat: Number,
    lon: Number,
    aqi: { type: Number, required: true },
    category: String,
    pm25: Number,
    pm10: Number,
    no2: Number,
    so2: Number,
    co: Number,
    o3: Number,
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

aqiSchema.index({ location: 1, recordedAt: -1 });

export default mongoose.model("Aqi", aqiSchema);
