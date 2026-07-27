const express = require("express");
const {
  getAllUsers,
  getUserById,
  toggleUserActiveStatus,
  updateUserRole,
  verifyUserManually,
  getAllProperties,
  approveProperty,
  getAllReports,
  reviewReport,
} = require("../controllers/adminController");
const { protect, admin } = require("../middleware/authMiddleware");
const {
  assignBrokerToProperty,
  getAllBrokerAssignments,
  getBrokerPerformanceReport,
  updatePropertyCommission,
} = require("../controllers/brokerAssignmentController");

const router = express.Router();

// ✅ Admin-only routes

// ---- Property routes (specific first)
router.get("/property", protect, admin, getAllProperties);
router.patch("/property/:id/approve", protect, admin, approveProperty);

// ---- Report routes
router.get("/reports", protect, admin, getAllReports);
router.patch("/reports/:reportId/review", protect, admin, reviewReport);

// ---- User routes
router.get("/", protect, admin, getAllUsers);
router.post("/verify-manually", protect, admin, verifyUserManually);
router.patch("/:id/role", protect, admin, updateUserRole);
router.patch("/:id/toggle-status", protect, admin, toggleUserActiveStatus);
router.get("/:id", protect, admin, getUserById);

// Broker Assignment Routes
router.post("/assign-broker", protect, admin, assignBrokerToProperty);
router.get("/broker-assignments", protect, admin, getAllBrokerAssignments);
router.get("/broker-performance", protect, admin, getBrokerPerformanceReport);
router.put(
  "/update-commission/:propertyId",
  protect,
  admin,
  updatePropertyCommission,
);

module.exports = router;
