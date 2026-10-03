const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    t: { type: Number },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    startLocation: pointSchema,
    endLocation: pointSchema,
    distanceMeters: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    route: [pointSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", tripSchema);