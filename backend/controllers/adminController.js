const User = require("../models/userModel");
const Property = require("../models/propertyModel");
const Report = require("../models/reportModel");
const mongoose = require("mongoose");
const sendEmail = require("../utils/transporter");

// Get all users (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Get user by ID (Admin only)
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Toggle user active status (Admin only)
exports.toggleUserActiveStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Find the user to update
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    // Toggle the active status
    user.isActive = !user.isActive;
    await user.save();

    const action = user.isActive ? "activated" : "deactivated";

    res.json({
      success: true,
      message: `User ${action} successfully`,
      user: {
        id: user._id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Error toggling user active status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating user status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update user role (Admin only)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    console.log("=== UPDATE ROLE REQUEST ===");
    console.log("User ID:", id);
    console.log("New Role:", role);
    console.log("Admin User ID:", req.user.id);
    console.log("Admin User Role:", req.user.role);

    // Validate role
    if (!["client", "admin", "broker"].includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role specified. Must be 'client', 'admin', or 'broker'",
      });
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Find the user to update
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("Found user to update:", {
      id: user._id,
      name: `${user.fname} ${user.lname}`,
      currentRole: user.role,
    });

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    // Update the role
    user.role = role;

    // Save the user
    await user.save();

    console.log("Role updated successfully");

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: user._id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("=== ERROR UPDATING USER ROLE ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while updating user role",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Manual verification by admin
exports.verifyUserManually = async (req, res, next) => {
  try {
    const { userId } = req.body;

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admin can verify users manually" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    // Verify the user
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    // Send confirmation email to user
    await sendEmail({
      email: user.email,
      subject: "Account Verified - ETHIO Broker",
      message: `
        <h2>Account Verified Successfully!</h2>
        <p>Hello ${user.fname},</p>
        <p>Your account has been verified by our admin team. You can now fully access your account.</p>
        <p>Thank you for choosing ETHIO Broker!</p>
        <a href="${process.env.CLIENT_URL}/login" target="_blank" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
          Login to Your Account
        </a>
        <p>If you have any questions, please contact our support team.</p>
      `,
    });

    res.status(200).json({
      message: "User verified successfully",
      user: {
        id: user._id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all properties (admin view)
exports.getAllProperties = async (req, res, next) => {
  try {
    const props = await Property.find({})
      .populate("owner", "fname lname email role")
      .populate("assignedBroker", "fname lname email")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: props.length, properties: props });
  } catch (err) {
    next(err);
  }
};

// Approve property and auto-assign a broker
// if no specific broker provided, choose first available broker (round-robin not implemented)
exports.approveProperty = async (req, res, next) => {
  try {
    const propertyId = req.params.id;
    const { brokerId } = req.body; // optional - admin can pass a brokerId

    const property = await Property.findById(propertyId);
    if (!property)
      return res.status(404).json({ message: "Property not found" });

    // choose broker
    let broker;
    if (brokerId) {
      broker = await User.findById(brokerId);
      if (!broker || broker.role !== "broker")
        return res.status(400).json({ message: "Invalid broker specified" });
    } else {
      // auto pick any broker
      broker = await User.findOne({ role: "broker" }).sort({ createdAt: 1 });
      if (!broker)
        return res
          .status(400)
          .json({ message: "No broker available to assign" });
    }

    property.status = "Available";
    property.assignedBroker = broker._id;
    await property.save({ validateBeforeSave: false });

    // TODO: notify owner & broker via email (use transporter)
    res.json({
      success: true,
      message: "Property approved and broker assigned",
      property,
    });
  } catch (err) {
    next(err);
  }
};

// Admin reviews a broker report and optionally changes property status
exports.reviewReport = async (req, res, next) => {
  try {
    const reportId = req.params.reportId;
    const { action, adminResponse, newStatus } = req.body; // action: 'accept'|'reject'|'reviewed'

    const report = await Report.findById(reportId).populate("property");
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (action === "accept") {
      report.reviewedByAdmin = true;
      report.adminResponse = adminResponse || "Accepted";
      await report.save();

      // if newStatus provided and valid, update property
      if (
        newStatus &&
        ["Sold", "Rented", "Available", "Cancelled"].includes(newStatus)
      ) {
        const property = await Property.findById(report.property._id);
        property.status = newStatus;
        // set approve flag in orderInfo if appropriate
        if (!property.orderInfo) property.orderInfo = {};
        property.orderInfo.approvedByAdmin = true;
        await property.save();
      }

      return res.json({ success: true, report, message: "Report accepted" });
    } else if (action === "reject") {
      report.reviewedByAdmin = true;
      report.adminResponse = adminResponse || "Rejected";
      await report.save();
      return res.json({ success: true, report, message: "Report rejected" });
    } else {
      report.adminResponse = adminResponse || report.adminResponse;
      await report.save();
      return res.json({ success: true, report });
    }
  } catch (err) {
    next(err);
  }
};

// Get all reports (admin)
exports.getAllReports = async (req, res, next) => {
  try {
    const reports = await Report.find({})
      .populate("broker", "fname lname email")
      .populate("property", "title city price status")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: reports.length, reports });
  } catch (err) {
    next(err);
  }
};
