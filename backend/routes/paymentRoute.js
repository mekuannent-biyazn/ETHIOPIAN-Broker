// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const {
  initializePayment,
  verifyPayment,
  paymentWebhook,
  manualVerifyPayment,
  manualVerifyByPaymentId,
  getPaymentStatus,
  getMyPayments,
  cancelPayment,
  resetPaymentStatus,
  getBrokerCommissions,
  getOwnerEarnings,
  getPropertyEarningsDetail,
  getBrokerCommissionSummary,
  getClientPaymentSummary,
  getAdminPaymentSummary,
  getAdminBrokerCommissions,
  fixPropertyStatus,
  debugPaymentStatus,
  bulkFixPropertyStatus,
  triggerAutoVerify,
  fixCommissionAmounts,
} = require("../controllers/paymentController");
const { protect, broker, admin } = require("../middleware/authMiddleware");

// Public routes for Chapa callbacks
router.route("/verify").get(verifyPayment).post(verifyPayment);
router.post("/webhook", paymentWebhook);

// Protected routes
router.post("/initialize", protect, initializePayment);
router.post("/manual-verify", protect, manualVerifyByPaymentId);
router.get("/verify/:tx_ref", protect, manualVerifyPayment);
router.get("/:paymentId/status", protect, getPaymentStatus);
router.post("/:paymentId/cancel", protect, cancelPayment);
router.get("/user/my-payments", protect, getMyPayments);
router.patch("/:paymentId/reset", protect, resetPaymentStatus);

// Property owner earnings routes
router.get("/owner/earnings", protect, getOwnerEarnings);
router.get("/owner/earnings/:propertyId", protect, getPropertyEarningsDetail);

router.get("/commission/broker", protect, broker, getBrokerCommissions);
router.get("/commission/summary", protect, broker, getBrokerCommissionSummary);

router.get("/client/summary", protect, getClientPaymentSummary);
router.get("/admin/summary", protect, admin, getAdminPaymentSummary);
router.get(
  "/admin/broker-commissions",
  protect,
  admin,
  getAdminBrokerCommissions
);

// Admin debugging and fix routes
router.post("/fix-property-status", protect, admin, fixPropertyStatus);
router.post("/bulk-fix-property-status", protect, admin, bulkFixPropertyStatus);
router.post("/trigger-auto-verify", protect, admin, triggerAutoVerify);
router.post("/fix-commissions", protect, admin, fixCommissionAmounts);
router.get("/debug/:paymentId", protect, admin, debugPaymentStatus);

module.exports = router;
