const mongoose = require("mongoose");

const communicationSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // buyer, broker, seller
    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Communication", communicationSchema);
