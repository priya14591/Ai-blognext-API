const express = require("express");
const { getComments, addComment, moderateComment, deleteComment } = require("../controllers/commentController");
const { protect } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// mergeParams lets us read :postId when mounted under /api/posts/:postId/comments
const router = express.Router({ mergeParams: true });

router.get("/", getComments);
router.post("/", protect, addComment);

module.exports = router;

// Separate router for direct /api/comments/:id actions
const directRouter = express.Router();
directRouter.patch("/:id/moderate", protect, roleCheck("editor", "admin"), moderateComment);
directRouter.delete("/:id", protect, deleteComment);
module.exports.directRouter = directRouter;
