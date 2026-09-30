const Comment = require("../models/Comment");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/posts/:postId/comments  (approved only, unless editor/admin)
const getComments = asyncHandler(async (req, res) => {
  const isPrivileged = req.user && ["admin", "editor"].includes(req.user.role);
  const query = { postID: req.params.postId };
  if (!isPrivileged) query.status = "approved";

  const comments = await Comment.find(query).populate("userID", "name").sort({ createdAt: -1 });
  res.json({ success: true, count: comments.length, data: comments });
});

// POST /api/posts/:postId/comments
const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ success: false, message: "content is required" });

  const comment = await Comment.create({
    postID: req.params.postId,
    userID: req.user._id,
    content,
    status: "pending",
  });

  res.status(201).json({ success: true, data: comment });
});

// PATCH /api/comments/:id/moderate  (editor/admin) body: { status }
const moderateComment = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["approved", "pending", "spam"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }
  const comment = await Comment.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });
  res.json({ success: true, data: comment });
});

// DELETE /api/comments/:id  (owner, editor, admin)
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

  const isOwner = String(comment.userID) === String(req.user._id);
  const isPrivileged = ["admin", "editor"].includes(req.user.role);
  if (!isOwner && !isPrivileged) {
    return res.status(403).json({ success: false, message: "Not allowed to delete this comment" });
  }

  await comment.deleteOne();
  res.json({ success: true, message: "Comment deleted" });
});

module.exports = { getComments, addComment, moderateComment, deleteComment };
