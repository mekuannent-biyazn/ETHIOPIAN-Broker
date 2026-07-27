// controllers/notificationController.js
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20, unreadOnly = false } = req.query;

        // Build filter
        let filter = { recipient: userId };
        if (unreadOnly === 'true') {
            filter.isRead = false;
        }

        // Get notifications with pagination
        const notifications = await Notification.find(filter)
            .populate("sender", "fname lname email")
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        // Get total count
        const total = await Notification.countDocuments(filter);
        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        res.status(200).json({
            success: true,
            data: {
                notifications,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                },
                unreadCount
            }
        });
    } catch (error) {
        console.error("❌ Get notifications error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching notifications",
            error: error.message
        });
    }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // ✅ Check if ID is a valid ObjectId (handle mock data)
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID format"
            });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification
        });
    } catch (error) {
        console.error("❌ Mark notification as read error:", error);
        res.status(500).json({
            success: false,
            message: "Error marking notification as read",
            error: error.message
        });
    }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });
    } catch (error) {
        console.error("❌ Mark all notifications as read error:", error);
        res.status(500).json({
            success: false,
            message: "Error marking all notifications as read",
            error: error.message
        });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // ✅ Check if ID is a valid ObjectId (handle mock data)
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID format"
            });
        }

        const notification = await Notification.findOneAndDelete({
            _id: id,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification deleted successfully"
        });
    } catch (error) {
        console.error("❌ Delete notification error:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting notification",
            error: error.message
        });
    }
};

// @desc    Create notification (internal use)
// @route   POST /api/notifications
// @access  Private (Admin/System)
exports.createNotification = async (req, res) => {
    try {
        const { recipient, title, message, type, data } = req.body;

        const notification = await Notification.create({
            recipient,
            sender: req.user._id,
            title,
            message,
            type,
            data
        });

        res.status(201).json({
            success: true,
            message: "Notification created successfully",
            data: notification
        });
    } catch (error) {
        console.error("❌ Create notification error:", error);
        res.status(500).json({
            success: false,
            message: "Error creating notification",
            error: error.message
        });
    }
};

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
exports.getNotificationStats = async (req, res) => {
    try {
        const userId = req.user._id;

        const stats = await Notification.aggregate([
            { $match: { recipient: userId } },
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 },
                    unreadCount: {
                        $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] }
                    }
                }
            }
        ]);

        const totalUnread = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        res.status(200).json({
            success: true,
            data: {
                byType: stats,
                totalUnread
            }
        });
    } catch (error) {
        console.error("❌ Get notification stats error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching notification statistics",
            error: error.message
        });
    }
};