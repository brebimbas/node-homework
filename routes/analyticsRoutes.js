const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/users/:id", authMiddleware, analyticsController.getUserAnalytics);
router.get("/users", authMiddleware, analyticsController.getUsersWithStats);
router.get("/tasks/search", authMiddleware, analyticsController.searchTasks);

module.exports = router;
