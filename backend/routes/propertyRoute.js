const express = require("express");
const router = express.Router();
const {
  createProperty,
  approveProperty,
  orderProperty,
  createCommunication,
  getAllApprovedProperties,
  getMyProperties,
  getProperties,
  getBrokerProperties,
  updateProperty,
  deleteProperty,
  assignBroker,
  getPendingProperties,
  completeOrder,
  viewPropertyDetails,
  updatePropertyAfterPayment,
  getPropertiesWithPendingPayments,
  checkExpiredPayments,
  debugPaymentCreation,
  getUserOrderedProperties,
  getAdminDashboardStats,
  getAllPropertiesForAdmin,
  getBrokerDashboardStats,
  getPublicStats, // Add this
} = require("../controllers/propertyController");
const { protect, admin, broker } = require("../middleware/authMiddleware");

// Public routes
router.get("/", getProperties);
router.get("/approved", getAllApprovedProperties);
router.get("/view/:id", viewPropertyDetails);
router.get("/public/stats", getPublicStats);

// Protected routes
router.use(protect);

router.post("/", createProperty);
router.get("/my-properties", getMyProperties);
router.post("/:id/order", orderProperty);
router.put("/:id", updateProperty);
router.delete("/:id", deleteProperty);
router.put("/:id/payment-success", updatePropertyAfterPayment);
router.get("/user/pending-payments", getPropertiesWithPendingPayments);
router.post("/debug-payment-creation", debugPaymentCreation); // Add debug route
router.get("/user/orders", getUserOrderedProperties);

// Broker routes
router.get("/broker/assigned", broker, getBrokerProperties);
router.get("/broker/dashboard-stats", broker, getBrokerDashboardStats);

// Admin routes
router.use(admin);
router.put("/:id", updateProperty);
router.delete("/:id", deleteProperty);
router.patch("/:id/complete", completeOrder);
router.patch("/:id/assign-broker", assignBroker);
router.get("/pending", getPendingProperties);
router.patch("/:id/approve", admin, approveProperty);
router.post("/chat", createCommunication);
router.post("/check-expired-payments", checkExpiredPayments);
router.post("/manual-expiry-check", checkExpiredPayments); // Manual trigger for testing
router.get("/admin/dashboard-stats", getAdminDashboardStats);
router.get("/admin/all-properties", getAllPropertiesForAdmin);

module.exports = router;
