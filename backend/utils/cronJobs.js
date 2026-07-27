// utils/cronJobs.js
const dotenv = require('dotenv');
dotenv.config();
const cron = require("node-cron");
const Property = require("../models/propertyModel");
const Payment = require("../models/paymentModel");
const { autoVerifyPendingPayments } = require("../jobs/autoVerifyPayments");

// Flag to prevent concurrent executions
let isExpiryCheckRunning = false;

const checkAndExpirePayments = async () => {
  // Prevent concurrent executions
  if (isExpiryCheckRunning) {
    console.log("⏳ Payment expiry check already running, skipping...");
    return;
  }

  isExpiryCheckRunning = true;

  try {
    const now = new Date();

    // Log for development
    if (process.env.NODE_ENV !== 'production') {
      console.log('🕒 Running payment expiry check at', now.toISOString());
    }

    // Method 1: Find and expire overdue payments
    const expiredPayments = await Payment.find({
      paymentStatus: "Pending",
      dueDate: { $lt: now },
    }).populate("property");

    let expiredCount = 0;
    let resetPropertiesCount = 0;

    for (const payment of expiredPayments) {
      // Mark payment as expired
      payment.paymentStatus = "Expired";
      await payment.save();
      expiredCount++;

      // Reset property if it's in ordered state
      if (payment.property && payment.property.status === "Ordered") {
        await Property.findByIdAndUpdate(payment.property._id, {
          status: "Available",
          $unset: {
            orderInfo: "",
            currentBuyer: "",
            currentRenter: "",
          },
        });
        resetPropertiesCount++;
      }
    }

    // Method 2: Also check properties directly for 72-hour expiry
    const expiredProperties = await Property.find({
      status: "Ordered",
      "orderInfo.paymentDeadline": { $lt: now },
      "orderInfo.paymentStatus": "Pending"
    });

    for (const property of expiredProperties) {
      // Reset property to available
      property.status = "Available";
      property.orderInfo = undefined;
      property.currentBuyer = undefined;
      property.currentRenter = undefined;
      await property.save();
      resetPropertiesCount++;

      console.log(`🔄 Property ${property.title} reset to available after 72-hour expiry`);
    }

    // Log results
    if (expiredCount > 0 || resetPropertiesCount > 0) {
      console.log(`✅ Cron job: ${expiredCount} payments expired, ${resetPropertiesCount} properties reset`);
    } else if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Cron job: No expired payments found');
    }

  } catch (error) {
    console.error('❌ Cron job error:', error.message);
  } finally {
    isExpiryCheckRunning = false;
  }
};

// Schedule the cron job
const scheduleCron = () => {
  // 1. Run payment expiry check every 10 minutes
  cron.schedule("*/10 * * * *", checkAndExpirePayments);
  console.log('🕒 Payment expiry cron job scheduled (runs every 10 minutes)');

  // 2. Run automatic payment verification every 5 minutes (reduced from 1 minute)
  cron.schedule("*/5 * * * *", autoVerifyPendingPayments);
  console.log('🔍 Auto payment verification cron job scheduled (runs every 5 minutes)');

  // Run immediately on startup for development
  if (process.env.NODE_ENV === "development") {
    console.log('🔧 Development mode: Running initial checks');
    setTimeout(() => {
      checkAndExpirePayments();
      autoVerifyPendingPayments();
    }, 5000); // Wait 5 seconds after startup
  }
};

module.exports = { scheduleCron, checkAndExpirePayments, autoVerifyPendingPayments };