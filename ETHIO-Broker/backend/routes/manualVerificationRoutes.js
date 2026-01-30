// routes/manualVerificationRoutes.js
const express = require("express");
const {
  manualVerifyTransaction,
  getVerificationFormData,
  adminVerifyPayment
} = require("../controllers/manualVerificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// User manual verification routes
router.post("/manual-verify-transaction", protect, manualVerifyTransaction);
router.get("/verification-form/:propertyId", protect, getVerificationFormData);

// Admin verification routes
router.post("/admin-verify-payment", protect, adminVerifyPayment);

module.exports = router;
