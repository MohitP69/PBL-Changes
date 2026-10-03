const mongoose = require("mongoose");

// Define the Comment Schema first, as it's a sub-document
const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the User
    ref: "User", // The model name to which it refers
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userAvatar: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Define the main Post Schema
const postSchema = new mongoose.Schema({
  // Reference the User document using its ObjectId
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  hashtags: {
    type: String, // Changed to a single String
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: [commentSchema], // An array of comment sub-documents
  isLiked: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create and export the Post model
const Post = mongoose.model("Post", postSchema);

module.exports = Post;
