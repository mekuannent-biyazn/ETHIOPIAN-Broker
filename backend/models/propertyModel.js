const mongoose = require("mongoose");

const communicationSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sendto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema({
  orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  orderDate: { type: Date },
  purpose: { type: String, enum: ["Sell", "Rent"] },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  paymentStatus: { type: String, enum: ["Pending", "Completed", "Expired"], default: "Pending" },
  paymentDeadline: { type: Date },
  approvedByAdmin: { type: Boolean, default: false },
  extraInfo: { type: String },
  // Added fields for commission tracking
  buyerCommissionPaid: { type: Boolean, default: false },
  sellerCommissionPaid: { type: Boolean, default: false },
  commissionAmount: { type: Number, default: 0 },
});

const propertySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    propertyType: {
      type: String,
      required: true,
      enum: ["Home", "Car", "Electronics"],
    },
    purpose: { type: String, required: true, enum: ["Sell", "Rent"] },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "ETB" },
    city: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },

    status: {
      type: String,
      enum: [
        "Available",
        "Ordered",
        "Sold",
        "Rented",
        "Cancelled",
        "Pending",
        "Payment_Pending",
      ],
      default: "Available",
    },

    approvedByAdmin: { type: Boolean, default: false },
    assignedBroker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    communicationHistory: [communicationSchema],
    orderInfo: orderSchema,

    // Payment and Commission Fields
    paymentDeadline: {
      type: Number, // number of days for payment completion
      default: 3, // Changed to 3 days (72 hours)
    },
    broker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // This should reference User model
    },
    isCommissionPayment: {
      type: Boolean,
      default: false,
    },
    commissionAmount: {
      type: Number,
      default: 0,
    },
    bookingFeePercentage: {
      type: Number,
      default: 10, // 10% booking fee
    },
    commissionPercentage: {
      type: Number,
      default: 2, // 2% commission from each party
    },
    totalCommissionReceived: {
      type: Number,
      default: 0,
    },
    currentBuyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    currentRenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Home-specific
    homeDetails: {
      size: Number,
      bedrooms: Number,
      bathrooms: Number,
      floors: Number,
      furnished: { type: Boolean, default: false },
      yearBuilt: Number,
      amenities: [{ type: String }],
      condition: { type: String, enum: ["New", "Good", "Needs Renovation"] },
    },

    // Car-specific
    carDetails: {
      brand: String,
      model: String,
      year: Number,
      mileage: Number,
      fuelType: {
        type: String,
        enum: ["Petrol", "Diesel", "Electric", "Hybrid"],
      },
      transmission: { type: String, enum: ["Manual", "Automatic"] },
      color: String,
      condition: { type: String, enum: ["New", "Used"] },
      registered: { type: Boolean, default: true },
      plateNumber: String,
    },

    // Electronics-specific
    electronicsDetails: {
      category: String,
      brand: String,
      model: String,
      specifications: String,
      condition: { type: String, enum: ["New", "Used", "Refurbished"] },
      warranty: { type: Boolean, default: false },
      warrantyPeriod: String,
    },

    // Rent-specific
    rentDetails: {
      rentDuration: { type: String, enum: ["Monthly", "Yearly"] },
      deposit: Number,
      securityDeposit: Number,
    },
  },
  { timestamps: true }
);

const brokerAssignmentSchema = new mongoose.Schema({
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
  notes: String,
  commissionPercentage: {
    type: Number,
    default: 2,
  },
});

// Add this to your existing propertySchema
propertySchema.add({
  brokerAssignment: brokerAssignmentSchema,
  assignmentStatus: {
    type: String,
    enum: ["Pending", "Assigned", "Completed", "Cancelled"],
    default: "Pending",
  },
  commissionEarned: {
    type: Number,
    default: 0,
  },
  saleCompletedAt: Date,
});

// Index for searching
propertySchema.index({
  title: "text",
  description: "text",
  city: 1,
  propertyType: 1,
});

// Virtual for calculating commission amounts
propertySchema.virtual("buyerCommission").get(function () {
  return this.price * (this.commissionPercentage / 100);
});

propertySchema.virtual("sellerCommission").get(function () {
  return this.price * (this.commissionPercentage / 100);
});

propertySchema.virtual("totalCommission").get(function () {
  return this.buyerCommission + this.sellerCommission;
});

propertySchema.virtual("bookingFeeAmount").get(function () {
  return this.price * (this.bookingFeePercentage / 100);
});

module.exports = mongoose.model("Property", propertySchema);
