const User = require("../models/User");

// Create or update user based on Firebase token information
exports.createOrUpdateUser = async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const { name, email, picture } = req.user;

    let user = await User.findOne({ firebaseUid });

    if (user) {
      // Update user details if they have changed
      user.name = name || user.name;
      user.avatar = picture || user.avatar;
      await user.save();
    } else {
      // Create a new user if one doesn't exist
      user = new User({
        firebaseUid,
        name,
        email,
        avatar: picture,
      });
      await user.save();
    }

    res.json({
      user: {
        id: user.firebaseUid,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        points: user.points,
        badges: user.badges,
        tripsCompleted: user.tripsCompleted,
      },
    });
  } catch (err) {
    console.error("createOrUpdateUser error", err);
    res.status(500).json({ message: "Server error" });
  }
};
