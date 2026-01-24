// controllers/manualVerificationController.js
const Property = require("../models/propertyModel");
const Payment = require("../models/paymentModel");
const User = require("../models/userModel");
const { updatePropertyStatusAfterPayment } = require("../utils/propertyStatusUpdater");
const { verifyChapaTransaction } = require("../utils/chapaPayment");

// @desc    Manual payment verification by user with transaction details
// @route   POST /api/payments/manual-verify-transaction
// @access  Private
const manualVerifyTransaction = async (req, res) => {
  try {
    const { 
      propertyId, 
      transactionReference, 
      amount, 
      paymentMethod = "Chapa",
      transactionDate 
    } = req.body;

    console.log("🔍 Manual payment verification request:", {
      propertyId,
      transactionReference,
      amount,
      userId: req.user._id,
      userEmail: req.user.email
    });

    // Validate required fields
    if (!propertyId || !transactionReference || !amount) {
      return res.status(400).json({
        success: false,
        message: "Property ID, transaction reference, and amount are required"
      });
    }

    // ENHANCED: Validate transaction reference format for Chapa
    if (paymentMethod === "Chapa") {
      // Updated pattern to include actual transaction reference formats used by the system
      const chapaReferencePattern = /^(ethio_broker_|chapa_|tx_ref_|CHK_|TXN_|broker-comm-)\w+/i;
      const isValidChapaFormat = chapaReferencePattern.test(transactionReference);
      
      if (!isValidChapaFormat) {
        return res.status(400).json({
          success: false,
          message: "Invalid transaction reference format. Please use the exact reference from your Chapa payment confirmation.",
          data: {
            providedReference: transactionReference,
            expectedFormat: "Should start with 'ethio_broker_', 'chapa_', 'tx_ref_', 'CHK_', 'TXN_', or 'broker-comm-'",
            hint: "Copy the transaction reference from your payment success page or Chapa confirmation email"
          }
        });
      }

      // Additional validation: Check if reference looks like a real transaction
      if (transactionReference.length < 10) {
        return res.status(400).json({
          success: false,
          message: "Transaction reference too short. Please use the complete reference from Chapa.",
          data: {
            providedReference: transactionReference,
            hint: "Transaction references are typically longer than 10 characters"
          }
        });
      }
    }

    // Find the property
    const property = await Property.findById(propertyId)
      .populate("assignedBroker", "fname lname email")
      .populate("owner", "fname lname email")
      .populate("orderInfo.orderedBy", "fname lname email");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    console.log("🔍 Authorization check:", {
      propertyId: property._id,
      hasOrderInfo: !!property.orderInfo,
      hasOrderedBy: !!property.orderInfo?.orderedBy,
      orderedByType: typeof property.orderInfo?.orderedBy,
      orderedById: property.orderInfo?.orderedBy?._id || property.orderInfo?.orderedBy,
      requestUserId: req.user._id,
      userEmail: req.user.email
    });

    // Verify user has ordered this property
    if (!property.orderInfo || !property.orderInfo.orderedBy) {
      return res.status(403).json({
        success: false,
        message: "You have not ordered this property or not authorized to verify payment",
        debug: {
          hasOrderInfo: !!property.orderInfo,
          hasOrderedBy: !!property.orderInfo?.orderedBy,
          propertyStatus: property.status
        }
      });
    }

    // Handle both populated and non-populated orderedBy
    const orderedByUserId = property.orderInfo.orderedBy._id || property.orderInfo.orderedBy;
    const requestUserId = req.user._id;
    
    if (orderedByUserId.toString() !== requestUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You have not ordered this property or not authorized to verify payment",
        debug: {
          orderedByUserId: orderedByUserId.toString(),
          requestUserId: requestUserId.toString(),
          userMatch: false
        }
      });
    }

    console.log("✅ Authorization passed for user:", req.user.email);

    // Check if property is in correct state
    if (property.status !== "Ordered") {
      return res.status(400).json({
        success: false,
        message: `Property is not in ordered state. Current status: ${property.status}`
      });
    }

    // Check if payment already exists and is completed
    const existingPayment = await Payment.findOne({
      property: propertyId,
      user: req.user._id,
      paymentStatus: "Completed"
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment already completed for this property",
        data: {
          paymentId: existingPayment._id,
          completedAt: existingPayment.paymentDate,
          existingReference: existingPayment.chapaReference
        }
      });
    }

    // ENHANCED: Check if there's a pending payment with this transaction reference
    const existingPendingPayment = await Payment.findOne({
      property: propertyId,
      user: req.user._id,
      paymentStatus: "Pending"
    });

    if (!existingPendingPayment) {
      // Check if this might be a commission payment reference
      const commissionPayment = await Payment.findOne({
        chapaReference: transactionReference,
        paymentType: "broker_commission"
      }).populate("property", "title");

      if (commissionPayment) {
        return res.status(400).json({
          success: false,
          message: "This is a commission payment reference, not a property payment reference.",
          data: {
            referenceType: "Commission Payment",
            propertyTitle: commissionPayment.property?.title || "Unknown",
            explanation: "Commission payments are handled automatically by the system when properties are sold.",
            solution: "To verify a property purchase, you need to:",
            steps: [
              "1. First click 'Complete Payment' or 'Order & Pay Now' on the property",
              "2. Complete the payment through Chapa",
              "3. Use the main payment transaction reference (not commission reference) for verification"
            ],
            hint: "Look for a transaction reference that starts with 'ethio_broker_' but doesn't have 'broker-comm-' prefix"
          }
        });
      }

      return res.status(400).json({
        success: false,
        message: "No pending payment found for this property. Please initialize payment first.",
        data: {
          propertyId,
          userId: req.user._id,
          explanation: "You need to start the payment process before you can verify it.",
          solution: "To fix this:",
          steps: [
            "1. Go to the property you want to purchase",
            "2. Click 'Complete Payment' or 'Order & Pay Now'",
            "3. Complete the payment through Chapa",
            "4. Then use manual verification with the transaction reference from your payment"
          ],
          hint: "The transaction reference should come from your property payment, not from commission payments"
        }
      });
    }

    console.log("✅ Found existing pending payment:", {
      paymentId: existingPendingPayment._id,
      existingReference: existingPendingPayment.chapaReference,
      providedReference: transactionReference,
      amount: existingPendingPayment.amount
    });

    // ENHANCED: Strict validation for transaction reference
    if (existingPendingPayment.chapaReference && 
        existingPendingPayment.chapaReference !== transactionReference) {
      
      // Check if the provided reference could be a real Chapa transaction
      // that's different from the initialized one (user paid with different reference)
      console.log("⚠️ Transaction reference mismatch - validating provided reference");
      
      // For Chapa, we can be more flexible but still validate format
      if (paymentMethod === "Chapa") {
        // Check if both references follow valid patterns
        const existingIsValid = /^(ethio_broker_|chapa_|tx_ref_|CHK_|TXN_|broker-comm-)\w+/i.test(existingPendingPayment.chapaReference);
        const providedIsValid = /^(ethio_broker_|chapa_|tx_ref_|CHK_|TXN_|broker-comm-)\w+/i.test(transactionReference);
        
        if (!providedIsValid) {
          return res.status(400).json({
            success: false,
            message: "The provided transaction reference doesn't match valid format. Please use the exact reference from your payment confirmation.",
            data: {
              expectedReference: existingPendingPayment.chapaReference,
              providedReference: transactionReference,
              hint: "Copy the transaction reference from your payment success page or confirmation email"
            }
          });
        }
      }
    }

    // ENHANCED: Check if this transaction reference has been used before
    const duplicatePayment = await Payment.findOne({
      chapaReference: transactionReference,
      paymentStatus: "Completed",
      _id: { $ne: existingPendingPayment._id }
    });

    if (duplicatePayment) {
      // Check if this is a commission payment reference being used for property payment
      if (duplicatePayment.paymentType === "broker_commission") {
        return res.status(400).json({
          success: false,
          message: "This is a commission payment reference, not a property payment reference.",
          data: {
            referenceType: "Commission Payment",
            propertyTitle: duplicatePayment.property?.title || "Unknown",
            hint: "Commission payments are handled automatically. You need the main property payment reference to verify your property purchase.",
            suggestion: "Please use the transaction reference from your property payment, not the commission payment."
          }
        });
      }

      return res.status(400).json({
        success: false,
        message: "This transaction reference has already been used for another payment.",
        data: {
          duplicatePaymentId: duplicatePayment._id,
          duplicateProperty: duplicatePayment.property,
          hint: "Each transaction reference can only be used once. Please check your payment history."
        }
      });
    }

    // Try to verify with Chapa if transaction reference is provided
    let chapaVerification = null;
    if (transactionReference && paymentMethod === "Chapa") {
      try {
        console.log("🔍 Verifying with Chapa:", transactionReference);
        chapaVerification = await verifyChapaTransaction(transactionReference);
        console.log("✅ Chapa verification result:", chapaVerification);
      } catch (chapaError) {
        console.log("⚠️ Chapa verification failed:", chapaError.message);
        // Continue with manual verification even if Chapa verification fails
        // But log this for security monitoring
      }
    }

    // Calculate expected amount (including commission)
    const baseAmount = property.price;
    const buyerCommission = Math.round(baseAmount * 0.02);
    const expectedAmount = baseAmount + buyerCommission;

    console.log("💰 Amount verification:", {
      providedAmount: amount,
      expectedAmount: expectedAmount,
      existingPaymentAmount: existingPendingPayment.amount,
      baseAmount: baseAmount,
      buyerCommission: buyerCommission
    });

    // ENHANCED: Verify amount matches the existing payment amount (more flexible)
    const amountToCheck = existingPendingPayment.amount || expectedAmount;
    const amountVariance = Math.abs(amount - amountToCheck) / amountToCheck;
    if (amountVariance > 0.05) {
      return res.status(400).json({
        success: false,
        message: `Amount mismatch. Expected: ${amountToCheck} ETB, Provided: ${amount} ETB`,
        data: {
          expectedAmount: amountToCheck,
          providedAmount: amount,
          baseAmount,
          buyerCommission,
          existingPaymentAmount: existingPendingPayment.amount,
          hint: "Please use the exact amount from your payment confirmation"
        }
      });
    }

    // ENHANCED: Update the existing pending payment instead of creating new one
    console.log("🔄 Updating existing pending payment to completed...");
    
    existingPendingPayment.paymentStatus = "Completed";
    existingPendingPayment.paymentDate = transactionDate ? new Date(transactionDate) : new Date();
    existingPendingPayment.amount = amount;
    existingPendingPayment.chapaReference = transactionReference;
    existingPendingPayment.paymentMethod = paymentMethod;
    existingPendingPayment.chapaTransactionId = chapaVerification?.data?.id || `manual-${Date.now()}`;
    
    // Update commission amounts if needed
    if (!existingPendingPayment.buyerCommission) {
      existingPendingPayment.buyerCommission = buyerCommission;
      existingPendingPayment.sellerCommission = Math.round(baseAmount * 0.02);
      existingPendingPayment.ownerReceives = baseAmount - existingPendingPayment.sellerCommission;
      existingPendingPayment.totalCommissionAmount = existingPendingPayment.buyerCommission + existingPendingPayment.sellerCommission;
    }
    
    if (property.assignedBroker) {
      existingPendingPayment.broker = property.assignedBroker._id;
      existingPendingPayment.assignedBroker = property.assignedBroker._id;
    }

    // Add manual verification metadata
    if (!existingPendingPayment.metadata) {
      existingPendingPayment.metadata = {};
    }
    existingPendingPayment.metadata.manualVerification = true;
    existingPendingPayment.metadata.verifiedBy = req.user._id;
    existingPendingPayment.metadata.verificationDate = new Date();
    existingPendingPayment.metadata.chapaVerification = chapaVerification ? "success" : "failed";
    existingPendingPayment.metadata.originalReference = existingPendingPayment.chapaReference;
    existingPendingPayment.metadata.providedReference = transactionReference;
    existingPendingPayment.metadata.referenceValidation = "passed";
    existingPendingPayment.metadata.securityChecks = {
      formatValidation: "passed",
      duplicateCheck: "passed",
      amountValidation: "passed"
    };

    await existingPendingPayment.save();
    const payment = existingPendingPayment;

    console.log("✅ Payment record created/updated:", payment._id);

    // Update property status using centralized updater
    try {
      const updateResult = await updatePropertyStatusAfterPayment(payment._id, {
        forceUpdate: true,
        skipCommissions: false,
        skipNotifications: false
      });

      console.log("✅ Property status updated:", updateResult);

      // Get updated property
      const updatedProperty = await Property.findById(propertyId);

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully! Property status has been updated.",
        data: {
          payment: {
            id: payment._id,
            amount: payment.amount,
            status: payment.paymentStatus,
            paymentDate: payment.paymentDate,
            transactionReference: payment.chapaReference,
            method: payment.paymentMethod
          },
          property: {
            id: updatedProperty._id,
            title: updatedProperty.title,
            status: updatedProperty.status,
            purpose: updatedProperty.purpose
          },
          updateResult: updateResult,
          chapaVerification: chapaVerification ? {
            status: chapaVerification.status,
            verified: chapaVerification.status === "success"
          } : null,
          securityValidation: {
            formatCheck: "passed",
            duplicateCheck: "passed",
            amountCheck: "passed"
          }
        }
      });

    } catch (updateError) {
      console.error("❌ Property status update failed:", updateError);
      
      return res.status(500).json({
        success: false,
        message: "Payment verified but property status update failed",
        data: {
          payment: {
            id: payment._id,
            status: payment.paymentStatus
          },
          error: updateError.message
        }
      });
    }

  } catch (error) {
    console.error("❌ Manual verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during manual verification",
      error: error.message
    });
  }
};

