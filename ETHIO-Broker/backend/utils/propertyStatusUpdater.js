// utils/propertyStatusUpdater.js
const Property = require("../models/propertyModel");
const Payment = require("../models/paymentModel");
const {
    createPaymentCompletedNotification,
    createCommissionEarnedNotification
} = require("./notificationHelper");

/**
 * Centralized function to update property status after successful payment
 * This ensures consistent property status updates across all payment flows
 */
const updatePropertyStatusAfterPayment = async (paymentId, options = {}) => {
    const {
        skipCommissions = false,
        skipNotifications = false,
        forceUpdate = false
    } = options;

    console.log("🔄 Starting centralized property status update for payment:", paymentId);

    try {
        // Find payment with all necessary populated fields
        const payment = await Payment.findById(paymentId)
            .populate("property")
            .populate("user")
            .populate("broker")
            .populate("assignedBroker");

        if (!payment) {
            throw new Error(`Payment not found: ${paymentId}`);
        }

        console.log("✅ Payment found:", {
            paymentId: payment._id,
            status: payment.paymentStatus,
            type: payment.paymentType,
            amount: payment.amount,
            propertyId: payment.property?._id
        });

        // Validate payment is completed
        if (payment.paymentStatus !== "Completed") {
            throw new Error(`Payment not completed. Current status: ${payment.paymentStatus}`);
        }

        // Get property with admin-assigned broker
        const property = await Property.findById(payment.property._id)
            .populate("assignedBroker", "fname lname email phone")
            .populate("owner", "fname lname email");

        if (!property) {
            throw new Error(`Property not found: ${payment.property._id}`);
        }

        console.log("🏠 Property details:", {
            propertyId: property._id,
            title: property.title,
            currentStatus: property.status,
            purpose: property.purpose,
            assignedBroker: property.assignedBroker?._id,
            owner: property.owner?._id
        });

        let statusUpdated = false;
        let commissionsCreated = false;

        // Update property status for full payments only
        if (payment.paymentType === "full_payment") {
            const newStatus = property.purpose === "Sell" ? "Sold" : "Rented";

            // Only update if status is different or force update is requested
            if (property.status !== newStatus || forceUpdate) {
                console.log(`🔄 Updating property status from ${property.status} to ${newStatus}`);

                const oldStatus = property.status;
                property.status = newStatus;

                // Set current buyer/renter
                if (property.purpose === "Sell") {
                    property.currentBuyer = payment.user._id;
                } else {
                    property.currentRenter = payment.user._id;
                }

                // Clear order info since transaction is complete
                property.orderInfo = undefined;

                // Update last modified timestamp
                property.updatedAt = new Date();

                // Save with validation disabled to avoid any schema issues
                await property.save({ validateBeforeSave: false });
                statusUpdated = true;

                console.log("✅ Property status updated successfully:", {
                    propertyId: property._id,
                    oldStatus: oldStatus,
                    newStatus: property.status,
                    buyer: property.currentBuyer,
                    renter: property.currentRenter
                });

                // Verify the update was successful
                const verifyProperty = await Property.findById(property._id);
                if (verifyProperty.status !== newStatus) {
                    console.error("❌ Property status update verification failed!");
                    throw new Error(`Property status update failed. Expected: ${newStatus}, Got: ${verifyProperty.status}`);
                }
                console.log("✅ Property status update verified");
            } else {
                console.log("ℹ️ Property status already correct:", property.status);
            }
        } else if (payment.paymentType === "booking_fee") {
            // For booking fees, ensure property remains ordered with payment completed flag
            if (property.status !== "Ordered" || !property.orderInfo?.paymentCompleted) {
                property.status = "Ordered";
                if (!property.orderInfo) {
                    property.orderInfo = {};
                }
                property.orderInfo.paymentCompleted = true;
                await property.save();
                statusUpdated = true;
                console.log("✅ Booking fee payment recorded, property remains ordered");
            }
        }

        // Handle commissions for full payments (only if not already created)
        if (!skipCommissions && payment.paymentType === "full_payment" && property.assignedBroker) {
            console.log("🔄 Processing commissions for admin-assigned broker...");

            // Check if commission payments already exist
            const existingCommissions = await Payment.find({
                "metadata.originalPaymentId": payment._id.toString(),
                paymentType: "broker_commission"
            });

            if (existingCommissions.length === 0) {
                commissionsCreated = await createCommissionPayments(payment, property);
            } else {
                console.log("ℹ️ Commission payments already exist:", existingCommissions.length);
            }
        }

        // Send notifications
        if (!skipNotifications) {
            await sendPaymentNotifications(payment, property, commissionsCreated);
        }

        console.log("✅ Property status update completed successfully:", {
            paymentId: payment._id,
            propertyId: property._id,
            statusUpdated,
            commissionsCreated,
            finalStatus: property.status
        });

        return {
            success: true,
            statusUpdated,
            commissionsCreated,
            property: {
                id: property._id,
                status: property.status,
                title: property.title
            },
            payment: {
                id: payment._id,
                status: payment.paymentStatus,
                amount: payment.amount
            }
        };

    } catch (error) {
        console.error("❌ Error in centralized property status update:", error);

        // Log detailed error information
        console.error("❌ Error details:", {
            paymentId,
            error: error.message,
            stack: error.stack
        });

        throw error; // Re-throw to let caller handle
    }
};

