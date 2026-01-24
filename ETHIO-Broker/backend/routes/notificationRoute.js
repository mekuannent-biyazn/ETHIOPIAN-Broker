// routes/notificationRoute.js
const express = require("express");
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    getNotificationStats
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET /api/notifications - Get user notifications
router.get("/", getNotifications);

// GET /api/notifications/stats - Get notification statistics
router.get("/stats", getNotificationStats);

// PATCH /api/notifications/mark-all-read - Mark all notifications as read
router.patch("/mark-all-read", markAllAsRead);

// PATCH /api/notifications/:id/read - Mark specific notification as read
router.patch("/:id/read", markAsRead);

// DELETE /api/notifications/:id - Delete specific notification
router.delete("/:id", deleteNotification);

// POST /api/notifications - Create notification (admin/system use)
router.post("/", createNotification);

module.exports = router;