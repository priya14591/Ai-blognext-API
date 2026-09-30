const Post = require("../models/Post");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/posts  (public: only published; editors/admins can see all via ?status=)
const getPosts = asyncHandler(async (req, res) => {
  const { search, category, tag, status, page = 1, limit = 10 } = req.query;
  const query = {};

  const isPrivileged = req.user && ["admin", "editor"].includes(req.user.role);

  if (status && isPrivileged) {
    query.status = status;
  } else {
    query.status = "published";
  }

  if (category) query.category = category;
  if (tag) query.tags = tag.toLowerCase();
  if (search) query.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);

  const [posts, total] = await Promise.all([
    Post.find(query)
      .populate("userID", "name email")
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Post.countDocuments(query),
  ]);

  res.json({ success: true, count: posts.length, total, page: Number(page), data: posts });
});

// GET /api/posts/:id
const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate("userID", "name email")
    .populate("category", "name slug");

  if (!post) return res.status(404).json({ success: false, message: "Post not found" });

  const isOwnerOrPrivileged =
    req.user && (String(post.userID._id) === String(req.user._id) || ["admin", "editor"].includes(req.user.role));

  if (post.status !== "published" && !isOwnerOrPrivileged) {
    return res.status(403).json({ success: false, message: "This post is not published yet" });
  }

  res.json({ success: true, data: post });
});

// POST /api/posts  (author, editor, admin)
const createPost = asyncHandler(async (req, res) => {
  const { name, message, photo, category, tags, status } = req.body;

  if (!name || !message) {
    return res.status(400).json({ success: false, message: "name (title) and message (content) are required" });
  }

  // Only editor/admin can publish directly; authors go to pending/draft
  const allowedDirectPublish = ["admin", "editor"].includes(req.user.role);
  const finalStatus = status === "published" && !allowedDirectPublish ? "pending" : status || "draft";

  const post = await Post.create({
    userID: req.user._id,
    name,
    message,
    photo,
    category,
    tags,
    status: finalStatus,
  });

  res.status(201).json({ success: true, data: post });
});

// PUT /api/posts/:id  (owner author, or editor/admin)
const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: "Post not found" });

  const isOwner = String(post.userID) === String(req.user._id);
  const isPrivileged = ["admin", "editor"].includes(req.user.role);

  if (!isOwner && !isPrivileged) {
    return res.status(403).json({ success: false, message: "Not allowed to edit this post" });
  }

  const editableFields = ["name", "message", "photo", "category", "tags"];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) post[field] = req.body[field];
  });

  // Only editor/admin can change status (approve/publish/schedule)
  if (req.body.status !== undefined && isPrivileged) {
    post.status = req.body.status;
  }
  if (req.body.scheduledAt !== undefined && isPrivileged) {
    post.scheduledAt = req.body.scheduledAt;
  }

  await post.save();
  res.json({ success: true, data: post });
});

// DELETE /api/posts/:id
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: "Post not found" });

  const isOwner = String(post.userID) === String(req.user._id);
  const isPrivileged = ["admin", "editor"].includes(req.user.role);

  if (!isOwner && !isPrivileged) {
    return res.status(403).json({ success: false, message: "Not allowed to delete this post" });
  }

  await post.deleteOne();
  res.json({ success: true, message: "Post deleted" });
});

// PATCH /api/posts/:id/like
const likePost = asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
  if (!post) return res.status(404).json({ success: false, message: "Post not found" });
  res.json({ success: true, data: post });
});

// GET /api/posts/mine  (author's own posts + performance)
const getMyPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ userID: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, count: posts.length, data: posts });
});

module.exports = { getPosts, getPost, createPost, updatePost, deletePost, likePost, getMyPosts };
