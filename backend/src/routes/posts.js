const express = require("express");

const router = express.Router();

const postsController = require("../controllers/postsController");
const { verifyAuthToken } = require("../middleware/auth");
const upload = require("../middleware/upload");

// ============================================================
// GET ALL POSTS
// ============================================================

router.get(
  "/",
  verifyAuthToken,
  postsController.getPosts
);

// ============================================================
// CREATE POST
// ============================================================

router.post(
  "/",
  verifyAuthToken,
  upload.single("image"),
  postsController.createPost
);

// ============================================================
// GET SINGLE POST
// ============================================================

router.get(
  "/:id",
  verifyAuthToken,
  postsController.getPost
);

// ============================================================
// UPDATE POST
// ============================================================

router.put(
  "/:id",
  verifyAuthToken,
  postsController.updatePost
);

// ============================================================
// DELETE POST
// ============================================================

router.delete(
  "/:id",
  verifyAuthToken,
  postsController.deletePost
);

// ============================================================
// LIKE POST
// ============================================================

router.post(
  "/:id/like",
  verifyAuthToken,
  postsController.likePost
);

// ============================================================
// ADD COMMENT
// ============================================================

router.post(
  "/:id/comments",
  verifyAuthToken,
  postsController.addComment
);

// ============================================================
// DELETE COMMENT
// ============================================================

router.delete(
  "/:id/comments/:commentId",
  verifyAuthToken,
  postsController.deleteComment
);

module.exports = router;