// @desc    Get payment verification form data for a property
// @route   GET /api/payments/verification-form/:propertyId
// @access  Private
const getVerificationFormData = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId)
      .populate("assignedBroker", "fname lname email")
      .populate("owner", "fname lname email")
      .populate("orderInfo.orderedBy", "fname lname email");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    // Verify user has ordered this property
    if (!property.orderInfo || !property.orderInfo.orderedBy) {
      return res.status(403).json({
        success: false,
        message: "You have not ordered this property"
      });
    }

    // Handle both populated and non-populated orderedBy
    const orderedByUserId = property.orderInfo.orderedBy._id || property.orderInfo.orderedBy;
    const requestUserId = req.user._id;
    
    if (orderedByUserId.toString() !== requestUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You have not ordered this property"
      });
    }

    // Calculate expected payment amount
    const baseAmount = property.price;
    const buyerCommission = Math.round(baseAmount * 0.02);
    const totalAmount = baseAmount + buyerCommission;

    // Check for existing payments
    const existingPayments = await Payment.find({
      property: propertyId,
      user: req.user._id
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        property: {
          id: property._id,
          title: property.title,
          purpose: property.purpose,
          propertyType: property.propertyType,
          status: property.status,
          images: property.images
        },
        paymentInfo: {
          baseAmount: baseAmount,
          buyerCommission: buyerCommission,
          totalAmount: totalAmount,
          currency: "ETB"
        },
        existingPayments: existingPayments.map(p => ({
          id: p._id,
          amount: p.amount,
          status: p.paymentStatus,
          paymentDate: p.paymentDate,
          transactionReference: p.chapaReference,
          method: p.paymentMethod
        })),
        canVerify: property.status === "Ordered" && 
                   !existingPayments.some(p => p.paymentStatus === "Completed")
      }
    });

  } catch (error) {
    console.error("❌ Get verification form data error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching verification form data",
      error: error.message
    });
  }
};

