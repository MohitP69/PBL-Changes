const admin = require("firebase-admin");
const serviceAccount = require("../firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});



const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const postsRoutes = require("./routes/posts");
const profileRoutes = require("./routes/profile");
const authRoutes = require("./routes/auth");
const tripsRoutes = require("./routes/trips"); // NEW: trips
const { verifyAuthToken } = require("./middleware/auth");

const app = express();

const PORT = process.env.PORT || 5000;

// Register middleware and routes before starting the server
app.use(
  cors({
    origin: [process.env.ALLOWED_ORIGINS, true],
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));

// Public routes
app.use("/api/auth", authRoutes);

// Protected routes - require valid Firebase token
app.use("/api/posts", verifyAuthToken, postsRoutes);
app.use("/api/profile", verifyAuthToken, profileRoutes);
app.use("/api/trips", tripsRoutes); // NEW: trips (routes/trips.js already applies verifyAuthToken)

console.log(
  "Attempting to connect with URI:",
  MONGO_URI ? "URI is defined" : "URI IS UNDEFINED!",
);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error details:");
    console.error(
      "Reason:",
      err.reason ? err.reason.type : "No reason provided",
    );
    console.error("Full Error:", err.message);
  });

module.exports = app;