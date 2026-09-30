const express = require("express");
const {
  getPosts, getPost, createPost, updatePost, deletePost, likePost, getMyPosts,
} = require("../controllers/postController");
const { protect } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

const router = express.Router();

// Public listing (falls back to published-only if no/low-privilege user)
router.get("/", (req, res, next) => {
  // optional auth: attach req.user if a valid token is present, else continue as guest
  const { protect: p } = require("../middleware/auth");
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) return p(req, res, next);
  next();
}, getPosts);

router.get("/mine", protect, getMyPosts);
router.get("/:id", getPost);

router.post("/", protect, roleCheck("author", "editor", "admin"), createPost);
router.put("/:id", protect, roleCheck("author", "editor", "admin"), updatePost);
router.delete("/:id", protect, roleCheck("author", "editor", "admin"), deletePost);
router.patch("/:id/like", likePost);

module.exports = router;
