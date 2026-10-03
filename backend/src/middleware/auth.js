const admin = require("../config/firebase-admin");

/**
 * Middleware to verify Firebase ID tokens and attach the decoded user to the request
 */
const verifyAuthToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "No token provided. Format: Authorization: Bearer <token>",
    });
  }

  // Extract the token
  const idToken = authHeader.split("Bearer ")[1];

  try {
    // Verify the token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Attach the verified user data to the request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      name: decodedToken.name || null,
      picture: decodedToken.picture || decodedToken.photoURL || null,
    };
    // req.userId = decodedToken.uid; // For compatibility with existing controllers

    next();
  } catch (error) {
    console.error("Token verification failed:", error);

    if (error.code === "auth/id-token-expired") {
      return res
        .status(401)
        .json({ message: "Token has expired. Please sign in again." });
    }

    return res
      .status(401)
      .json({ message: "Invalid token. Please sign in again." });
  }
};

module.exports = {
  verifyAuthToken,
};
