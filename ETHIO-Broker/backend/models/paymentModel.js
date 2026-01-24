const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedBroker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "ETB",
    },
    paymentType: {
      type: String,
      enum: ["full_payment", "booking_fee", "commission", "broker_commission"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Chapa", "Cash", "Bank Transfer", "Other"],
      default: "Chapa",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Cancelled", "Expired"],
      default: "Pending",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    chapaReference: {
      type: String,
      sparse: true,
    },
    chapaTransactionId: {
      type: String,
    },
    paymentUrl: {
      type: String,
    },
    paymentDate: {
      type: Date,
    },
    // Commission related fields
    commissionAmount: {
      type: Number,
      default: 0,
    },
    broker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isCommissionPayment: {
      type: Boolean,
      default: false,
    },
    // ✅ ADD THIS MISSING FIELD:
    originalPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    metadata: {
      type: Object,
      default: {},
    },
    buyerCommission: {
      type: Number,
      default: 0,
    },
    sellerCommission: {
      type: Number,
      default: 0,
    },
    totalCommissionAmount: {
      type: Number,
      default: 0,
    },
    ownerReceives: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes
paymentSchema.index({ property: 1, user: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ dueDate: 1 });
// paymentSchema.index({ chapaReference: 1 });

// Method to check if payment is expired
paymentSchema.methods.isExpired = function () {
  return new Date() > this.dueDate && this.paymentStatus === "Pending";
};

module.exports = mongoose.model("Payment", paymentSchema);