/**
 * Create commission payments for admin-assigned broker
 * Broker receives commission from BOTH buyer (2%) and seller (2%) = 4% total
 */
const createCommissionPayments = async (payment, property) => {
    try {
        const assignedBroker = property.assignedBroker;

        if (!assignedBroker) {
            console.log("⚠️ No admin-assigned broker found, skipping commission creation");
            return false;
        }

        // Calculate commission amounts - from BOTH buyer and seller sides
        const buyerCommission = payment.buyerCommission || Math.round(property.price * 0.02);
        const sellerCommission = payment.sellerCommission || Math.round(property.price * 0.02);
        const totalBrokerCommission = buyerCommission + sellerCommission;
        const ownerReceives = property.price - sellerCommission; // Owner gets price minus seller commission

        console.log("💰 Creating broker commission payment (from both sides):", {
            assignedBroker: assignedBroker._id,
            brokerName: `${assignedBroker.fname} ${assignedBroker.lname}`,
            buyerCommission,
            sellerCommission,
            totalBrokerCommission,
            ownerReceives
        });

        const commissionDueDate = new Date();
        commissionDueDate.setDate(commissionDueDate.getDate() + 7);

        // Create ONE broker commission payment (combining both buyer and seller commissions)
        const brokerCommissionPayment = await Payment.create({
            property: property._id,
            user: payment.user._id,
            amount: totalBrokerCommission, // Total commission from both sides
            currency: "ETB",
            paymentType: "broker_commission",
            paymentMethod: "Chapa",
            paymentStatus: "Completed",
            paymentDate: new Date(),
            dueDate: commissionDueDate,
            chapaReference: `broker-comm-${payment.chapaReference}-${Date.now()}`,
            commissionAmount: totalBrokerCommission,
            buyerCommission: buyerCommission,
            sellerCommission: sellerCommission,
            totalCommissionAmount: totalBrokerCommission,
            broker: assignedBroker._id,
            assignedBroker: assignedBroker._id,
            isCommissionPayment: true,
            metadata: {
                propertyTitle: property.title,
                role: "broker",
                brokerName: `${assignedBroker.fname} ${assignedBroker.lname}`,
                brokerEmail: assignedBroker.email,
                commissionPercentage: 4, // 2% from buyer + 2% from seller
                buyerCommissionPercentage: 2,
                sellerCommissionPercentage: 2,
                originalPaymentId: payment._id.toString(),
                paidInMainTransaction: true,
                automaticallyDeducted: true,
                assignedBrokerId: assignedBroker._id.toString(),
                assignedBrokerName: `${assignedBroker.fname} ${assignedBroker.lname}`,
                assignmentType: "admin_assigned",
                source: "buyer_and_seller",
                displayName: "Broker Commission (Buyer 2% + Seller 2%)"
            }
        });

        // Update property commission tracking (total from both sides)
        property.totalCommissionReceived = (property.totalCommissionReceived || 0) + totalBrokerCommission;
        await property.save();

        console.log("✅ Broker commission payment created successfully:", {
            brokerCommissionId: brokerCommissionPayment._id,
            totalCommission: totalBrokerCommission,
            breakdown: `Buyer: ${buyerCommission}, Seller: ${sellerCommission}`
        });

        return true;

    } catch (error) {
        console.error("❌ Error creating broker commission payment:", error);
        throw error;
    }
};

/**
 * Send payment completion and commission notifications
 */
const sendPaymentNotifications = async (payment, property, commissionsCreated) => {
    try {
        console.log("📧 Sending payment notifications...");

        // Send payment completion notification to buyer
        await createPaymentCompletedNotification(
            payment.user._id,
            payment.amount,
            property.title,
            payment._id
        );

        // Send commission notifications to broker if commissions were created
        if (commissionsCreated && property.assignedBroker) {
            const buyerCommission = payment.buyerCommission || Math.round(property.price * 0.02);
            const sellerCommission = payment.sellerCommission || Math.round(property.price * 0.02);
            const totalCommission = buyerCommission + sellerCommission;

            if (totalCommission > 0) {
                await createCommissionEarnedNotification(
                    property.assignedBroker._id,
                    totalCommission,
                    property.title,
                    "broker commission (2% buyer + 2% seller)"
                );
            }
        }

        console.log("✅ Notifications sent successfully");

    } catch (error) {
        console.error("❌ Error sending notifications:", error);
        // Don't throw - notifications are not critical for payment processing
    }
};

/**
 * Retry mechanism for failed property status updates
 */
const retryPropertyStatusUpdate = async (paymentId, maxRetries = 3) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for payment: ${paymentId}`);

            const result = await updatePropertyStatusAfterPayment(paymentId, {
                forceUpdate: attempt > 1 // Force update on retries
            });

            console.log(`✅ Retry attempt ${attempt} successful`);
            return result;

        } catch (error) {
            lastError = error;
            console.error(`❌ Retry attempt ${attempt} failed:`, error.message);

            if (attempt < maxRetries) {
                // Wait before retrying (exponential backoff)
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
};

module.exports = {
    updatePropertyStatusAfterPayment,
    retryPropertyStatusUpdate,
    createCommissionPayments,
    sendPaymentNotifications
};