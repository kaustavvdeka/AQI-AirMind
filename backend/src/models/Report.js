import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true, trim: true },
    imageUrl: String,
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    status: {
      type: String,
      enum: ["submitted", "under_review", "resolved", "rejected"],
      default: "submitted",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
