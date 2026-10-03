const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { verifyAuthToken } = require("../middleware/auth");

router.get("/", verifyAuthToken, profileController.getProfile);
router.put("/", verifyAuthToken, profileController.updateProfile);

module.exports = router;
