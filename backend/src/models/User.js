const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    avatar: { type: String },
    points: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    tripsCompleted: { type: Number, default: 0 },
    lastSignInTime: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
