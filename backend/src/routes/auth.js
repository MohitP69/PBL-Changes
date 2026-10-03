const express = require("express");
const router = express.Router();
const { createOrUpdateUser } = require("../controllers/authController");
const { verifyAuthToken } = require("../middleware/auth");

// This endpoint is called after successful Firebase authentication
// to create/update the user profile in our database
router.post("/user", verifyAuthToken, createOrUpdateUser);

module.exports = router;
