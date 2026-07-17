import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to your .env file (MongoDB Atlas connection string)."
    );
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("MongoDB connected");

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
  });
}
