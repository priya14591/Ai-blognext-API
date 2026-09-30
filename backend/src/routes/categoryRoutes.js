const express = require("express");
const { getCategories, createCategory, deleteCategory } = require("../controllers/categoryController");
const { protect } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

const router = express.Router();

router.get("/", getCategories);
router.post("/", protect, roleCheck("editor", "admin"), createCategory);
router.delete("/:id", protect, roleCheck("editor", "admin"), deleteCategory);

module.exports = router;
