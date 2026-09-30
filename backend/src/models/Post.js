const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: [true, "Title is required"], trim: true }, // title
    photo: { type: String, default: "" }, // media path/link
    message: { type: String, required: [true, "Content is required"] }, // body
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    tags: [{ type: String, trim: true, lowercase: true }],
    status: {
      type: String,
      enum: ["draft", "pending", "scheduled", "published"],
      default: "draft",
    },
    scheduledAt: { type: Date },
    likes: { type: Number, default: 0 },
    aiGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

postSchema.index({ name: "text", message: "text", tags: "text" });

module.exports = mongoose.model("Post", postSchema);
