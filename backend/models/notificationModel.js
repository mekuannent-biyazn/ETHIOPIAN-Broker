// models/notificationModel.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false, // System notifications may not have a sender
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: [
                "property_order",
                "payment_completed",
                "payment_failed",
                "property_assigned",
                "commission_earned",
                "message_received",
                "property_approved",
                "property_rejected",
                "user_registered",
                "system_update",
                "general"
            ],
            default: "general",
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
        },
        data: {
            type: mongoose.Schema.Types.Mixed, // Additional data related to the notification
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
        },
        expiresAt: {
            type: Date,
            default: function () {
                // Default expiry: 30 days from creation
                return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            }
        }
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function () {
    const now = new Date();
    const diff = now - this.createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return this.createdAt.toLocaleDateString();
});

// Static method to create notification
notificationSchema.statics.createNotification = async function (data) {
    try {
        const notification = new this(data);
        await notification.save();
        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
};

// Static method to create bulk notifications
notificationSchema.statics.createBulkNotifications = async function (notifications) {
    try {
        return await this.insertMany(notifications);
    } catch (error) {
        console.error("Error creating bulk notifications:", error);
        throw error;
    }
};

// Method to mark as read
notificationSchema.methods.markAsRead = async function () {
    this.isRead = true;
    this.readAt = new Date();
    return await this.save();
};

module.exports = mongoose.model("Notification", notificationSchema);