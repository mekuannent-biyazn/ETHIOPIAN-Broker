const Property = require("../models/propertyModel");
const User = require("../models/userModel");
const Payment = require("../models/paymentModel");
const { createPropertyAssignmentNotification } = require("../utils/notificationHelper");

// @desc    Assign broker to property
// @route   POST /api/admin/assign-broker
// @access  Private (Admin only)
exports.assignBrokerToProperty = async (req, res) => {
  try {
    const { propertyId, brokerId, commissionPercentage = 2, notes } = req.body;

    // Validate input
    if (!propertyId || !brokerId) {
      return res.status(400).json({
        success: false,
        message: "Property ID and Broker ID are required",
      });
    }

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Check if broker exists and is actually a broker
    const broker = await User.findOne({ _id: brokerId, role: "broker" });
    if (!broker) {
      return res.status(404).json({
        success: false,
        message: "Broker not found or user is not a broker",
      });
    }

    // Check if property is already assigned
    if (property.assignedBroker && property.assignmentStatus === "Assigned") {
      return res.status(400).json({
        success: false,
        message: "Property is already assigned to a broker",
      });
    }

    // Assign broker to property
    property.assignedBroker = brokerId;
    property.assignmentStatus = "Assigned";
    property.brokerAssignment = {
      assignedBy: req.user._id,
      assignedAt: new Date(),
      notes: notes,
      commissionPercentage: commissionPercentage,
    };

    await property.save();

    // Populate the response
    await property.populate("assignedBroker", "fname lname email phone");
    await property.populate("brokerAssignment.assignedBy", "fname lname");

    // ✅ CREATE NOTIFICATION FOR BROKER ABOUT NEW ASSIGNMENT
    try {
      await createPropertyAssignmentNotification(
        brokerId,
        property.title,
        property._id
      );

      console.log(`✅ Property assignment notification sent to broker ${brokerId}`);
    } catch (notificationError) {
      console.error("❌ Error creating assignment notification:", notificationError);
      // Don't fail assignment if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Broker assigned successfully",
      data: {
        property: {
          _id: property._id,
          title: property.title,
          price: property.price,
          status: property.status,
          assignedBroker: property.assignedBroker,
          assignmentStatus: property.assignmentStatus,
          brokerAssignment: property.brokerAssignment,
        },
      },
    });
  } catch (error) {
    console.error("❌ Assign broker error:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning broker to property",
      error: error.message,
    });
  }
};

