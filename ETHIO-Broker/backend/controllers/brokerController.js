// controllers/brokerController.js
const Property = require("../models/propertyModel");
const Report = require("../models/reportModel");
const Communication = require("../models/communicationModel");
const Payment = require("../models/paymentModel");

// Get properties assigned to the logged-in broker
exports.getAssignedProperties = async (req, res, next) => {
  try {
    const brokerId = req.user._id;
    const properties = await Property.find({ assignedBroker: brokerId })
      .populate("owner", "fname lname email")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: properties.length, properties });
  } catch (err) {
    next(err);
  }
};

// Submit a broker report for a property (after successful transaction/visit)
exports.submitReport = async (req, res, next) => {
  try {
    const brokerId = req.user._id;
    const {
      propertyId,
      dealType,
      buyerId,
      finalPrice,
      commission,
      remarks,
      attachments,
    } = req.body;

    // validations
    if (!propertyId || !dealType || !finalPrice) {
      return res.status(400).json({
        success: false,
        message: "propertyId, dealType and finalPrice are required.",
      });
    }

    // ensure broker is assigned to this property
    const property = await Property.findById(propertyId);
    if (!property)
      return res
        .status(404)
        .json({ success: false, message: "Property not found." });

    if (
      !property.assignedBroker ||
      property.assignedBroker.toString() !== brokerId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not the assigned broker for this property.",
      });
    }

    const report = await Report.create({
      broker: brokerId,
      property: propertyId,
      dealType,
      buyer: buyerId || null,
      finalPrice,
      commission: commission || 0,
      remarks: remarks || "",
      attachments: attachments || [],
    });

    // Optionally: change property.status to Sold/Rented? better handled by admin after review
    res.status(201).json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

// Get all reports by this broker
exports.getReportsByBroker = async (req, res, next) => {
  try {
    const brokerId = req.user._id;
    const reports = await Report.find({ broker: brokerId })
      .populate("property", "title city price status")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: reports.length, reports });
  } catch (err) {
    next(err);
  }
};
