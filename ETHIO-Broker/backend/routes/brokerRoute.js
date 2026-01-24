// routes/brokerRoute.js
const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const brokerController = require("../controllers/brokerController");

router.use(protect, authorizeRoles("broker", "admin")); // admin allowed to view broker endpoints optionally

router.get("/assigned-properties", brokerController.getAssignedProperties);
router.post("/report", brokerController.submitReport);
router.get("/reports", brokerController.getReportsByBroker);

module.exports = router;
