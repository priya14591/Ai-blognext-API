const express = require("express");
const { generateBlog, summarize, generateFAQ } = require("../controllers/aiController");
const { protect } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

const router = express.Router();

router.post("/generate-blog", protect, roleCheck("author", "editor", "admin"), generateBlog);
router.post("/summarize", protect, roleCheck("author", "editor", "admin"), summarize);
router.post("/faq", protect, generateFAQ);

module.exports = router;
