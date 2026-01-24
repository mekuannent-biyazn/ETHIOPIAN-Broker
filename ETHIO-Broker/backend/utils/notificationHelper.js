// utils/notificationHelper.js
const Notification = require("../models/notificationModel");

/**
 * Create a notification for a user
 * @param {Object} data - Notification data
 * @param {String} data.recipient - User ID of the recipient
 * @param {String} data.title - Notification title
 * @param {String} data.message - Notification message
 * @param {String} data.type - Notification type
 * @param {Object} data.data - Additional data
 * @param {String} data.sender - User ID of the sender (optional)
 * @param {String} data.priority - Priority level (optional)
 */
const createNotification = async (data) => {
    try {
        const notification = await Notification.create(data);
        console.log(`✅ Notification created: ${notification.title} for user ${data.recipient}`);
        return notification;
    } catch (error) {
        console.error("❌ Error creating notification:", error);
        throw error;
    }
};

/**
 * Create multiple notifications
 * @param {Array} notifications - Array of notification data objects
 */
const createBulkNotifications = async (notifications) => {
    try {
        const createdNotifications = await Notification.insertMany(notifications);
        console.log(`✅ ${createdNotifications.length} notifications created`);
        return createdNotifications;
    } catch (error) {
        console.error("❌ Error creating bulk notifications:", error);
        throw error;
    }
};

/**
 * Create notification for property order
 */
const createPropertyOrderNotification = async (userId, propertyTitle, orderId) => {
    return await createNotification({
        recipient: userId,
        title: "Property Order Confirmed",
        message: `Your order for "${propertyTitle}" has been confirmed. Order ID: ${orderId}`,
        type: "property_order",
        data: { orderId, propertyTitle },
        priority: "medium"
    });
};

/**
 * Create notification for payment completion
 */
const createPaymentCompletedNotification = async (userId, amount, propertyTitle, paymentId) => {
    return await createNotification({
        recipient: userId,
        title: "Payment Completed",
        message: `Your payment of ETB ${amount} for "${propertyTitle}" has been completed successfully.`,
        type: "payment_completed",
        data: { paymentId, amount, propertyTitle },
        priority: "high"
    });
};

/**
 * Create notification for commission earned
 */
const createCommissionEarnedNotification = async (brokerId, amount, propertyTitle, commissionType) => {
    return await createNotification({
        recipient: brokerId,
        title: "Commission Earned",
        message: `You earned ETB ${amount} commission from ${commissionType} for "${propertyTitle}".`,
        type: "commission_earned",
        data: { amount, propertyTitle, commissionType },
        priority: "high"
    });
};

/**
 * Create notification for property assignment
 */
const createPropertyAssignmentNotification = async (brokerId, propertyTitle, propertyId) => {
    return await createNotification({
        recipient: brokerId,
        title: "New Property Assignment",
        message: `You have been assigned a new property: "${propertyTitle}".`,
        type: "property_assigned",
        data: { propertyId, propertyTitle },
        priority: "medium"
    });
};

/**
 * Create notification for new message
 */
const createMessageNotification = async (recipientId, senderName, conversationId) => {
    return await createNotification({
        recipient: recipientId,
        title: "New Message",
        message: `You have a new message from ${senderName}.`,
        type: "message_received",
        data: { conversationId, senderName },
        priority: "medium"
    });
};

/**
 * Create notification for property approval/rejection
 */
const createPropertyStatusNotification = async (ownerId, propertyTitle, status, reason = null) => {
    let title, message, type;

    if (status === "approved") {
        title = "Property Approved";
        message = `Your property "${propertyTitle}" has been approved and is now available for listing.`;
        type = "property_approved";
    } else if (status === "rejected") {
        title = "Property Rejected";
        message = `Your property "${propertyTitle}" has been rejected. ${reason ? `Reason: ${reason}` : ""}`;
        type = "property_rejected";
    } else if (status === "pending_approval") {
        title = "New Property Pending Approval";
        message = reason || `A new property "${propertyTitle}" has been submitted and is pending approval.`;
        type = "property_order";
    }

    return await createNotification({
        recipient: ownerId,
        title,
        message,
        type,
        data: { propertyTitle, status, reason },
        priority: status === "rejected" ? "high" : "medium"
    });
};

/**
 * Create notification for user registration (for admin)
 */
const createUserRegistrationNotification = async (adminId, userName, userRole) => {
    return await createNotification({
        recipient: adminId,
        title: "New User Registration",
        message: `A new ${userRole} "${userName}" has registered and is pending verification.`,
        type: "user_registered",
        data: { userName, userRole },
        priority: "low"
    });
};

/**
 * Create system notification for all users of a specific role
 */
const createSystemNotificationForRole = async (role, title, message, data = {}) => {
    const User = require("../models/userModel");

    try {
        const users = await User.find({ role }, "_id");
        const notifications = users.map(user => ({
            recipient: user._id,
            title,
            message,
            type: "system_update",
            data,
            priority: "medium"
        }));

        return await createBulkNotifications(notifications);
    } catch (error) {
        console.error("❌ Error creating system notifications:", error);
        throw error;
    }
};

module.exports = {
    createNotification,
    createBulkNotifications,
    createPropertyOrderNotification,
    createPaymentCompletedNotification,
    createCommissionEarnedNotification,
    createPropertyAssignmentNotification,
    createMessageNotification,
    createPropertyStatusNotification,
    createUserRegistrationNotification,
    createSystemNotificationForRole
};