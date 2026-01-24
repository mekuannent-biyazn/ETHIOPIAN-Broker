// backend/routes/contactRoute.js
const express = require("express");
const router = express.Router();
const { 
    sendContactMessage, 
    getAllContactMessages, 
    getContactMessage, 
    updateContactMessage, 
    deleteContactMessage,
    replyToContactMessage
} = require("../controllers/contactController");
const { protect } = require("../middleware/authMiddleware");

// Public route - Send contact form message
router.post("/send", sendContactMessage);

// Admin routes - Require authentication and admin role
router.get("/messages", protect, (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }
    next();
}, getAllContactMessages);

router.get("/messages/:id", protect, (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }
    next();
}, getContactMessage);

router.put("/messages/:id", protect, (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }
    next();
}, updateContactMessage);

router.post("/messages/:id/reply", protect, (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }
    next();
}, replyToContactMessage);

router.delete("/messages/:id", protect, (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }
    next();
}, deleteContactMessage);

module.exports = router;
