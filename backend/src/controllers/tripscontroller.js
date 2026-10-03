const Trip = require("../models/Trip");
const User = require("../models/User");

const MAX_ROUTE_POINTS = 1000;

// A trip only counts for rewards if it covers at least this distance (meters).
// This stops people farming points by tapping Start/End. Set to 0 to count every trip.
const MIN_DISTANCE_FOR_CREDIT = 50;

// Must match POINTS_PER_KM in the Trips screen
const POINTS_PER_KM = 20;

const toRad = (deg) => (deg * Math.PI) / 180;

// Distance between two GPS points in meters (Haversine formula)
const haversineMeters = (a, b) => {
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
};

const isValidPoint = (p) =>
  p &&
  Number.isFinite(p.latitude) &&
  Number.isFinite(p.longitude) &&
  Math.abs(p.latitude) <= 90 &&
  Math.abs(p.longitude) <= 180;

const transformTrip = (trip) => ({
  id: trip._id.toString(),
  status: trip.status,
  startedAt: trip.startedAt,
  endedAt: trip.endedAt,
  startLocation: trip.startLocation,
  endLocation: trip.endLocation,
  distanceMeters: trip.distanceMeters,
  durationSeconds: trip.durationSeconds,
});

// POST /api/trips/start
exports.startTrip = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { latitude, longitude } = req.body;

    if (!isValidPoint({ latitude, longitude })) {
      return res.status(400).json({
        message: "A valid start location is required",
      });
    }

    // Close any old trip that was never ended
    await Trip.updateMany(
      { user: user._id, status: "active" },
      { status: "abandoned", endedAt: new Date() }
    );

    const trip = await Trip.create({
      user: user._id,
      startLocation: { latitude, longitude, t: Date.now() },
    });

    console.log("Trip started:", trip._id);

    res.status(201).json(transformTrip(trip));
  } catch (err) {
    console.error("Start trip error:", err);
    res.status(500).json({ message: "Failed to start trip" });
  }
};

// POST /api/trips/:id/end
exports.endTrip = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (trip.user.toString() !== user._id.toString()) {
      return res.status(403).json({
        message: "You don't have permission to end this trip",
      });
    }

    if (trip.status !== "active") {
      return res.status(400).json({
        message: "This trip is not active",
      });
    }

    const rawRoute = Array.isArray(req.body.route) ? req.body.route : [];
    const route = rawRoute.filter(isValidPoint).slice(0, MAX_ROUTE_POINTS);

    // Recalculate distance on the server so the client can't fake it
    let distanceMeters = 0;
    for (let i = 1; i < route.length; i++) {
      distanceMeters += haversineMeters(route[i - 1], route[i]);
    }

    const endedAt = new Date();
    const lastPoint = route.length > 0 ? route[route.length - 1] : null;

    trip.route = route.map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
      t: p.t,
    }));
    trip.endLocation = lastPoint
      ? { latitude: lastPoint.latitude, longitude: lastPoint.longitude, t: lastPoint.t }
      : trip.startLocation;
    trip.distanceMeters = Math.round(distanceMeters);
    trip.endedAt = endedAt;
    trip.durationSeconds = Math.round(
      (endedAt.getTime() - trip.startedAt.getTime()) / 1000
    );
    trip.status = "completed";

    await trip.save();

    // Reward the user. This only runs once per trip, because the status
    // check above rejects trips that are no longer "active".
    let pointsEarned = 0;

    if (trip.distanceMeters >= MIN_DISTANCE_FOR_CREDIT) {
      pointsEarned = Math.floor((trip.distanceMeters / 1000) * POINTS_PER_KM);

      await User.updateOne(
        { _id: user._id },
        { $inc: { tripsCompleted: 1, points: pointsEarned } }
      );
    }

    console.log(
      "Trip ended:",
      trip._id,
      `${trip.distanceMeters} m, ${trip.durationSeconds} s, +${pointsEarned} points`
    );

    res.json({ ...transformTrip(trip), pointsEarned });
  } catch (err) {
    console.error("End trip error:", err);

    if (err.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid trip ID" });
    }

    res.status(500).json({ message: "Failed to end trip" });
  }
};

// GET /api/trips  (my recent trips)
exports.getMyTrips = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const trips = await Trip.find({ user: user._id })
      .select("-route")
      .sort({ startedAt: -1 })
      .limit(20);

    res.json(trips.map(transformTrip));
  } catch (err) {
    console.error("Get trips error:", err);
    res.status(500).json({ message: "Failed to fetch trips" });
  }
};