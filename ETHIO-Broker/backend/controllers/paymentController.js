// controllers/paymentController.js
const Property = require("../models/propertyModel");
const Payment = require("../models/paymentModel");
const User = require("../models/userModel");
const {
  generateChapaPaymentUrl,
  verifyChapaTransaction,
} = require("../utils/chapaPayment");
const {
  updatePropertyStatusAfterPayment,
  retryPropertyStatusUpdate
} = require("../utils/propertyStatusUpdater");
const mongoose = require("mongoose");

// @desc    Initialize payment for property order WITH AUTOMATIC COMMISSION DEDUCTION
// @route   POST /api/payments/initialize
// @access  Private
exports.initializePayment = async (req, res) => {
  try {
    const { propertyId, paymentType = "full_payment" } = req.body;

    console.log("💰 Payment initialization request:", {
      propertyId,
      paymentType,
      userId: req.user._id,
      userEmail: req.user.email,
    });

    // ✅ Validate required fields
    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: "Property ID is required",
      });
    }

    // ✅ Validate paymentType
    const validPaymentTypes = ["full_payment", "booking_fee"];
    if (!validPaymentTypes.includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment type. Must be 'full_payment' or 'booking_fee'",
      });
    }

    // ✅ Find property with complete population
    const property = await Property.findById(propertyId)
      .populate("assignedBroker", "fname lname email phone")
      .populate("owner", "fname lname email phone")
      .populate("orderInfo.orderedBy", "fname lname email phone");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    console.log("✅ Property found:", {
      propertyId: property._id,
      title: property.title,
      status: property.status,
      owner: property.owner?._id,
      orderedBy: property.orderInfo?.orderedBy?._id,
    });

    // ✅ CRITICAL: Verify that the current user is the one who ordered this property
    if (!property.orderInfo || !property.orderInfo.orderedBy) {
      return res.status(403).json({
        success: false,
        message: "This property has not been ordered yet",
      });
    }

    if (
      property.orderInfo.orderedBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Not authorized to pay for this property. You are not the one who ordered it.",
        details: {
          orderedBy: property.orderInfo.orderedBy._id,
          currentUser: req.user._id,
        },
      });
    }

    // ✅ Check if property is in ordered state
    if (property.status !== "Ordered") {
      return res.status(400).json({
        success: false,
        message:
          "Property is not in ordered state. Please order the property first.",
        currentStatus: property.status,
      });
    }

    // ✅ Check if payment is already completed for this property
    const existingCompletedPayment = await Payment.findOne({
      property: propertyId,
      user: req.user._id,
      paymentStatus: "Completed",
    });

    if (existingCompletedPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment already completed for this property",
        data: {
          paymentId: existingCompletedPayment._id,
          completedAt: existingCompletedPayment.paymentDate,
        },
      });
    }

    // ✅ CRITICAL: Check if broker is assigned by admin
    if (!property.assignedBroker) {
      return res.status(400).json({
        success: false,
        message: "No broker assigned to this property. Cannot process payment.",
      });
    }

    const assignedBroker = property.assignedBroker;
    console.log("✅ Admin-assigned broker for commission:", {
      brokerId: assignedBroker._id,
      brokerName: `${assignedBroker.fname} ${assignedBroker.lname}`,
      brokerEmail: assignedBroker.email,
      assignedBy: "Admin",
    });

    // ✅ UPDATED COMMISSION CALCULATION: Only buyer pays commission, owner gets full amount
    let baseAmount = property.price;
    if (paymentType === "booking_fee") {
      const bookingFeePercentage = property.bookingFeePercentage || 10;
      baseAmount = Math.round(property.price * (bookingFeePercentage / 100));
    }

    // Calculate commission (2% from buyer + 2% from seller = 4% total for broker)
    const buyerCommission = Math.round(baseAmount * 0.02); // 2% from buyer/renter
    const sellerCommission = Math.round(baseAmount * 0.02); // 2% from seller/owner

    // ✅ BUYER PAYS: Base Amount + Buyer Commission
    const totalAmount = baseAmount + buyerCommission;

    // ✅ PROPERTY OWNER RECEIVES: Base Amount - Seller Commission (2% deducted)
    const ownerReceives = baseAmount - sellerCommission;

    console.log("💰 UPDATED COMMISSION Payment Breakdown:", {
      propertyPrice: property.price,
      baseAmount: baseAmount,
      buyerCommission: buyerCommission, // Paid by buyer
      sellerCommission: sellerCommission, // No seller commission
      totalAmount: totalAmount, // What buyer pays
      ownerReceives: ownerReceives, // What owner gets (full amount)
      brokerGets: buyerCommission, // Only buyer commission to broker
      assignedBroker: assignedBroker._id,
      assignedBrokerName: `${assignedBroker.fname} ${assignedBroker.lname}`,
      propertyOwner: property.owner._id,
      assignmentType: "Admin-Assigned",
    });

    // ✅ Check for existing pending payment
    const existingPendingPayment = await Payment.findOne({
      property: propertyId,
      user: req.user._id,
      paymentStatus: "Pending",
    });

    if (existingPendingPayment && existingPendingPayment.paymentUrl) {
      console.log(
        "✅ Existing pending payment found:",
        existingPendingPayment._id
      );

      // Update the existing payment with latest amounts
      existingPendingPayment.amount = totalAmount;
      existingPendingPayment.paymentType = paymentType;
      existingPendingPayment.buyerCommission = buyerCommission;
      existingPendingPayment.sellerCommission = sellerCommission;
      existingPendingPayment.ownerReceives = ownerReceives;
      existingPendingPayment.totalCommissionAmount =
        buyerCommission + sellerCommission;
      
      // Update the payment URL with proper return URL parameters
      const updatedChapaData = {
        amount: totalAmount,
        currency: "ETB",
        email: user.email,
        first_name: user.fname,
        last_name: user.lname,
        phone_number: user.phone || "0912345678",
        tx_ref: existingPendingPayment.chapaReference,
        callback_url: `${process.env.SERVER_URL}/api/payments/webhook`,
        return_url: `${process.env.CLIENT_URL}/payment/verify?property_id=${propertyId}&tx_ref=${existingPendingPayment.chapaReference}&amount=${totalAmount}&payment_id=${existingPendingPayment._id}`,
        customization: {
          title: "ETHIO Broker",
          description: `Payment for ${property.title}`,
        },
      };

      const updatedChapaResponse = await generateChapaPaymentUrl(updatedChapaData);
      if (updatedChapaResponse && updatedChapaResponse.checkout_url) {
        existingPendingPayment.paymentUrl = updatedChapaResponse.checkout_url;
      }

      await existingPendingPayment.save();

      return res.status(200).json({
        success: true,
        message: "Using existing pending payment",
        data: {
          paymentUrl: existingPendingPayment.paymentUrl,
          paymentId: existingPendingPayment._id,
          amount: existingPendingPayment.amount,
          dueDate: existingPendingPayment.dueDate,
          transactionReference: existingPendingPayment.chapaReference,
          paymentType: existingPendingPayment.paymentType,
          propertyTitle: property.title,
          propertyId: property._id,
          paymentBreakdown: {
            propertyAmount: baseAmount,
            buyerCommission: buyerCommission,
            sellerCommission: sellerCommission,
            totalAmount: totalAmount,
            ownerReceives: ownerReceives,
            brokerGets: buyerCommission + sellerCommission,
            assignedBrokerName: `${assignedBroker.fname} ${assignedBroker.lname}`,
            assignmentType: "Admin-Assigned Broker",
            note: `Property owner will receive ${ownerReceives} ETB (after 2% commission deduction). Commission goes to admin-assigned broker: ${assignedBroker.fname} ${assignedBroker.lname}`,
          },
        },
      });
    }

    // ✅ Get user details for payment
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Generate unique transaction reference
    const txRef = `ethio-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // ✅ Calculate due date
    const paymentDeadline = property.paymentDeadline || 7;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + paymentDeadline);

    let payment;
    const finalChapaReference = txRef;

    if (existingPendingPayment) {
      // ✅ Update existing pending payment
      payment = await Payment.findByIdAndUpdate(
        existingPendingPayment._id,
        {
          amount: totalAmount,
          paymentType: paymentType,
          dueDate: dueDate,
          chapaReference: finalChapaReference,
          buyerCommission: buyerCommission,
          sellerCommission: sellerCommission,
          ownerReceives: ownerReceives,
          totalCommissionAmount: buyerCommission + sellerCommission,
          broker: assignedBroker._id,
          assignedBroker: assignedBroker._id,
          metadata: {
            ...existingPendingPayment.metadata,
            commissionIncluded: true,
            assignedBrokerId: assignedBroker._id.toString(),
            assignedBrokerName: `${assignedBroker.fname} ${assignedBroker.lname}`,
            assignmentType: "admin_assigned",
            paymentBreakdown: {
              propertyAmount: baseAmount,
              buyerCommission: buyerCommission,
              sellerCommission: sellerCommission,
              totalAmount: totalAmount,
              ownerReceives: ownerReceives,
              brokerGets: buyerCommission + sellerCommission,
              assignedBroker: `${assignedBroker.fname} ${assignedBroker.lname}`,
              assignmentType: "Admin-Assigned",
            },
          },
        },
        { new: true }
      );
    } else {
      // ✅ Create new payment with automatic commission deduction
      payment = await Payment.create({
        property: propertyId,
        user: req.user._id,
        amount: totalAmount, // Total paid by buyer
        paymentType: paymentType,
        paymentMethod: "Chapa",
        paymentStatus: "Pending",
        dueDate: dueDate,
        chapaReference: finalChapaReference,
        buyerCommission: buyerCommission,
        sellerCommission: sellerCommission,
        ownerReceives: ownerReceives, // What owner actually gets
        totalCommissionAmount: buyerCommission + sellerCommission,
        broker: assignedBroker._id,
        assignedBroker: assignedBroker._id,
        isCommissionPayment: false,
        metadata: {
          propertyTitle: property.title,
          propertyType: property.propertyType,
          purpose: property.purpose,
          paymentType: paymentType,
          commissionIncluded: true,
          automaticDeduction: true,
          assignedBrokerId: assignedBroker._id.toString(),
          assignedBrokerName: `${assignedBroker.fname} ${assignedBroker.lname}`,
          propertyOwnerId: property.owner._id.toString(),
          propertyOwnerName: `${property.owner.fname} ${property.owner.lname}`,
          orderedById: property.orderInfo.orderedBy._id.toString(),
          orderedByName: `${property.orderInfo.orderedBy.fname} ${property.orderInfo.orderedBy.lname}`,
          assignmentType: "admin_assigned",
          paymentBreakdown: {
            propertyAmount: baseAmount,
            buyerCommission: buyerCommission,
            sellerCommission: sellerCommission,
            totalAmount: totalAmount,
            ownerReceives: ownerReceives,
            brokerGets: buyerCommission + sellerCommission,
            assignedBrokerName: `${assignedBroker.fname} ${assignedBroker.lname}`,
            propertyOwnerName: `${property.owner.fname} ${property.owner.lname}`,
            orderedByName: `${property.orderInfo.orderedBy.fname} ${property.orderInfo.orderedBy.lname}`,
            assignmentType: "Admin-Assigned Broker",
          },
        },
      });
    }

    // ✅ Generate Chapa payment URL with total amount (including buyer commission) - AFTER payment is created
    const chapaData = {
      amount: totalAmount, // Buyer pays total (property + buyer commission)
      currency: "ETB",
      email: user.email,
      first_name: user.fname,
      last_name: user.lname,
      phone_number: user.phone || "0912345678",
      tx_ref: txRef,
      callback_url: `${process.env.SERVER_URL}/api/payments/webhook`,
      return_url: `${process.env.CLIENT_URL}/payment/verify?property_id=${propertyId}&tx_ref=${txRef}&amount=${totalAmount}&payment_id=${payment._id}`,
      customization: {
        title: "ETHIO Broker",
        description: `Payment for ${property.title}`,
      },
      metadata: {
        propertyId: propertyId.toString(),
        paymentType: paymentType,
        userId: req.user._id.toString(),
        assignedBrokerId: assignedBroker._id.toString(), // Store admin-assigned broker ID
        commissionIncluded: true,
        assignmentType: "admin_assigned", // Mark as admin-assigned
        baseAmount: baseAmount,
        buyerCommission: buyerCommission,
        sellerCommission: sellerCommission,
        totalAmount: totalAmount,
      },
    };

    console.log("🔄 Calling Chapa with AUTO COMMISSION DEDUCTION...");
    console.log("📦 Chapa request data:", {
      tx_ref: chapaData.tx_ref,
      amount: chapaData.amount,
      email: chapaData.email,
      assignedBrokerId: assignedBroker._id.toString(),
      assignmentType: "admin_assigned",
    });

    const chapaResponse = await generateChapaPaymentUrl(chapaData);

    if (!chapaResponse || !chapaResponse.checkout_url) {
      console.error("❌ Chapa response error:", chapaResponse);
      throw new Error("Failed to generate payment URL from Chapa");
    }

    console.log("✅ Chapa response received:", {
      tx_ref: chapaResponse.tx_ref || txRef,
      checkout_url: chapaResponse.checkout_url ? "Received" : "Missing",
      assignedBrokerId: assignedBroker._id.toString(),
    });

    // ✅ Update payment with Chapa response
    payment.chapaReference = chapaResponse.tx_ref || txRef;
    payment.paymentUrl = chapaResponse.checkout_url;
    await payment.save();
    // ✅ Update property with payment reference
    if (!property.orderInfo.paymentId) {
      property.orderInfo.paymentId = payment._id;
      await property.save();
    }

    console.log("✅ Payment with AUTO COMMISSION DEDUCTION generated:", {
      paymentId: payment._id,
      totalPaid: totalAmount,
      ownerReceives: ownerReceives,
      brokerGets: buyerCommission + sellerCommission,
      assignedBroker: assignedBroker._id,
      assignedBrokerName: `${assignedBroker.fname} ${assignedBroker.lname}`,
      chapaReference: payment.chapaReference,
      assignmentType: "Admin-Assigned",
      paymentUrl: payment.paymentUrl,
    });

    // ✅ Return success response with payment details
    res.status(200).json({
      success: true,
      message:
        "Payment URL generated successfully (commission automatically deducted)",
      data: {
        paymentUrl: payment.paymentUrl,
        paymentId: payment._id,
        amount: totalAmount,
        dueDate: payment.dueDate,
        transactionReference: payment.chapaReference,
        paymentType: paymentType,
        propertyTitle: property.title,
        propertyId: property._id,
        paymentBreakdown: {
          propertyAmount: baseAmount,
          buyerCommission: buyerCommission,
          sellerCommission: sellerCommission,
          totalAmount: totalAmount,
          ownerReceives: ownerReceives,
          brokerGets: buyerCommission + sellerCommission,
          assignedBrokerName: `${assignedBroker.fname} ${assignedBroker.lname}`,
          commissionPercentage: 2,
          assignmentType: "Admin-Assigned Broker",
          note: `Property owner will automatically receive ${ownerReceives} ETB (after 2% commission deduction). Commission goes to admin-assigned broker: ${assignedBroker.fname} ${assignedBroker.lname}`,
        },
      },
    });
  } catch (error) {
    console.error("❌ Initialize payment with auto commission error:", error);

    // ✅ Handle specific Chapa errors
    if (error.message.includes("Chapa") || error.message.includes("payment")) {
      return res.status(500).json({
        success: false,
        message: "Payment gateway error. Please try again later.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while generating payment URL",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Verify payment callback from Chapa
// @route   GET/POST /api/payments/verify
// @access  Public (Chapa callback)
exports.verifyPayment = async (req, res) => {
  try {
    console.log("🔍 Payment verification received:", {
      method: req.method,
      query: req.query,
      body: req.body,
      url: req.originalUrl,
    });

    // ✅ IMPROVED: Extract parameters from both GET and POST requests correctly
    let status, tx_ref;

    if (req.method === "GET") {
      // GET request - parameters come from URL query string
      // Chapa typically sends: ?trx_ref=xxx&status=success
      status = req.query.status || req.query.Status; // Handle different capitalizations
      tx_ref =
        req.query.tx_ref ||
        req.query.trx_ref ||
        req.query.trxRef ||
        req.query.Tx_ref;

      console.log("📥 GET URL Search Params:", req.url);
      console.log("📥 GET Parsed Query:", req.query);
      console.log("📥 GET Extracted:", { status, tx_ref });
    } else {
      // POST request - parameters come from JSON body
      status = req.body.status || req.body.Status;
      tx_ref = req.body.tx_ref || req.body.trx_ref;

      console.log("📥 POST Body:", req.body);
      console.log("📥 POST Extracted:", { status, tx_ref });
    }

    // ✅ IMPROVED: Debug raw URL for GET requests
    if (req.method === "GET") {
      console.log("🔍 GET Request Details:");
      console.log(
        "- Full URL:",
        req.protocol + "://" + req.get("host") + req.originalUrl
      );
      console.log("- Raw Query String:", require("url").parse(req.url).query);
    }

    // ✅ IMPROVED: Handle all possible Chapa status values
    const isSuccess =
      status &&
      (status.toLowerCase() === "success" ||
        status.toLowerCase() === "paid" ||
        status.toLowerCase() === "completed" ||
        status.toLowerCase() === "true");

    console.log("🎯 Status Analysis:", {
      originalStatus: status,
      isSuccess: isSuccess,
      tx_ref: tx_ref,
    });

    let payment;

    // ✅ IMPROVED: First try to find payment by chapaReference
    if (tx_ref) {
      console.log("🔍 Searching for payment with chapaReference:", tx_ref);
      payment = await Payment.findOne({ chapaReference: tx_ref })
        .populate("property")
        .populate("user");
    }

    // ✅ FALLBACK: If not found by reference, find most recent pending payment
    if (!payment) {
      console.log("🔍 Falling back to recent pending payment search...");
      payment = await Payment.findOne({
        paymentStatus: "Pending",
      })
        .populate("property")
        .populate("user")
        .sort({ createdAt: -1 });
    }

    if (!payment) {
      console.error("❌ No pending payments found");

      if (req.method === "GET") {
        return res.redirect(
          `${process.env.CLIENT_URL}/payment/error?message=No+pending+payments+found`
        );
      }

      return res.status(404).json({
        success: false,
        message: "No pending payments found",
      });
    }

    console.log("✅ Found payment:", {
      paymentId: payment._id,
      chapaReference: payment.chapaReference,
      currentStatus: payment.paymentStatus,
      amount: payment.amount,
      propertyId: payment.property?._id,
    });

    // ✅ IMPROVED: Handle payment based on success status
    if (isSuccess) {
      // Check if already completed
      if (payment.paymentStatus === "Completed") {
        console.log("ℹ️ Payment already completed");

        if (req.method === "GET") {
          return res.redirect(
            `${process.env.CLIENT_URL}/payment/success?payment_id=${payment._id}&already_completed=true`
          );
        }

        return res.status(200).json({
          success: true,
          message: "Payment already completed successfully",
        });
      }

      // ✅ FIXED: Update payment status to Completed
      payment.paymentStatus = "Completed";
      payment.paymentDate = new Date();

      // Update chapaReference if it was missing or different
      if (tx_ref && payment.chapaReference !== tx_ref) {
        console.log(
          "🔄 Updating chapaReference from:",
          payment.chapaReference,
          "to:",
          tx_ref
        );
        payment.chapaReference = tx_ref;
      }

      // Set transaction ID
      if (!payment.chapaTransactionId) {
        payment.chapaTransactionId = `chapa-txn-${Date.now()}`;
      }

      await payment.save();
      console.log("✅ Payment marked as COMPLETED");

      // ✅ NEW: Use centralized property status updater
      try {
        const updateResult = await updatePropertyStatusAfterPayment(payment._id);
        console.log("✅ Property status updated via centralized function:", updateResult);
      } catch (updateError) {
        console.error("❌ Error updating property status:", updateError);
        // Don't fail the payment verification, but log the error
        console.log("⚠️ Payment completed but property status update failed - will retry via webhook");
      }

      // Handle response based on request method
      if (req.method === "GET") {
        return res.redirect(
          `${process.env.CLIENT_URL}/payment/success?payment_id=${payment._id}&amount=${payment.amount}&property_id=${payment.property._id}`
        );
      }

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: {
          paymentId: payment._id,
          propertyId: payment.property._id,
          status: "Completed",
          amount: payment.amount,
        },
      });
    } else {
      // Payment failed or status not provided
      console.log("❌ Payment failed or status not recognized:", status);

      // Only mark as failed if it's still pending AND we have a clear failure status
      const isExplicitFailure =
        status &&
        (status.toLowerCase() === "failed" ||
          status.toLowerCase() === "cancelled" ||
          status.toLowerCase() === "false");

      if (payment.paymentStatus === "Pending" && isExplicitFailure) {
        payment.paymentStatus = "Failed";
        await payment.save();
        console.log(
          "❌ Payment marked as FAILED due to explicit failure status"
        );
      } else if (payment.paymentStatus === "Pending" && !status) {
        console.log("ℹ️ No status provided, keeping payment as Pending");
        // Don't change status if no status is provided
      } else {
        console.log("ℹ️ Payment status already set to:", payment.paymentStatus);
      }

      if (req.method === "GET") {
        // For GET without clear status, redirect to pending status page
        if (!status) {
          return res.redirect(
            `${process.env.CLIENT_URL}/payment/pending?payment_id=${payment._id}`
          );
        }
        return res.redirect(
          `${process.env.CLIENT_URL}/payment/error?payment_id=${payment._id}&status=failed&message=Payment+failed+or+cancelled`
        );
      }

      return res.status(400).json({
        success: false,
        message: "Payment failed or cancelled",
        data: {
          paymentId: payment._id,
          status: "Failed",
          receivedStatus: status,
        },
      });
    }
  } catch (error) {
    console.error("❌ Payment verification error:", error);

    if (req.method === "GET") {
      return res.redirect(
        `${process.env.CLIENT_URL}/payment/error?message=Server+error+during+verification`
      );
    }

    res.status(500).json({
      success: false,
      message: "Server error during payment verification",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Webhook for Chapa payment notifications - FIXED FOR ADMIN-ASSIGNED BROKER
// @route   POST /api/payments/webhook
// @access  Public (Chapa webhook)
exports.paymentWebhook = async (req, res) => {
  try {
    console.log("🔔 Payment webhook received:", req.body);
    console.log("🌐 Webhook URL working! ngrok tunnel is successful!");
    console.log("📊 Request headers:", req.headers);

    const { tx_ref, status } = req.body;

    if (!tx_ref) {
      console.log("❌ Webhook: No transaction reference provided");
      return res.status(400).json({
        success: false,
        message: "Transaction reference required",
      });
    }

    console.log("🔍 Webhook searching for payment with tx_ref:", tx_ref);

    // Find payment by chapaReference and populate necessary fields
    const payment = await Payment.findOne({ chapaReference: tx_ref })
      .populate("property")
      .populate("user")
      .populate("broker");

    if (!payment) {
      console.error("❌ Webhook: Payment not found for tx_ref:", tx_ref);
      return res.status(404).json({
        success: false,
        message: "Payment not found for this transaction reference",
      });
    }

    console.log("✅ Webhook: Main payment found:", {
      paymentId: payment._id,
      currentStatus: payment.paymentStatus,
      totalAmount: payment.amount,
      buyerCommission: payment.buyerCommission,
      sellerCommission: payment.sellerCommission,
      ownerReceives: payment.ownerReceives,
      paymentType: payment.paymentType,
      commissionIncluded: payment.metadata?.commissionIncluded,
      brokerId: payment.broker?._id,
      assignedBrokerId: payment.assignedBroker?._id,
      metadata: payment.metadata,
    });

    // Map Chapa status to our Payment model status
    let paymentStatus;
    if (
      status &&
      (status.toLowerCase() === "success" ||
        status.toLowerCase() === "completed" ||
        status.toLowerCase() === "paid")
    ) {
      paymentStatus = "Completed";
    } else if (
      status &&
      (status.toLowerCase() === "failed" ||
        status.toLowerCase() === "cancelled")
    ) {
      paymentStatus = "Failed";
    } else {
      paymentStatus = "Pending";
    }

    console.log("🎯 Status Mapping:", {
      chapaStatus: status,
      ourStatus: paymentStatus,
    });

    let propertyUpdateResult = null;

    if (paymentStatus === "Completed") {
      // Update main payment status if needed
      if (payment.paymentStatus !== "Completed") {
        payment.paymentStatus = "Completed";
        payment.paymentDate = new Date();
        await payment.save();
        console.log("✅ Main payment marked as Completed");
      }

      // ✅ NEW: Use centralized property status updater with retry mechanism
      try {
        console.log("🔄 Using centralized property status updater...");
        propertyUpdateResult = await retryPropertyStatusUpdate(payment._id);
        console.log("✅ Property status updated successfully via centralized function:", propertyUpdateResult);
      } catch (updateError) {
        console.error("❌ Failed to update property status after retries:", updateError);
        // Continue processing but log the failure
        propertyUpdateResult = {
          success: false,
          error: updateError.message
        };
      }
    } else {
      // Update payment status for failed or pending payments
      if (payment.paymentStatus !== paymentStatus) {
        payment.paymentStatus = paymentStatus;
        await payment.save();
        console.log(`✅ Payment status updated to: ${paymentStatus}`);
      }
    }

    console.log("✅ Webhook processing completed:", {
      paymentStatus: paymentStatus,
      propertyUpdateSuccess: propertyUpdateResult?.success || false,
      statusUpdated: propertyUpdateResult?.statusUpdated || false,
      commissionsCreated: propertyUpdateResult?.commissionsCreated || false,
    });

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      data: {
        paymentId: payment._id,
        status: payment.paymentStatus,
        propertyUpdate: propertyUpdateResult,
      },
    });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(200).json({
      success: false,
      message: "Webhook processing failed but acknowledged",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Manual payment verification by payment ID (for frontend polling)
// @route   POST /api/payments/manual-verify
// @access  Private
exports.manualVerifyByPaymentId = async (req, res) => {
  try {
    const { paymentId } = req.body;

    console.log("🔍 Manual verification by payment ID:", paymentId);

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required"
      });
    }

    const payment = await Payment.findById(paymentId)
      .populate("property")
      .populate("user");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // Check if user is authorized
    if (payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to verify this payment"
      });
    }

    // If already completed, return current status
    if (payment.paymentStatus === "Completed") {
      return res.json({
        success: true,
        message: "Payment already completed",
        data: {
          status: "Completed",
          payment: payment,
          property: payment.property,
        }
      });
    }

    // Try to verify with Chapa if we have a reference
    if (payment.chapaReference) {
      try {
        const verification = await verifyChapaTransaction(payment.chapaReference);

        if (verification.status === "success" && verification.data.status === "success") {
          // Update payment status
          payment.paymentStatus = "Completed";
          payment.paymentDate = new Date();
          payment.chapaTransactionId = verification.data.id;
          await payment.save();

          // ✅ NEW: Use centralized property status updater
          try {
            const updateResult = await updatePropertyStatusAfterPayment(payment._id);
            console.log("✅ Manual verification: Property status updated via centralized function:", updateResult);

            return res.json({
              success: true,
              message: "Payment verified and completed successfully",
              data: {
                status: "Completed",
                payment: payment,
                property: payment.property,
                updateResult: updateResult
              }
            });
          } catch (updateError) {
            console.error("❌ Manual verification: Property status update failed:", updateError);

            return res.json({
              success: true,
              message: "Payment completed but property status update failed",
              data: {
                status: "Completed",
                payment: payment,
                property: payment.property,
                error: updateError.message
              }
            });
          }
        }
      } catch (chapaError) {
        console.error("❌ Chapa verification failed:", chapaError);
      }
    }

    // If verification failed or no reference, return current status
    return res.json({
      success: false,
      message: "Payment verification failed or still pending",
      data: {
        status: payment.paymentStatus,
        payment: payment,
      }
    });

  } catch (error) {
    console.error("❌ Manual verification error:", error);
    res.status(500).json({
      success: false,
      message: "Error during manual verification",
      error: error.message
    });
  }
};

// @desc    Manual payment verification (for frontend polling)
// @route   GET /api/payments/verify/:tx_ref
// @access  Private
exports.manualVerifyPayment = async (req, res) => {
  try {
    const { tx_ref } = req.params;

    const payment = await Payment.findOne({ chapaReference: tx_ref })
      .populate("property")
      .populate("user");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Check if user is authorized to view this payment
    if (payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this payment",
      });
    }

    // If payment is already verified, return current status
    if (payment.paymentStatus === "Completed") {
      return res.json({
        success: true,
        data: {
          status: "Completed",
          payment: payment,
          property: payment.property,
        },
      });
    }

    // Verify with Chapa
    const verification = await verifyChapaTransaction(tx_ref);

    if (
      verification.status === "success" &&
      verification.data.status === "success"
    ) {
      payment.paymentStatus = "Completed";
      payment.paymentDate = new Date();
      payment.chapaTransactionId = verification.data.id;
      await payment.save();

      // Update property status
      const property = await Property.findById(payment.property._id);
      if (property && payment.paymentType === "full_payment") {
        property.status = property.purpose === "Sell" ? "Sold" : "Rented";
        property.orderInfo = undefined;
        await property.save();
      }

      return res.json({
        success: true,
        data: {
          status: "Completed",
          payment: payment,
          property: payment.property,
        },
      });
    } else {
      return res.json({
        success: false,
        data: {
          status: "Pending",
          payment: payment,
        },
      });
    }
  } catch (error) {
    console.error("Manual verification error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message,
    });
  }
};

// Enhanced version with better error handling
exports.getPaymentStatus = async (req, res) => {
  try {
    console.log("🔍 Fetching payment status for:", req.params.paymentId);

    // Validate payment ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.paymentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID format",
      });
    }

    const payment = await Payment.findById(req.params.paymentId)
      .populate("property", "title purpose propertyType status images")
      .populate("user", "fname lname email");

    if (!payment) {
      console.log("❌ Payment not found:", req.params.paymentId);
      return res.status(404).json({
        success: false,
        message: "Payment not found with the provided ID",
      });
    }

    console.log("✅ Payment found:", {
      paymentId: payment._id,
      userId: payment.user?._id,
      currentUser: req.user._id,
    });

    // Enhanced authorization check
    const isAuthorized =
      (payment.user &&
        payment.user._id.toString() === req.user._id.toString()) ||
      req.user.role === "admin";

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this payment",
      });
    }

    // Handle expired payments
    if (payment.paymentStatus === "Pending" && new Date() > payment.dueDate) {
      console.log("🕒 Payment expired, updating status...");
      payment.paymentStatus = "Expired";
      await payment.save();

      // Reset associated property
      if (payment.property && payment.property.status === "Payment_Pending") {
        await Property.findByIdAndUpdate(payment.property._id, {
          status: "Available",
          $unset: {
            orderInfo: "",
            currentBuyer: "",
            currentRenter: "",
          },
        });
        console.log("🔄 Property reset to available");
      }
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("❌ Get payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching payment status",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get user's payments
// @route   GET /api/payments/user/my-payments
// @access  Private
exports.getMyPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, includeCommissions = 'false' } = req.query;

    let filter = { user: req.user._id };
    if (status) filter.paymentStatus = status;
    
    // By default, exclude commission payments unless explicitly requested
    if (includeCommissions !== 'true') {
      filter.paymentType = { $ne: 'broker_commission' };
    }

    const payments = await Payment.find(filter)
      .populate("property", "title images purpose propertyType city status")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        payments,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    console.error("Get my payments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching payments",
      error: error.message,
    });
  }
};

// Even more robust version
exports.cancelPayment = async (req, res) => {
  try {
    const paymentId = req.params.paymentId;

    console.log("🔄 Cancelling payment:", paymentId);

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    // First, find the payment without population to see raw data
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    console.log("📋 Raw payment data:", {
      paymentId: payment._id,
      rawUserId: payment.user, // This shows the actual user ID stored
      status: payment.paymentStatus,
    });

    // Check if the payment belongs to the current user
    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this payment",
      });
    }

    if (payment.paymentStatus !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending payments can be cancelled",
      });
    }

    // Update payment directly without population
    const updatedPayment = await Payment.findByIdAndUpdate(
      paymentId,
      { paymentStatus: "Cancelled" },
      { new: true }
    );

    console.log("✅ Payment cancelled successfully");

    // Reset property status
    if (payment.property) {
      const property = await Property.findById(payment.property);
      if (property && property.status === "Payment_Pending") {
        await Property.findByIdAndUpdate(payment.property, {
          status: "Ordered",
          $unset: {
            "orderInfo.paymentId": "",
          },
        });
        console.log("🔄 Property reset to Ordered state");
      }
    }

    res.json({
      success: true,
      message: "Payment cancelled successfully",
      data: {
        paymentId: updatedPayment._id,
        status: updatedPayment.paymentStatus,
      },
    });
  } catch (error) {
    console.error("❌ Cancel payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling payment",
      error: error.message,
    });
  }
};

// @desc    Reset payment status for testing
// @route   PATCH /api/payments/:paymentId/reset
// @access  Private (Admin/Dev)
exports.resetPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status = "Pending" } = req.body;

    console.log("🔄 Resetting payment status:", { paymentId, status });

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Validate status
    const validStatuses = [
      "Pending",
      "Completed",
      "Failed",
      "Cancelled",
      "Expired",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    payment.paymentStatus = status;
    await payment.save();

    console.log("✅ Payment status reset to:", status);

    res.json({
      success: true,
      message: `Payment status reset to ${status}`,
      data: {
        paymentId: payment._id,
        newStatus: payment.paymentStatus,
      },
    });
  } catch (error) {
    console.error("❌ Reset payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting payment status",
      error: error.message,
    });
  }
};

// @desc    Get commission earnings for broker - FIXED FOR ADMIN-ASSIGNED BROKERS
// @route   GET /api/payments/commission/broker
// @access  Private
exports.getBrokerCommissions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const brokerId = new mongoose.Types.ObjectId(req.user._id);

    console.log("💰 Getting commissions for admin-assigned broker:", brokerId);

    // ✅ FIXED: Query by both broker and assignedBroker fields to catch all scenarios
    let filter = {
      $or: [{ broker: brokerId }, { assignedBroker: brokerId }],
      paymentType: "broker_commission",
    };

    // Handle status filter
    if (status && status !== "all" && status !== "undefined") {
      filter.paymentStatus = status;
    }

    console.log("🔍 Broker commissions filter:", {
      brokerId: brokerId,
      filter: filter,
      status: status || "all",
    });

    // Get commissions with proper population
    const commissions = await Payment.find(filter)
      .populate(
        "property",
        "title images purpose propertyType city price assignedBroker"
      )
      .populate("user", "fname lname email phone")
      .populate("broker", "fname lname email phone")
      .populate("assignedBroker", "fname lname email phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Payment.countDocuments(filter);

    console.log(
      "✅ Found commissions for admin-assigned broker:",
      commissions.length
    );

    // Calculate totals using aggregation
    const earningsAggregation = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$paymentStatus",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate totals from aggregation
    let totalEarnings = 0;
    let pendingEarnings = 0;

    earningsAggregation.forEach((item) => {
      if (item._id === "Completed") {
        totalEarnings = item.totalAmount;
      } else if (item._id === "Pending") {
        pendingEarnings = item.totalAmount;
      }
    });

    // Get commission breakdown by role
    const roleBreakdown = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$metadata.role",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("📊 Commission breakdown for admin-assigned broker:", {
      totalEarnings,
      pendingEarnings,
      roleBreakdown,
      brokerId: brokerId,
    });

    res.status(200).json({
      success: true,
      data: {
        commissions: commissions.map((commission) => ({
          _id: commission._id,
          property: commission.property,
          user: commission.user,
          amount: Math.round(commission.amount || 0),
          paymentType: commission.paymentType,
          paymentMethod: commission.paymentMethod,
          paymentStatus: commission.paymentStatus,
          paymentDate: commission.paymentDate,
          dueDate: commission.dueDate,
          commissionAmount: Math.round(commission.commissionAmount || 0),
          buyerCommission: Math.round(commission.buyerCommission || 0),
          sellerCommission: Math.round(commission.sellerCommission || 0),
          totalCommissionAmount: Math.round(commission.totalCommissionAmount || 0),
          broker: commission.broker,
          assignedBroker: commission.assignedBroker,
          isCommissionPayment: commission.isCommissionPayment,
          metadata: commission.metadata,
          createdAt: commission.createdAt,
          updatedAt: commission.updatedAt,
          // Add assignment info for clarity
          assignmentInfo: {
            isAdminAssigned:
              commission.metadata?.assignmentType === "admin_assigned",
            assignedBrokerName: commission.metadata?.assignedBrokerName,
            source: commission.metadata?.source,
          },
        })),
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        totalEarnings: Math.round(totalEarnings),
        pendingEarnings: Math.round(pendingEarnings),
        totalPotentialEarnings: Math.round(totalEarnings + pendingEarnings),
        breakdown: {
          byStatus: earningsAggregation,
          byRole: roleBreakdown,
        },
        brokerInfo: {
          brokerId: brokerId,
          assignmentType: "Admin-Assigned Properties Only",
        },
      },
    });
  } catch (error) {
    console.error("❌ Get broker commissions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching commissions",
      error: error.message,
    });
  }
};

// @desc    Get commission summary for broker dashboard
// @route   GET /api/payments/commission/broker/summary
// @access  Private (Broker only)
exports.getBrokerCommissionSummary = async (req, res) => {
  try {
    if (req.user.role !== "broker") {
      return res.status(403).json({
        success: false,
        message: "Broker access required",
      });
    }

    const brokerId = new mongoose.Types.ObjectId(req.user._id);

    console.log("💰 Getting commission summary for broker:", {
      brokerId: brokerId,
      brokerName: `${req.user.fname} ${req.user.lname}`,
      role: req.user.role
    });

    // ✅ FIXED: Query by both broker and assignedBroker fields to catch admin-assigned commissions
    const brokerFilter = {
      $or: [{ broker: brokerId }, { assignedBroker: brokerId }],
      paymentType: "broker_commission",
    };

    console.log("🔍 Broker commission filter:", brokerFilter);

    // Get total completed commissions
    const completedCommissions = await Payment.aggregate([
      {
        $match: {
          ...brokerFilter,
          paymentStatus: "Completed",
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    // Get pending commissions
    const pendingCommissions = await Payment.aggregate([
      {
        $match: {
          ...brokerFilter,
          paymentStatus: "Pending",
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    // Get failed commissions
    const failedCommissions = await Payment.aggregate([
      {
        $match: {
          ...brokerFilter,
          paymentStatus: "Failed",
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    // Get commission breakdown by role (buyer/seller)
    const roleBreakdown = await Payment.aggregate([
      {
        $match: {
          ...brokerFilter,
          paymentStatus: "Completed",
        },
      },
      {
        $group: {
          _id: "$metadata.role",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get monthly earnings for the last 6 months
    const monthlyEarnings = await Payment.aggregate([
      {
        $match: {
          ...brokerFilter,
          paymentStatus: "Completed",
          paymentDate: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$paymentDate" },
            month: { $month: "$paymentDate" },
          },
          totalAmount: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Get recent commissions (last 5)
    const recentCommissions = await Payment.find(brokerFilter)
      .populate("property", "title propertyType images city")
      .populate("user", "fname lname email phone")
      .sort({ paymentDate: -1 })
      .limit(5)
      .lean();

    // Get top properties by commission
    const topProperties = await Payment.aggregate([
      {
        $match: {
          ...brokerFilter,
          paymentStatus: "Completed",
        },
      },
      {
        $group: {
          _id: "$property",
          totalCommission: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalCommission: -1 },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: "properties",
          localField: "_id",
          foreignField: "_id",
          as: "property",
        },
      },
      {
        $unwind: "$property",
      },
    ]);

    const totalEarnings = completedCommissions[0]?.totalAmount || 0;
    const pendingEarnings = pendingCommissions[0]?.totalAmount || 0;
    const failedEarnings = failedCommissions[0]?.totalAmount || 0;
    const totalCompletedTransactions =
      completedCommissions[0]?.totalTransactions || 0;
    const totalPendingTransactions =
      pendingCommissions[0]?.totalTransactions || 0;
    const totalFailedTransactions =
      failedCommissions[0]?.totalTransactions || 0;

    console.log("📊 Commission summary results:", {
      brokerId: brokerId,
      totalEarnings: totalEarnings,
      pendingEarnings: pendingEarnings,
      totalCompletedTransactions: totalCompletedTransactions,
      totalPendingTransactions: totalPendingTransactions,
      recentCommissionsCount: recentCommissions.length,
      topPropertiesCount: topProperties.length
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalEarnings: Math.round(totalEarnings),
          pendingEarnings: Math.round(pendingEarnings),
          failedEarnings: Math.round(failedEarnings),
          totalPotentialEarnings: Math.round(totalEarnings + pendingEarnings),
          totalCompletedTransactions,
          totalPendingTransactions,
          totalFailedTransactions,
          totalTransactions:
            totalCompletedTransactions +
            totalPendingTransactions +
            totalFailedTransactions,
          averageCommission:
            totalCompletedTransactions > 0
              ? Math.round(totalEarnings / totalCompletedTransactions)
              : 0,
        },
        breakdown: {
          byRole: roleBreakdown,
          monthlyEarnings,
          topProperties,
        },
        recentCommissions,
        performance: {
          successRate:
            totalCompletedTransactions > 0
              ? (totalCompletedTransactions /
                (totalCompletedTransactions + totalFailedTransactions)) *
              100
              : 0,
          monthlyGrowth: calculateMonthlyGrowth(monthlyEarnings),
        },
      },
    });
  } catch (error) {
    console.error("❌ Get broker commission summary error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching commission summary",
      error: error.message,
    });
  }
};

// Helper function to calculate monthly growth
const calculateMonthlyGrowth = (monthlyEarnings) => {
  if (monthlyEarnings.length < 2) return 0;

  const currentMonth =
    monthlyEarnings[monthlyEarnings.length - 1]?.totalAmount || 0;
  const previousMonth =
    monthlyEarnings[monthlyEarnings.length - 2]?.totalAmount || 0;

  if (previousMonth === 0) return currentMonth > 0 ? 100 : 0;

  return ((currentMonth - previousMonth) / previousMonth) * 100;
};

// @desc    Get payment summary for client dashboard
// @route   GET /api/payments/client/summary
// @access  Private (Client only)
exports.getClientPaymentSummary = async (req, res) => {
  try {
    const clientId = new mongoose.Types.ObjectId(req.user._id);

    // Get all payments made by client
    const allPayments = await Payment.aggregate([
      {
        $match: {
          user: clientId,
          paymentType: { $in: ["full_payment", "booking_fee"] },
        },
      },
      {
        $group: {
          _id: "$paymentStatus",
          totalAmount: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    // Get completed payments with property details
    const completedPayments = await Payment.aggregate([
      {
        $match: {
          user: clientId,
          paymentType: { $in: ["full_payment", "booking_fee"] },
          paymentStatus: "Completed",
        },
      },
      {
        $lookup: {
          from: "properties",
          localField: "property",
          foreignField: "_id",
          as: "property",
        },
      },
      {
        $unwind: "$property",
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$amount" },
          propertiesPurchased: { $sum: 1 },
          averagePayment: { $avg: "$amount" },
        },
      },
    ]);

    // Get recent payments
    const recentPayments = await Payment.find({
      user: clientId,
      paymentType: { $in: ["full_payment", "booking_fee"] },
    })
      .populate("property", "title propertyType images city price purpose")
      .populate("broker", "fname lname email phone")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get payment breakdown by type
    const paymentTypeBreakdown = await Payment.aggregate([
      {
        $match: {
          user: clientId,
          paymentType: { $in: ["full_payment", "booking_fee"] },
        },
      },
      {
        $group: {
          _id: "$paymentType",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get monthly spending for last 6 months
    const monthlySpending = await Payment.aggregate([
      {
        $match: {
          user: clientId,
          paymentType: { $in: ["full_payment", "booking_fee"] },
          paymentStatus: "Completed",
          paymentDate: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$paymentDate" },
            month: { $month: "$paymentDate" },
          },
          totalAmount: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const summary = completedPayments[0] || {
      totalSpent: 0,
      propertiesPurchased: 0,
      averagePayment: 0,
    };

    // Calculate status breakdown
    const statusBreakdown = {
      completed: allPayments.find((p) => p._id === "Completed") || {
        totalAmount: 0,
        totalTransactions: 0,
      },
      pending: allPayments.find((p) => p._id === "Pending") || {
        totalAmount: 0,
        totalTransactions: 0,
      },
      failed: allPayments.find((p) => p._id === "Failed") || {
        totalAmount: 0,
        totalTransactions: 0,
      },
    };

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSpent: Math.round(summary.totalSpent),
          propertiesPurchased: summary.propertiesPurchased,
          averagePayment: Math.round(summary.averagePayment),
          totalTransactions:
            statusBreakdown.completed.totalTransactions +
            statusBreakdown.pending.totalTransactions +
            statusBreakdown.failed.totalTransactions,
        },
        statusBreakdown,
        paymentTypeBreakdown,
        monthlySpending,
        recentPayments,
        financialHealth: {
          successRate:
            statusBreakdown.completed.totalTransactions > 0
              ? (statusBreakdown.completed.totalTransactions /
                (statusBreakdown.completed.totalTransactions +
                  statusBreakdown.failed.totalTransactions)) *
              100
              : 0,
          spendingTrend: calculateSpendingTrend(monthlySpending),
        },
      },
    });
  } catch (error) {
    console.error("❌ Get client payment summary error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching payment summary",
      error: error.message,
    });
  }
};

// Helper function to calculate spending trend
const calculateSpendingTrend = (monthlySpending) => {
  if (monthlySpending.length < 2) return 0;

  const currentMonth =
    monthlySpending[monthlySpending.length - 1]?.totalAmount || 0;
  const previousMonth =
    monthlySpending[monthlySpending.length - 2]?.totalAmount || 0;

  if (previousMonth === 0) return currentMonth > 0 ? 100 : 0;

  return ((currentMonth - previousMonth) / previousMonth) * 100;
};

// @desc    Get comprehensive payment summary for admin dashboard
// @route   GET /api/payments/admin/summary
// @access  Private (Admin only)
exports.getAdminPaymentSummary = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    // Get overall platform statistics
    const platformStats = await Payment.aggregate([
      {
        $facet: {
          // Total payments statistics
          totalPayments: [
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$amount" },
                totalTransactions: { $sum: 1 },
              },
            },
          ],
          // Payment type breakdown
          paymentTypes: [
            {
              $group: {
                _id: "$paymentType",
                totalAmount: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ],
          // Status breakdown
          statusBreakdown: [
            {
              $group: {
                _id: "$paymentStatus",
                totalAmount: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ],
          // Commission statistics
          commissionStats: [
            {
              $match: {
                paymentType: "broker_commission",
              },
            },
            {
              $group: {
                _id: null,
                totalCommission: { $sum: "$amount" },
                totalCommissionTransactions: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    // Get broker performance statistics
    const brokerPerformance = await Payment.aggregate([
      {
        $match: {
          paymentType: "broker_commission",
          paymentStatus: "Completed",
        },
      },
      {
        $group: {
          _id: "$broker",
          totalCommission: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
          averageCommission: { $avg: "$amount" },
        },
      },
      {
        $sort: { totalCommission: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "broker",
        },
      },
      {
        $unwind: "$broker",
      },
    ]);

    // Get monthly platform revenue
    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          paymentStatus: "Completed",
          paymentDate: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$paymentDate" },
            month: { $month: "$paymentDate" },
          },
          totalRevenue: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Get recent high-value transactions
    const recentHighValuePayments = await Payment.find({
      paymentStatus: "Completed",
      amount: { $gte: 100000 }, // Payments above 100,000 ETB
    })
      .populate("property", "title propertyType city")
      .populate("user", "fname lname email")
      .populate("broker", "fname lname email")
      .sort({ amount: -1 })
      .limit(10)
      .lean();

    // Get property type performance
    const propertyTypePerformance = await Payment.aggregate([
      {
        $match: {
          paymentStatus: "Completed",
          paymentType: { $in: ["full_payment", "booking_fee"] },
        },
      },
      {
        $lookup: {
          from: "properties",
          localField: "property",
          foreignField: "_id",
          as: "property",
        },
      },
      {
        $unwind: "$property",
      },
      {
        $group: {
          _id: "$property.propertyType",
          totalRevenue: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
          averagePrice: { $avg: "$amount" },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    const stats = platformStats[0];
    const totalPayments = stats.totalPayments[0] || {
      totalAmount: 0,
      totalTransactions: 0,
    };
    const commissionStats = stats.commissionStats[0] || {
      totalCommission: 0,
      totalCommissionTransactions: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        platformOverview: {
          totalRevenue: Math.round(totalPayments.totalAmount),
          totalTransactions: totalPayments.totalTransactions,
          totalCommissionPaid: Math.round(commissionStats.totalCommission),
          totalCommissionTransactions:
            commissionStats.totalCommissionTransactions,
          averageTransactionValue:
            totalPayments.totalTransactions > 0
              ? Math.round(totalPayments.totalAmount / totalPayments.totalTransactions)
              : 0,
        },
        breakdown: {
          byPaymentType: stats.paymentTypes,
          byStatus: stats.statusBreakdown,
          byPropertyType: propertyTypePerformance,
        },
        brokerPerformance,
        monthlyRevenue,
        recentHighValuePayments,
        analytics: {
          successRate:
            totalPayments.totalTransactions > 0
              ? ((stats.statusBreakdown.find((s) => s._id === "Completed")
                ?.count || 0) /
                totalPayments.totalTransactions) *
              100
              : 0,
          commissionRate:
            totalPayments.totalAmount > 0
              ? Math.round((commissionStats.totalCommission / totalPayments.totalAmount) *
              100)
              : 0,
          monthlyGrowth: calculatePlatformGrowth(monthlyRevenue),
        },
      },
    });
  } catch (error) {
    console.error("❌ Get admin payment summary error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching admin summary",
      error: error.message,
    });
  }
};

// Helper function to calculate platform growth
const calculatePlatformGrowth = (monthlyRevenue) => {
  if (monthlyRevenue.length < 2) return 0;

  const currentMonth =
    monthlyRevenue[monthlyRevenue.length - 1]?.totalRevenue || 0;
  const previousMonth =
    monthlyRevenue[monthlyRevenue.length - 2]?.totalRevenue || 0;

  if (previousMonth === 0) return currentMonth > 0 ? 100 : 0;

  return ((currentMonth - previousMonth) / previousMonth) * 100;
};

// @desc    Get detailed broker commissions for admin
// @route   GET /api/payments/admin/broker-commissions
// @access  Private (Admin only)
exports.getAdminBrokerCommissions = async (req, res) => {
  try {
    const { page = 1, limit = 10, brokerId, status } = req.query;

    let filter = {
      paymentType: "broker_commission",
    };

    if (brokerId && brokerId !== "all") {
      filter.broker = new mongoose.Types.ObjectId(brokerId);
    }

    if (status && status !== "all") {
      filter.paymentStatus = status;
    }

    const commissions = await Payment.find(filter)
      .populate("property", "title propertyType city price")
      .populate("user", "fname lname email")
      .populate("broker", "fname lname email phone")
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Payment.countDocuments(filter);

    // Get broker list for filter
    const brokers = await User.find({ role: "broker" }, "fname lname email");

    res.status(200).json({
      success: true,
      data: {
        commissions,
        brokers,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    console.error("❌ Get admin broker commissions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching broker commissions",
      error: error.message,
    });
  }
};

// @desc    Get property owner's earnings from sold/rented properties
// @route   GET /api/payments/owner/earnings
// @access  Private
exports.getOwnerEarnings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, year, month } = req.query;

    console.log("💰 Getting earnings for property owner:", req.user._id);

    // Find all properties owned by this user that are sold/rented
    const propertiesFilter = {
      owner: req.user._id,
      status: { $in: ["Sold", "Rented"] },
    };

    // Add date filtering if provided
    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      propertiesFilter.updatedAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const properties = await Property.find(propertiesFilter)
      .populate("currentBuyer", "fname lname email phone")
      .populate("currentRenter", "fname lname email phone")
      .populate("assignedBroker", "fname lname email phone")
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalProperties = await Property.countDocuments(propertiesFilter);

    // Get property IDs for payment lookup
    const propertyIds = properties.map((p) => p._id);

    // Find payments where this user received money (as property owner)
    const paymentsFilter = {
      $or: [
        {
          property: { $in: propertyIds },
          paymentType: "full_payment",
          paymentStatus: "Completed",
        },
        {
          "metadata.propertyOwnerId": req.user._id.toString(),
          paymentType: "broker_commission",
          "metadata.role": "property_owner",
          paymentStatus: "Completed",
        },
      ],
    };

    const payments = await Payment.find(paymentsFilter)
      .populate("property", "title purpose propertyType images")
      .populate("user", "fname lname email")
      .sort({ paymentDate: -1 });

    // ✅ SIMPLIFIED: Calculate earnings from seller's perspective only
    const totalEarningsAgg = await Payment.aggregate([
      {
        $match: {
          property: { $in: propertyIds },
          paymentType: "full_payment",
          paymentStatus: "Completed",
        },
      },
      {
        $lookup: {
          from: "properties",
          localField: "property",
          foreignField: "_id",
          as: "propertyData"
        }
      },
      {
        $unwind: "$propertyData"
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$propertyData.price" }, // ✅ Property price (what property was worth)
          count: { $sum: 1 },
        },
      },
    ]);

    const totalEarnings = totalEarningsAgg.length > 0 ? totalEarningsAgg[0].totalEarnings : 0;
    const totalTransactions = totalEarningsAgg.length > 0 ? totalEarningsAgg[0].count : 0;

    // ✅ SIMPLIFIED: Commission paid = 2% of total earnings (seller's commission only)
    const totalCommissionPaid = Math.round(totalEarnings * 0.02);
    
    // ✅ SIMPLIFIED: Net earnings = total earnings - commission paid (always calculated, never from DB)
    const netEarnings = totalEarnings - totalCommissionPaid;
    const totalCommissionTransactions = totalTransactions; // Same transactions, just commission portion

    // ✅ SIMPLIFIED: Calculate monthly earnings from seller's perspective
    const monthlyEarnings = await Payment.aggregate([
      {
        $match: {
          property: { $in: propertyIds },
          paymentType: "full_payment",
          paymentStatus: "Completed",
          paymentDate: {
            $gte: new Date(new Date().getFullYear(), 0, 1), // Current year
          },
        },
      },
      {
        $lookup: {
          from: "properties",
          localField: "property",
          foreignField: "_id",
          as: "propertyData"
        }
      },
      {
        $unwind: "$propertyData"
      },
      {
        $group: {
          _id: {
            year: { $year: "$paymentDate" },
            month: { $month: "$paymentDate" },
          },
          totalEarnings: { $sum: "$propertyData.price" }, // ✅ Property price
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // ✅ SIMPLIFIED: Calculate earnings by property type from seller's perspective
    const earningsByType = await Payment.aggregate([
      {
        $match: {
          property: { $in: propertyIds },
          paymentType: "full_payment",
          paymentStatus: "Completed",
        },
      },
      {
        $lookup: {
          from: "properties",
          localField: "property",
          foreignField: "_id",
          as: "property",
        },
      },
      {
        $unwind: "$property",
      },
      {
        $group: {
          _id: "$property.propertyType",
          totalEarnings: { $sum: "$property.price" }, // ✅ Property price
          propertyCount: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        properties: properties.map((property) => ({
          _id: property._id,
          title: property.title,
          purpose: property.purpose,
          propertyType: property.propertyType,
          status: property.status,
          price: Math.round(property.price),
          images: property.images,
          soldRentedDate: property.updatedAt,
          buyer: property.currentBuyer,
          renter: property.currentRenter,
          broker: property.assignedBroker,
          city: property.city,
          // ✅ SIMPLIFIED: Calculate commission as 2% of property price
          totalEarnings: Math.round(property.price), // Property price
          commissionPaid: Math.round(property.price * 0.02), // 2% of property price
          netReceived: Math.round(property.price - (property.price * 0.02)), // Property price - 2% commission
        })),
        payments: payments.map((payment) => ({
          _id: payment._id,
          property: payment.property,
          amount: Math.round(payment.amount),
          paymentType: payment.paymentType,
          paymentStatus: payment.paymentStatus,
          paymentDate: payment.paymentDate,
          ownerReceives: Math.round(payment.ownerReceives || 0),
          sellerCommission: Math.round(payment.sellerCommission || 0),
          buyerCommission: Math.round(payment.buyerCommission || 0),
          metadata: payment.metadata,
          chapaReference: payment.chapaReference,
        })),
        earningsSummary: {
          totalPropertiesSoldRented: totalProperties,
          totalEarnings: Math.round(totalEarnings), // ✅ SIMPLIFIED: Property price (what property was worth)
          totalCommissionPaid: Math.round(totalCommissionPaid), // ✅ SIMPLIFIED: 2% of property price (what seller paid)
          netEarnings: Math.round(netEarnings), // ✅ SIMPLIFIED: Total earnings - commission paid
          totalTransactions: totalTransactions,
          totalCommissionTransactions: totalCommissionTransactions,
          averageCommissionRate:
            totalEarnings > 0
              ? Math.round((totalCommissionPaid / totalEarnings) * 100) // ✅ Always 2%
              : 0,
          averageEarningPerProperty:
            totalProperties > 0
              ? Math.round(totalEarnings / totalProperties) // ✅ Based on property price
              : 0,
          averageNetEarningPerProperty:
            totalProperties > 0
              ? Math.round(netEarnings / totalProperties) // ✅ Based on calculated net earnings
              : 0,
        },
        analytics: {
          monthlyEarnings,
          earningsByType,
        },
        total: totalProperties,
        totalPages: Math.ceil(totalProperties / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    console.error("❌ Get owner earnings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching owner earnings",
      error: error.message,
    });
  }
};

// @desc    Get detailed earnings for a specific property
// @route   GET /api/payments/owner/earnings/:propertyId
// @access  Private
exports.getPropertyEarningsDetail = async (req, res) => {
  try {
    const { propertyId } = req.params;

    console.log("💰 Getting detailed earnings for property:", propertyId);

    // Find the property
    const property = await Property.findById(propertyId)
      .populate("owner", "fname lname email phone")
      .populate("currentBuyer", "fname lname email phone")
      .populate("currentRenter", "fname lname email phone")
      .populate("assignedBroker", "fname lname email phone");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Check if user owns this property
    if (property.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view earnings for this property",
      });
    }

    // Find the main payment for this property
    const mainPayment = await Payment.findOne({
      property: propertyId,
      paymentType: "full_payment",
      paymentStatus: "Completed",
    });

    // Find commission payments for this property
    const commissionPayments = await Payment.find({
      property: propertyId,
      paymentType: "broker_commission",
    })
      .populate("user", "fname lname email")
      .populate("broker", "fname lname email");

    // Find all related payments for this property
    const allPropertyPayments = await Payment.find({
      property: propertyId,
      paymentStatus: "Completed",
    })
      .populate("user", "fname lname email")
      .populate("broker", "fname lname email")
      .sort({ paymentDate: -1 });

    // Calculate totals
    const totalCommission = commissionPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const netAmountReceived = mainPayment?.ownerReceives || 0;

    res.status(200).json({
      success: true,
      data: {
        property: {
          _id: property._id,
          title: property.title,
          purpose: property.purpose,
          propertyType: property.propertyType,
          status: property.status,
          originalPrice: property.price,
          soldRentedDate: property.updatedAt,
          buyer: property.currentBuyer,
          renter: property.currentRenter,
          broker: property.assignedBroker,
          description: property.description,
          city: property.city,
          location: property.location,
        },
        mainPayment: mainPayment
          ? {
            _id: mainPayment._id,
            totalAmount: mainPayment.amount,
            buyerCommission: mainPayment.buyerCommission,
            sellerCommission: mainPayment.sellerCommission,
            ownerReceives: mainPayment.ownerReceives,
            paymentDate: mainPayment.paymentDate,
            chapaReference: mainPayment.chapaReference,
            paymentMethod: mainPayment.paymentMethod,
          }
          : null,
        commissionPayments: commissionPayments.map((payment) => ({
          _id: payment._id,
          paidBy: payment.user,
          amount: payment.amount,
          role: payment.metadata?.role,
          paymentStatus: payment.paymentStatus,
          paymentDate: payment.paymentDate,
          commissionPercentage: payment.metadata?.commissionPercentage,
          broker: payment.broker,
          source: payment.metadata?.source,
        })),
        allPayments: allPropertyPayments.map((payment) => ({
          _id: payment._id,
          type: payment.paymentType,
          amount: payment.amount,
          status: payment.paymentStatus,
          date: payment.paymentDate,
          reference: payment.chapaReference,
          payer: payment.user,
          metadata: payment.metadata,
        })),
        earningsBreakdown: {
          originalPropertyPrice: property.price,
          totalCommissionDeducted: mainPayment?.sellerCommission || 0,
          netAmountReceived: netAmountReceived,
          totalCommissionPaid: totalCommission,
          commissionRate: "2%",
          transactionDate: mainPayment?.paymentDate || property.updatedAt,
          netProfit: netAmountReceived - totalCommission,
        },
      },
    });
  } catch (error) {
    console.error("❌ Get property earnings detail error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching property earnings detail",
      error: error.message,
    });
  }
};

// @desc    Manual property status fix for completed payments
// @route   POST /api/payments/fix-property-status
// @access  Private (Admin only)
exports.fixPropertyStatus = async (req, res) => {
  try {
    const { paymentId } = req.body;

    console.log("🔧 Manual property status fix requested for payment:", paymentId);

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can manually fix property status"
      });
    }

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required"
      });
    }

    // Find the payment
    const payment = await Payment.findById(paymentId)
      .populate("property")
      .populate("user");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (payment.paymentStatus !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Payment is not completed. Cannot fix property status for incomplete payments."
      });
    }

    console.log("🔧 Attempting to fix property status for completed payment:", {
      paymentId: payment._id,
      propertyId: payment.property._id,
      currentPropertyStatus: payment.property.status,
      paymentType: payment.paymentType
    });

    // Use centralized updater with force update
    try {
      const updateResult = await updatePropertyStatusAfterPayment(paymentId, {
        forceUpdate: true,
        skipCommissions: false, // Allow commission creation if missing
        skipNotifications: false
      });

      console.log("✅ Manual property status fix completed:", updateResult);

      return res.json({
        success: true,
        message: "Property status fixed successfully",
        data: updateResult
      });

    } catch (updateError) {
      console.error("❌ Manual property status fix failed:", updateError);

      return res.status(500).json({
        success: false,
        message: "Failed to fix property status",
        error: updateError.message
      });
    }

  } catch (error) {
    console.error("❌ Manual property status fix error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during property status fix",
      error: error.message
    });
  }
};

// @desc    Get payment and property status for debugging
// @route   GET /api/payments/debug/:paymentId
// @access  Private (Admin only)
exports.debugPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access debug information"
      });
    }

    const payment = await Payment.findById(paymentId)
      .populate("property")
      .populate("user", "fname lname email")
      .populate("broker", "fname lname email")
      .populate("assignedBroker", "fname lname email");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // Get related commission payments
    const commissionPayments = await Payment.find({
      "metadata.originalPaymentId": paymentId.toString(),
      paymentType: "broker_commission"
    });

    // Get property with full details
    const property = await Property.findById(payment.property._id)
      .populate("assignedBroker", "fname lname email")
      .populate("owner", "fname lname email")
      .populate("currentBuyer", "fname lname email")
      .populate("currentRenter", "fname lname email");

    const debugInfo = {
      payment: {
        id: payment._id,
        status: payment.paymentStatus,
        type: payment.paymentType,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        chapaReference: payment.chapaReference,
        metadata: payment.metadata
      },
      property: {
        id: property._id,
        title: property.title,
        status: property.status,
        purpose: property.purpose,
        price: property.price,
        owner: property.owner,
        assignedBroker: property.assignedBroker,
        currentBuyer: property.currentBuyer,
        currentRenter: property.currentRenter,
        orderInfo: property.orderInfo,
        totalCommissionReceived: property.totalCommissionReceived
      },
      commissions: commissionPayments.map(comm => ({
        id: comm._id,
        amount: comm.amount,
        status: comm.paymentStatus,
        broker: comm.broker,
        assignedBroker: comm.assignedBroker,
        metadata: comm.metadata
      })),
      analysis: {
        paymentCompleted: payment.paymentStatus === "Completed",
        propertyStatusCorrect: (payment.paymentType === "full_payment") ?
          (property.status === "Sold" || property.status === "Rented") :
          (property.status === "Ordered"),
        commissionsCreated: commissionPayments.length > 0,
        expectedCommissions: payment.paymentType === "full_payment" ? 2 : 0,
        actualCommissions: commissionPayments.length,
        hasAssignedBroker: !!property.assignedBroker
      }
    };

    res.json({
      success: true,
      message: "Debug information retrieved",
      data: debugInfo
    });

  } catch (error) {
    console.error("❌ Debug payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving debug information",
      error: error.message
    });
  }
};


// @desc    Bulk fix all completed payments with incorrect property status
// @route   POST /api/payments/bulk-fix-property-status
// @access  Private (Admin only)
exports.bulkFixPropertyStatus = async (req, res) => {
  try {
    console.log("🔧 Bulk property status fix requested by admin:", req.user._id);

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can perform bulk fixes"
      });
    }

    // Find all completed full payments
    const completedPayments = await Payment.find({
      paymentType: "full_payment",
      paymentStatus: "Completed"
    })
      .populate("property")
      .populate("user");

    console.log(`📊 Found ${completedPayments.length} completed full payments`);

    const results = {
      total: completedPayments.length,
      fixed: 0,
      alreadyCorrect: 0,
      failed: 0,
      errors: []
    };

    // Process each payment
    for (const payment of completedPayments) {
      try {
        if (!payment.property) {
          console.log(`⚠️ Payment ${payment._id} has no property, skipping`);
          results.failed++;
          results.errors.push({
            paymentId: payment._id,
            error: "No property associated"
          });
          continue;
        }

        const expectedStatus = payment.property.purpose === "Sell" ? "Sold" : "Rented";
        const currentStatus = payment.property.status;

        if (currentStatus === expectedStatus) {
          console.log(`✅ Payment ${payment._id}: Property already correct (${currentStatus})`);
          results.alreadyCorrect++;
          continue;
        }

        console.log(`🔧 Fixing payment ${payment._id}: ${currentStatus} -> ${expectedStatus}`);

        // Use centralized updater with force update
        const updateResult = await updatePropertyStatusAfterPayment(payment._id, {
          forceUpdate: true,
          skipCommissions: false,
          skipNotifications: true // Skip notifications for bulk fix
        });

        if (updateResult.success && updateResult.statusUpdated) {
          console.log(`✅ Fixed payment ${payment._id}`);
          results.fixed++;
        } else {
          console.log(`⚠️ Payment ${payment._id} processed but status not updated`);
          results.alreadyCorrect++;
        }

      } catch (error) {
        console.error(`❌ Failed to fix payment ${payment._id}:`, error.message);
        results.failed++;
        results.errors.push({
          paymentId: payment._id,
          propertyId: payment.property?._id,
          error: error.message
        });
      }
    }

    console.log("✅ Bulk fix completed:", results);

    res.json({
      success: true,
      message: "Bulk property status fix completed",
      data: results
    });

  } catch (error) {
    console.error("❌ Bulk fix error:", error);
    res.status(500).json({
      success: false,
      message: "Error during bulk fix",
      error: error.message
    });
  }
};


// @desc    Trigger automatic verification of pending payments (manual trigger)
// @route   POST /api/payments/trigger-auto-verify
// @access  Private (Admin only)
exports.triggerAutoVerify = async (req, res) => {
  try {
    console.log("🔧 Manual trigger of auto-verify requested by:", req.user._id);

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can trigger auto-verification"
      });
    }

    const { autoVerifyPendingPayments } = require("../jobs/autoVerifyPayments");

    const result = await autoVerifyPendingPayments();

    res.json({
      success: true,
      message: "Auto-verification completed",
      data: result
    });

  } catch (error) {
    console.error("❌ Manual auto-verify trigger error:", error);
    res.status(500).json({
      success: false,
      message: "Error triggering auto-verification",
      error: error.message
    });
  }
};


// @desc    Fix commission payments that only have buyer commission (should be buyer + seller)
// @route   POST /api/payments/fix-commissions
// @access  Private (Admin only)
exports.fixCommissionAmounts = async (req, res) => {
  try {
    console.log("🔧 Fix commission amounts requested by admin:", req.user._id);

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can fix commission amounts"
      });
    }

    // Find commission payments that only have buyer commission
    const incorrectCommissions = await Payment.find({
      paymentType: "broker_commission",
      paymentStatus: "Completed",
      $or: [
        { sellerCommission: 0 },
        { sellerCommission: { $exists: false } }
      ],
      buyerCommission: { $gt: 0 }
    });

    console.log(`📊 Found ${incorrectCommissions.length} commission(s) to fix`);

    const results = {
      total: incorrectCommissions.length,
      fixed: 0,
      failed: 0
    };

    for (const commission of incorrectCommissions) {
      try {
        // Calculate correct seller commission (same as buyer commission)
        const buyerCommission = commission.buyerCommission;
        const sellerCommission = buyerCommission;
        const correctTotalCommission = buyerCommission + sellerCommission;

        // Update the commission payment
        commission.amount = correctTotalCommission;
        commission.sellerCommission = sellerCommission;
        commission.totalCommissionAmount = correctTotalCommission;
        commission.commissionAmount = correctTotalCommission;

        // Update metadata
        if (!commission.metadata) {
          commission.metadata = {};
        }
        commission.metadata.commissionPercentage = 4;
        commission.metadata.buyerCommissionPercentage = 2;
        commission.metadata.sellerCommissionPercentage = 2;
        commission.metadata.source = "buyer_and_seller";
        commission.metadata.displayName = "Broker Commission (Buyer 2% + Seller 2%)";

        await commission.save();

        console.log(`✅ Fixed commission ${commission._id}: ${buyerCommission} -> ${correctTotalCommission}`);
        results.fixed++;

      } catch (error) {
        console.error(`❌ Failed to fix commission ${commission._id}:`, error.message);
        results.failed++;
      }
    }

    console.log("✅ Commission fix completed:", results);

    res.json({
      success: true,
      message: "Commission amounts fixed successfully",
      data: results
    });

  } catch (error) {
    console.error("❌ Fix commission amounts error:", error);
    res.status(500).json({
      success: false,
      message: "Error fixing commission amounts",
      error: error.message
    });
  }
};
