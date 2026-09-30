const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    postID: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["approved", "pending", "spam"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
