const express = require("express");
const { register, login, getMe, updateUserRole } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", protect, getMe);
router.patch("/users/:id/role", protect, roleCheck("admin"), updateUserRole);

module.exports = router;