// @desc    Get all broker assignments
// @route   GET /api/admin/broker-assignments
// @access  Private (Admin only)
exports.getAllBrokerAssignments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, brokerId } = req.query;

    let filter = { assignedBroker: { $exists: true, $ne: null } };

    // Filter by assignment status
    if (status && status !== "all") {
      filter.assignmentStatus = status;
    }

    // Filter by specific broker
    if (brokerId && brokerId !== "all") {
      filter.assignedBroker = brokerId;
    }

    const assignments = await Property.find(filter)
      .populate("owner", "fname lname email phone")
      .populate("assignedBroker", "fname lname email phone")
      .populate("brokerAssignment.assignedBy", "fname lname")
      .populate("orderInfo.orderedBy", "fname lname email")
      .sort({ "brokerAssignment.assignedAt": -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Property.countDocuments(filter);

    // Get broker performance stats
    const brokerStats = await Property.aggregate([
      { $match: { assignedBroker: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$assignedBroker",
          totalAssignments: { $sum: 1 },
          completedAssignments: {
            $sum: { $cond: [{ $in: ["$status", ["Sold", "Rented"]] }, 1, 0] },
          },
          totalCommission: { $sum: "$commissionEarned" },
          avgCommission: { $avg: "$commissionEarned" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "broker",
        },
      },
      { $unwind: "$broker" },
    ]);

    res.status(200).json({
      success: true,
      data: {
        assignments,
        brokerStats,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    console.error("❌ Get broker assignments error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching broker assignments",
      error: error.message,
    });
  }
};

// @desc    Get broker performance report
// @route   GET /api/admin/broker-performance
// @access  Private (Admin only)
exports.getBrokerPerformanceReport = async (req, res) => {
  try {
    const { period = "month" } = req.query; // month, quarter, year

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case "month":
        dateFilter = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        };
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        dateFilter = {
          $gte: new Date(now.getFullYear(), quarter * 3, 1),
        };
        break;
      case "year":
        dateFilter = {
          $gte: new Date(now.getFullYear(), 0, 1),
        };
        break;
    }

    const performanceReport = await Property.aggregate([
      {
        $match: {
          assignedBroker: { $exists: true, $ne: null },
          "brokerAssignment.assignedAt": dateFilter,
        },
      },
      {
        $group: {
          _id: "$assignedBroker",
          totalProperties: { $sum: 1 },
          propertiesSold: {
            $sum: { $cond: [{ $eq: ["$status", "Sold"] }, 1, 0] },
          },
          propertiesRented: {
            $sum: { $cond: [{ $eq: ["$status", "Rented"] }, 1, 0] },
          },
          totalRevenue: { $sum: "$price" },
          totalCommission: { $sum: "$commissionEarned" },
          successRate: {
            $avg: {
              $cond: [{ $in: ["$status", ["Sold", "Rented"]] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "broker",
        },
      },
      { $unwind: "$broker" },
      {
        $project: {
          brokerName: { $concat: ["$broker.fname", " ", "$broker.lname"] },
          brokerEmail: "$broker.email",
          totalProperties: 1,
          propertiesSold: 1,
          propertiesRented: 1,
          totalRevenue: 1,
          totalCommission: 1,
          successRate: { $multiply: ["$successRate", 100] },
        },
      },
      { $sort: { totalCommission: -1 } },
    ]);

    // Overall platform stats
    const platformStats = await Property.aggregate([
      {
        $match: {
          assignedBroker: { $exists: true, $ne: null },
          "brokerAssignment.assignedAt": dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalAssignments: { $sum: 1 },
          totalCompleted: {
            $sum: { $cond: [{ $in: ["$status", ["Sold", "Rented"]] }, 1, 0] },
          },
          totalRevenue: { $sum: "$price" },
          totalCommission: { $sum: "$commissionEarned" },
          avgSuccessRate: {
            $avg: {
              $cond: [{ $in: ["$status", ["Sold", "Rented"]] }, 1, 0],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        performanceReport,
        platformStats: platformStats[0] || {
          totalAssignments: 0,
          totalCompleted: 0,
          totalRevenue: 0,
          totalCommission: 0,
          avgSuccessRate: 0,
        },
        period,
      },
    });
  } catch (error) {
    console.error("❌ Get broker performance error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating broker performance report",
      error: error.message,
    });
  }
};

// @desc    Update property commission after successful sale
// @route   PUT /api/admin/update-commission/:propertyId
// @access  Private (Admin only)
exports.updatePropertyCommission = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { commissionEarned, saleCompletedAt } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (!property.assignedBroker) {
      return res.status(400).json({
        success: false,
        message: "Property is not assigned to any broker",
      });
    }

    // Update commission and mark as completed
    property.commissionEarned = commissionEarned;
    property.saleCompletedAt = saleCompletedAt || new Date();
    property.assignmentStatus = "Completed";

    await property.save();

    res.status(200).json({
      success: true,
      message: "Commission updated successfully",
      data: {
        property: {
          _id: property._id,
          title: property.title,
          commissionEarned: property.commissionEarned,
          saleCompletedAt: property.saleCompletedAt,
          assignmentStatus: property.assignmentStatus,
        },
      },
    });
  } catch (error) {
    console.error("❌ Update commission error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating commission",
      error: error.message,
    });
  }
};
