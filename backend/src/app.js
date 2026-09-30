const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");

const { apiLimiter } = require("./middleware/rateLimiter");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const commentRoutes = require("./routes/commentRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

// Security & core middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// Dev: allow any origin (file://, localhost:3000, 5173, 5500...). Prod: only CLIENT_ORIGIN.
const corsOrigin =
  process.env.NODE_ENV === "production" && process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(",")
    : true;
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use(mongoSanitize()); // strips $ and . operators from req.body/query/params
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));
app.use("/api/", apiLimiter);

// Health check
app.get("/api/health", (req, res) => res.json({ success: true, message: "BlogNest API is running" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/posts/:postId/comments", commentRoutes);
app.use("/api/comments", commentRoutes.directRouter);
app.use("/api/categories", categoryRoutes);
app.use("/api/ai", aiRoutes);

// 404 + error handler (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
