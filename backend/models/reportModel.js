const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    broker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    dealType: { type: String, enum: ["Sale", "Rent"], required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    finalPrice: { type: Number, required: true },
    commission: { type: Number },
    remarks: { type: String },
    reviewedByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