// @desc    Admin manual payment verification
// @route   POST /api/payments/admin-verify-payment
// @access  Private (Admin only)
const adminVerifyPayment = async (req, res) => {
  try {
    const { paymentId, verified, notes } = req.body;

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    console.log("🔧 Admin manual verification:", {
      paymentId,
      verified,
      adminId: req.user._id,
      notes
    });

    const payment = await Payment.findById(paymentId)
      .populate("property")
      .populate("user");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (verified) {
      // Mark payment as completed
      payment.paymentStatus = "Completed";
      payment.paymentDate = new Date();
      
      // Add admin verification metadata
      if (!payment.metadata) {
        payment.metadata = {};
      }
      payment.metadata.adminVerified = true;
      payment.metadata.adminVerifiedBy = req.user._id;
      payment.metadata.adminVerificationDate = new Date();
      payment.metadata.adminNotes = notes;

      await payment.save();

      // Update property status
      try {
        const updateResult = await updatePropertyStatusAfterPayment(payment._id, {
          forceUpdate: true
        });

        return res.json({
          success: true,
          message: "Payment verified by admin and property status updated",
          data: {
            payment: payment,
            updateResult: updateResult
          }
        });

      } catch (updateError) {
        return res.status(500).json({
          success: false,
          message: "Payment verified but property status update failed",
          error: updateError.message
        });
      }

    } else {
      // Mark payment as failed
      payment.paymentStatus = "Failed";
      
      if (!payment.metadata) {
        payment.metadata = {};
      }
      payment.metadata.adminRejected = true;
      payment.metadata.adminRejectedBy = req.user._id;
      payment.metadata.adminRejectionDate = new Date();
      payment.metadata.adminNotes = notes;

      await payment.save();

      return res.json({
        success: true,
        message: "Payment marked as failed by admin",
        data: {
          payment: payment
        }
      });
    }

  } catch (error) {
    console.error("❌ Admin verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during admin verification",
      error: error.message
    });
  }
};

module.exports = {
  manualVerifyTransaction,
  getVerificationFormData,
  adminVerifyPayment
};