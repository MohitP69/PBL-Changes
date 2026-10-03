const express = require("express");
const router = express.Router();
const tripsController = require("../controllers/tripsController");

// IMPORTANT: replace the next line with the exact verifyAuthToken
// require line that is already at the top of routes/posts.js
const { verifyAuthToken } = require("../middleware/auth");

router.get("/", verifyAuthToken, tripsController.getMyTrips);
router.post("/start", verifyAuthToken, tripsController.startTrip);
router.post("/:id/end", verifyAuthToken, tripsController.endTrip);

module.exports = router;