const Property = require("../models/propertyModel");
const Communication = require("../models/communicationModel");
const Report = require("../models/reportModel");
const Payment = require("../models/paymentModel");
const User = require("../models/userModel");
const { generateChapaPaymentUrl } = require("../utils/chapaPayment");
const {
  createPropertyStatusNotification,
  createUserRegistrationNotification,
  createPropertyAssignmentNotification
} = require("../utils/notificationHelper");

// 🏡 Create property (seller or landlord)
exports.createProperty = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(400).json({
        message: "Email not verified. Please verify your email first.",
      });
    }

    const property = await Property.create({
      ...req.body,
      owner: req.user._id,
      status: "Pending", // Needs admin approval
    });

    if (req.body.price < 0) {
      return res.status(400).json({ message: "Price cannot be negative" });
    }

    if (property.propertyType === "Home") {
      const {
        size,
        bedrooms,
        bathrooms,
        floors,
        yearBuilt,
        amenities,
        condition,
      } = req.body.homeDetails || {};
      if (
        !size ||
        !bedrooms ||
        !bathrooms ||
        !floors ||
        !yearBuilt ||
        !amenities ||
        !condition
      ) {
        res
          .status(400)
          .json({ message: "Please provide all required home details" });
        return;
      }
    }

    if (property.propertyType === "Car") {
      const { brand, model, year, mileage, fuelType, transmission } =
        req.body.carDetails || {};
      if (!brand || !model || !year || !mileage || !fuelType || !transmission) {
        return res
          .status(400)
          .json({ message: "Please provide all required car details" });
      }
    }

    if (property.propertyType === "Electronics") {
      const {
        category,
        brand,
        model,
        specifications,
        condition,
        warranty,
        warrantyPeriod,
      } = req.body.electronicsDetails || {}; // FIXED: Changed from electronicsDetails to req.body.electronicsDetails

      if (!category || !brand || !model || !specifications || !condition) {
        return res.status(400).json({
          message: "Please provide all required electronics details",
        });
      }

      if (warranty && !warrantyPeriod) {
        return res.status(400).json({
          message: "Please specify warranty period if warranty is available",
        });
      }
    }

    // ✅ CREATE NOTIFICATION FOR ADMINS ABOUT NEW PROPERTY
    try {
      // Get all admin users
      const admins = await User.find({ role: "admin" }, "_id");

      // Create notifications for all admins
      for (const admin of admins) {
        await createPropertyStatusNotification(
          admin._id,
          property.title,
          "pending_approval",
          `New ${property.propertyType.toLowerCase()} property submitted by ${user.fname} ${user.lname}`
        );
      }

      console.log(`✅ Property creation notifications sent to ${admins.length} admins`);
    } catch (notificationError) {
      console.error("❌ Error creating property notifications:", notificationError);
      // Don't fail property creation if notifications fail
    }

    res.status(201).json({ success: true, property });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔍 View all approved (Available) properties AND Ordered properties with pending payment - for buyers/tenants
exports.getAllApprovedProperties = async (req, res) => {
  try {
    const properties = await Property.find({
      $or: [
        { status: "Available" },
        {
          status: "Ordered",
          "orderInfo.paymentStatus": "Pending",
        },
      ],
    }).populate("owner", "fname lname city");
    res.status(200).json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.viewPropertyDetails = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("owner", "fname lname email phone city")
      .populate("assignedBroker", "fname lname email phone")
      .populate("orderInfo.orderedBy", "fname lname email phone");

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Send full property info - no need to extract propertyDetails separately
    // The frontend can access property.homeDetails, property.carDetails, etc. directly
    res.status(200).json({
      success: true,
      property, // This includes all details like homeDetails, carDetails, etc.
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🧩 Admin approves property → auto-assign broker (Improved version)
exports.approveProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property)
      return res.status(404).json({ message: "Property not found" });

    // Check if property is already approved
    if (property.approvedByAdmin) {
      return res.status(400).json({
        message: "Property is already approved",
      });
    }

    // auto assign a random broker
    const broker = await User.findOne({ role: "broker" });
    if (!broker)
      return res.status(400).json({ message: "No broker available" });

    // Update all necessary fields
    property.status = "Available";
    property.approvedByAdmin = true;
    property.approvedAt = new Date(); // Optional: track approval time
    property.assignedBroker = broker._id;
    await property.save();

    // Populate the response
    await property.populate("assignedBroker", "fname lname email");
    await property.populate("owner", "fname lname email");

    // ✅ CREATE NOTIFICATIONS FOR PROPERTY APPROVAL
    try {
      // Notify property owner about approval
      await createPropertyStatusNotification(
        property.owner._id,
        property.title,
        "approved"
      );

      // Notify assigned broker about new assignment
      await createPropertyAssignmentNotification(
        broker._id,
        property.title,
        property._id
      );

      console.log(`✅ Property approval notifications sent to owner and broker`);
    } catch (notificationError) {
      console.error("❌ Error creating approval notifications:", notificationError);
      // Don't fail approval if notifications fail
    }

    res.json({
      success: true,
      message: "Property approved and broker assigned",
      property,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.orderProperty = async (req, res) => {
  try {
    const { extraInfo, paymentFlow = "immediate" } = req.body || {}; // Add paymentFlow option
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Prevent admins and brokers from ordering properties
    if (["admin", "broker"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Admins and brokers cannot order properties",
      });
    }

    // Check property availability
    if (property.status !== "Available") {
      return res.status(400).json({
        success: false,
        message: "Property is not available for order",
      });
    }

    // Prevent ordering own property
    if (property.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot order your own property",
      });
    }

    // Check if user has a pending order for this property
    const existingOrder = await Property.findOne({
      _id: property._id,
      status: "Ordered",
      "orderInfo.orderedBy": req.user._id,
    });

    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending order for this property",
      });
    }

    // Calculate due date for payment (72 hours = 3 days)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (property.paymentDeadline || 3)); // 3 days = 72 hours

    // FIXED: Update property order info with proper paymentStatus
    property.status = "Ordered";
    property.orderInfo = {
      orderedBy: req.user._id,
      orderDate: new Date(),
      purpose: property.purpose,
      approvedByAdmin: false,
      paymentStatus: "Pending", // ← THIS IS THE FIX
      paymentDeadline: dueDate, // ← Add payment deadline (72 hours from now)
      extraInfo: extraInfo || "",
    };

    // Set current buyer/renter
    if (property.purpose === "Sell") {
      property.currentBuyer = req.user._id;
    } else {
      property.currentRenter = req.user._id;
    }

    await property.save();

    // Populate response
    await property.populate("orderInfo.orderedBy", "fname lname email phone");

    console.log("✅ Property ordered successfully:", {
      propertyId: property._id,
      orderedBy: req.user._id,
      purpose: property.purpose,
      paymentStatus: property.orderInfo.paymentStatus,
    });

    // ✅ FLEXIBLE PAYMENT FLOW - Support both immediate and later payment
    if (paymentFlow === "immediate") {
      // IMMEDIATE PAYMENT FLOW - Generate Chapa URL and redirect
      try {
        console.log("🔄 Generating Chapa payment URL for immediate payment...");

        // Get user details for payment
        const user = await User.findById(req.user._id);
        if (!user) {
          throw new Error("User not found for payment generation");
        }

        // Generate unique transaction reference
        const txRef = `ethio-order-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Generate Chapa payment URL
        const chapaData = {
          amount: property.price,
          currency: "ETB",
          email: user.email,
          first_name: user.fname,
          last_name: user.lname,
          phone_number: user.phone || "0912345678",
          tx_ref: txRef,
          callback_url: `${process.env.SERVER_URL}/api/payments/webhook`,
          return_url: `${process.env.CLIENT_URL}/payment/success`,
          customization: {
            title: "ETHIO Broker",
            description: `Payment for ${property.title}`,
          },
          metadata: {
            propertyId: property._id.toString(),
            paymentType: "full_payment",
            userId: req.user._id.toString(),
            orderFlow: "immediate_payment",
          },
        };

        console.log("📦 Chapa request data for immediate payment:", {
          tx_ref: chapaData.tx_ref,
          amount: chapaData.amount,
          email: chapaData.email,
          propertyTitle: property.title,
        });

        const chapaResponse = await generateChapaPaymentUrl(chapaData);

        if (chapaResponse && chapaResponse.checkout_url) {
          console.log("✅ Chapa payment URL generated for immediate payment:", chapaResponse.checkout_url);

          // Return success with payment URL for immediate redirect
          return res.status(200).json({
            success: true,
            message: `Property ${property.purpose === "Sell" ? "purchase" : "rental"
              } order placed successfully. Redirecting to payment...`,
            paymentUrl: chapaResponse.checkout_url,
            paymentFlow: "immediate",
            data: {
              property: {
                _id: property._id,
                title: property.title,
                price: property.price,
                purpose: property.purpose,
                status: property.status,
                orderInfo: property.orderInfo,
              },
              paymentDeadline: dueDate,
              paymentUrl: chapaResponse.checkout_url,
              transactionReference: txRef,
              nextStep: "complete_payment_now",
            },
          });
        } else {
          throw new Error("Failed to generate Chapa payment URL");
        }
      } catch (chapaError) {
        console.error("❌ Chapa integration error during immediate payment:", chapaError);

        // If Chapa fails for immediate payment, fall back to "pay later" flow
        console.log("🔄 Falling back to 'pay later' flow due to Chapa error");
        // Continue to "pay later" flow below
      }
    }

    // PAY LATER FLOW - Order placed, payment can be completed later
    console.log("✅ Order placed successfully - payment can be completed later");

    return res.status(200).json({
      success: true,
      message: `Property ${property.purpose === "Sell" ? "purchase" : "rental"
        } order placed successfully! You can complete payment within ${property.paymentDeadline || 3
        } days (72 hours) from your orders.`,
      paymentFlow: paymentFlow === "later" ? "later" : "fallback",
      data: {
        property: {
          _id: property._id,
          title: property.title,
          price: property.price,
          purpose: property.purpose,
          status: property.status,
          orderInfo: property.orderInfo,
        },
        paymentDeadline: dueDate,
        nextStep: "complete_payment_later",
        paymentInstructions: "Go to 'My Orders' tab to complete payment when ready.",
      },
    });
  } catch (err) {
    console.error("Error ordering property:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while ordering property",
      error: err.message,
    });
  }
};

// @desc    Check and handle expired payments (Cron job endpoint)
// @route   POST /api/properties/check-expired-payments
// @access  Private (Admin) or can be called by cron job
exports.checkExpiredPayments = async (req, res) => {
  try {
    const now = new Date();

    // Find pending payments that are expired
    const expiredPayments = await Payment.find({
      paymentStatus: "Pending",
      dueDate: { $lt: now },
    }).populate("property user");

    let updatedProperties = 0;
    let updatedPayments = 0;

    for (const payment of expiredPayments) {
      try {
        // Update payment status to expired
        payment.paymentStatus = "Expired";
        payment.expiredAt = now;
        await payment.save();
        updatedPayments++;

        // Reset property status if it's still in ordered state
        const property = await Property.findById(payment.property._id);
        if (property && property.status === "Ordered") {
          property.status = "Available";
          property.orderInfo = undefined;
          property.currentBuyer = undefined;
          property.currentRenter = undefined;
          await property.save();
          updatedProperties++;

          console.log(
            `🔄 Reset property to available: ${property.title} (Payment ID: ${payment._id})`
          );
        } else if (property) {
          console.log(
            `ℹ️ Property ${property.title} status is "${property.status}", not resetting`
          );
        }

        // Log the expiration
        console.log(
          `⏰ Payment expired: ${payment._id} for property: ${payment.property?.title || "Unknown"
          }`
        );
      } catch (paymentError) {
        console.error(`Error processing payment ${payment._id}:`, paymentError);
      }
    }

    // Also check properties directly for 72-hour expiry (in case no payment record exists)
    const expiredProperties = await Property.find({
      status: "Ordered",
      "orderInfo.paymentDeadline": { $lt: now },
      "orderInfo.paymentStatus": "Pending"
    });

    for (const property of expiredProperties) {
      try {
        // Reset property to available
        property.status = "Available";
        property.orderInfo = undefined;
        property.currentBuyer = undefined;
        property.currentRenter = undefined;
        await property.save();
        updatedProperties++;

        console.log(`🔄 Property ${property.title} reset to available after 72-hour expiry`);
      } catch (propertyError) {
        console.error(`Error processing property ${property._id}:`, propertyError);
      }
    }

    console.log(
      `✅ Expired payments check completed: ${updatedPayments} payments expired, ${updatedProperties} properties reset`
    );

    res.json({
      success: true,
      message: `Checked expired payments: ${updatedPayments} payments expired, ${updatedProperties} properties reset to available`,
      data: {
        expiredPayments: updatedPayments,
        resetProperties: updatedProperties,
        totalChecked: expiredPayments.length,
      },
    });
  } catch (error) {
    console.error("❌ Check expired payments error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking expired payments",
      error: error.message,
    });
  }
};

exports.createCommunication = async (req, res) => {
  try {
    const { message, sendto } = req.body;

    const user = await User.findById(sendto);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!message || !sendto) {
      return res
        .status(400)
        .json({ message: "Please provide message and recipient" });
    }
    const property = await Property.findById(propertyId);
    if (!property)
      return res.status(404).json({ message: "Property not found" });

    let chat = await Communication.findOne({ property: propertyId });
    if (!chat) {
      chat = new Communication({
        property: propertyId,
        participants: [req.user._id, property.assignedBroker, property.owner],
      });
    }

    chat.messages.push({ sender: req.user._id, content: message });
    await chat.save();

    res.status(200).json({ success: true, chat });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get properties with pending payments for user
// @route   GET /api/properties/user/pending-payments
// @access  Private
exports.getPropertiesWithPendingPayments = async (req, res) => {
  try {
    console.log("🔍 DEBUG: Starting getPropertiesWithPendingPayments");
    console.log("🔍 DEBUG: User ID:", req.user._id);

    // Step 1: Find properties ordered by current user
    const properties = await Property.find({
      status: "Ordered",
      "orderInfo.orderedBy": req.user._id,
    })
      .populate("assignedBroker", "fname lname email phone")
      .populate("orderInfo.orderedBy", "fname lname email phone")
      .sort({ "orderInfo.orderDate": -1 });

    console.log(
      "🔍 DEBUG: Found properties with Ordered status:",
      properties.length
    );
    console.log(
      "🔍 DEBUG: Properties:",
      properties.map((p) => ({
        id: p._id,
        title: p.title,
        status: p.status,
        orderedBy: p.orderInfo?.orderedBy?._id,
      }))
    );

    // Step 2: Get property IDs
    const propertyIds = properties.map((property) => property._id);
    console.log("🔍 DEBUG: Property IDs to check for payments:", propertyIds);

    // Step 3: Find pending payments for these properties
    const pendingPayments = await Payment.find({
      property: { $in: propertyIds },
      user: req.user._id,
      paymentStatus: "Pending",
    });

    console.log("🔍 DEBUG: Found pending payments:", pendingPayments.length);
    console.log(
      "🔍 DEBUG: Payments:",
      pendingPayments.map((p) => ({
        id: p._id,
        property: p.property,
        user: p.user,
        status: p.paymentStatus,
        amount: p.amount,
      }))
    );

    // Step 4: Create payment map
    const paymentMap = {};
    pendingPayments.forEach((payment) => {
      paymentMap[payment.property.toString()] = payment;
    });

    console.log("🔍 DEBUG: Payment map:", paymentMap);

    // Step 5: Combine properties with payments
    const propertiesWithPayments = properties
      .map((property) => {
        const payment = paymentMap[property._id.toString()];
        return {
          ...property.toObject(),
          pendingPayment: payment
            ? {
              _id: payment._id,
              amount: payment.amount,
              paymentType: payment.paymentType,
              dueDate: payment.dueDate,
              paymentUrl: payment.paymentUrl,
              chapaReference: payment.chapaReference,
              createdAt: payment.createdAt,
            }
            : null,
        };
      })
      .filter((property) => property.pendingPayment !== null);

    console.log(
      "🔍 DEBUG: Final properties with payments:",
      propertiesWithPayments.length
    );

    res.json({
      success: true,
      data: {
        properties: propertiesWithPayments,
        count: propertiesWithPayments.length,
        summary: {
          totalPending: propertiesWithPayments.length,
          totalAmount: propertiesWithPayments.reduce(
            (sum, property) => sum + (property.pendingPayment?.amount || 0),
            0
          ),
        },
        // Add debug info to response
        _debug: {
          propertiesFound: properties.length,
          paymentsFound: pendingPayments.length,
          finalResults: propertiesWithPayments.length,
        },
      },
    });
  } catch (error) {
    console.error("❌ Get pending payments error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching properties with pending payments",
      error: error.message,
    });
  }
};

// @desc    Get all approved & available properties AND Ordered properties with pending payment (with filters & pagination)
// @route   GET /api/properties
// @access  Public
exports.getProperties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      propertyType,
      purpose,
      city,
      minPrice,
      maxPrice,
      search,
      status,
    } = req.query;

    const pageNum = Math.max(Number(page), 1);
    const limitNum = Math.max(Number(limit), 1);

    // ✅ Handle status filter from query parameter
    let filter = {};
    
    if (status) {
      // If specific status is requested, filter by that status only
      filter.status = status;
    } else {
      // Default behavior: Show Available properties AND Ordered properties with pending payment
      filter = {
        $or: [
          { status: "Available" },
          {
            status: "Ordered",
            "orderInfo.paymentStatus": "Pending",
          },
        ],
      };
    }

    // ✅ Case-insensitive optional filters + regex for partial matches
    if (propertyType)
      filter.propertyType = {
        $regex: new RegExp(".*" + propertyType + ".*", "i"),
      };

    if (purpose)
      filter.purpose = { $regex: new RegExp(".*" + purpose + ".*", "i") };

    if (city) filter.city = { $regex: new RegExp(".*" + city + ".*", "i") };

    // Price filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Keyword search filter - maintain existing status conditions
    if (search) {
      const searchConditions = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { propertyType: { $regex: search, $options: "i" } },
          { city: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
        ],
      };

      if (status) {
        // If specific status is requested, combine with search
        filter = {
          $and: [
            { status: status },
            searchConditions
          ]
        };
      } else {
        // Default behavior with search
        filter = {
          $and: [
            {
              $or: [
                { status: "Available" },
                {
                  status: "Ordered",
                  "orderInfo.paymentStatus": "Pending",
                },
              ],
            },
            searchConditions
          ],
        };
      }
    }

    // Fetch data
    const properties = await Property.find(filter)
      .populate("owner", "lname city")
      .populate("assignedBroker", "fname lname email phone")
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort({ createdAt: -1 });

    const total = await Property.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      properties,
    });
  } catch (err) {
    console.error("Error fetching properties:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching properties.",
    });
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private (Owner, Admin)
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if user is owner or admin
    if (
      property.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this property" });
    }

    // Create update data object
    const updateData = { ...req.body };

    // Owners can only update certain fields
    if (
      property.owner.toString() === req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      const allowedFields = [
        "title",
        "description",
        "price",
        "currency",
        "city",
        "location",
        "images",
        "homeDetails",
        "carDetails",
        "electronicsDetails",
        "rentDetails",
      ];

      // Filter out fields that are not allowed
      Object.keys(updateData).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });

      // Reset approval status if owner updates property
      updateData.approvedByAdmin = false;
      updateData.status = "Pending";
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("owner", "fname lname email phone city")
      .populate("assignedBroker", "fname lname email phone");

    res.json({
      success: true, // Added success flag for consistency
      message: "Property updated successfully",
      property: updatedProperty,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private (Owner, Admin)
exports.deleteProperty = async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  // Check if user is owner or admin
  if (
    property.owner.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res
      .status(403)
      .json({ message: "Not authorized to delete this property" });
  }

  await Property.findByIdAndDelete(req.params.id);

  res.json({ message: "Property removed successfully" });
};

// @desc    Complete property order (Mark as Sold/Rented)
// @route   PATCH /api/properties/:id/complete
// @access  Private (Owner, Admin)
exports.completeOrder = async (req, res) => {
  const property = await Property.findById(req.params.id).populate(
    "orderInfo.orderedBy",
    "fname lname email phone role"
  );

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  if (property.status !== "Ordered") {
    return res.status(400).json({
      message: "Property is not in ordered state",
    });
  }

  // Check if user is owner or admin
  if (
    property.owner.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      message: "Not authorized to complete this order",
    });
  }

  // Update property status based on purpose
  property.status = property.purpose === "Sell" ? "Sold" : "Rented";
  if (req.body.paymentStatus) {
    property.orderInfo.paymentStatus = req.body.paymentStatus;
  }

  await property.save();

  // Update buyer/tenant role if needed
  if (property.orderInfo.orderedBy) {
    const orderedByUser = await User.findById(property.orderInfo.orderedBy._id);
    if (orderedByUser && ["buyer", "tenant"].includes(orderedByUser.role)) {
      await User.findByIdAndUpdate(orderedByUser._id, { role: "client" });
    }
  }

  res.json({
    message: `Property marked as ${property.status} successfully`,
    property,
  });
};

// @desc    Assign broker to property
// @route   PATCH /api/properties/:id/assign-broker
// @access  Private (Admin only)
exports.assignBroker = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const { brokerId } = req.body;

  const broker = await User.findById(brokerId);
  if (!broker || broker.role !== "broker") {
    return res.status(404).json({ message: "Broker not found" });
  }

  const property = await Property.findByIdAndUpdate(
    req.params.id,
    { assignedBroker: brokerId },
    { new: true }
  )
    .populate("owner", "fname lname email phone city")
    .populate("assignedBroker", "fname lname email phone");

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  res.json({
    message: "Broker assigned successfully",
    property,
  });
};

// // @desc    Get user's properties
// // @route   GET /api/properties/user/my-properties
// // @access  Private
exports.getMyProperties = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  let filter = { owner: req.user._id };
  if (status) filter.status = status;

  const properties = await Property.find(filter)
    .populate("assignedBroker", "fname lname email phone")
    .populate("owner", "fname lname email phone city")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await Property.countDocuments(filter);

  res.json({
    properties,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
};

// @desc    Get broker's assigned properties
// @route   GET /api/properties/broker/assigned
// @access  Private (Broker only)
exports.getBrokerProperties = async (req, res) => {
  if (req.user.role !== "broker") {
    return res.status(403).json({ message: "Broker access required" });
  }

  const { page = 1, limit = 10, status } = req.query;

  let filter = { assignedBroker: req.user._id };
  if (status) filter.status = status;

  const properties = await Property.find(filter)
    .populate("owner", "fname lname email phone city")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await Property.countDocuments(filter);

  res.json({
    properties,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
};

// @desc    Admin get all pending properties for approval
// @route   GET /api/properties/admin/pending
// @access  Private (Admin only)
exports.getPendingProperties = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const { page = 1, limit = 10 } = req.query;

  const properties = await Property.find({
    // approvedByAdmin: false,
    status: "Pending",
  })
    .populate("owner", "fname lname email phone city")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await Property.countDocuments({
    // approvedByAdmin: false,
    status: "Pending",
  });

  res.json({
    properties,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
};

// @desc    Update property after successful payment
// @route   PUT /api/properties/:id/payment-success
// @access  Private
exports.updatePropertyAfterPayment = async (req, res) => {
  try {
    const { paymentId, paymentType, isCommissionPayment } = req.body;
    const propertyId = req.params.id;

    console.log("🔄 Updating property after payment:", {
      propertyId,
      paymentId,
      paymentType,
      isCommissionPayment,
      userId: req.user._id,
    });

    // Find property with populated fields
    const property = await Property.findById(propertyId)
      .populate("currentBuyer")
      .populate("currentRenter")
      .populate("owner");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Verify payment exists and is successful
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.paymentStatus !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Payment is not completed",
      });
    }

    // Check if user is authorized to update this property
    const isBuyer =
      property.currentBuyer &&
      property.currentBuyer._id.toString() === req.user._id.toString();
    const isRenter =
      property.currentRenter &&
      property.currentRenter._id.toString() === req.user._id.toString();
    const isOwner = property.owner._id.toString() === req.user._id.toString();

    if (!isBuyer && !isRenter && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this property",
      });
    }

    // Update property based on payment type
    if (isCommissionPayment) {
      // Commission payment logic
      if (isBuyer || isRenter) {
        property.orderInfo.buyerCommissionPaid = true;
        console.log("✅ Buyer commission marked as paid");
      } else if (isOwner) {
        property.orderInfo.sellerCommissionPaid = true;
        console.log("✅ Seller commission marked as paid");
      }

      // Update total commission received
      const commissionAmount =
        property.orderInfo.commissionAmount || property.price * 0.02; // 2% default
      property.totalCommissionReceived += commissionAmount;

      console.log("💰 Commission payment processed:", {
        buyerPaid: property.orderInfo.buyerCommissionPaid,
        sellerPaid: property.orderInfo.sellerCommissionPaid,
        totalCommission: property.totalCommissionReceived,
      });
    } else {
      // Main property payment logic

      // Verify property is in correct state
      if (property.status !== "Ordered") {
        return res.status(400).json({
          success: false,
          message: `Property is not in ordered state. Current status: ${property.status}`,
        });
      }

      // Update payment reference
      if (property.orderInfo) {
        property.orderInfo.paymentId = paymentId;
      }

      // For booking fee payment, keep status as "Ordered"
      // For full payment, you might want to change status based on your business logic
      if (paymentType === "full_payment") {
        // Option 1: Change to Sold/Rented immediately
        // property.status = property.purpose === "Rent" ? "Rented" : "Sold";

        // Option 2: Keep as "Ordered" until admin completes the order (recommended)
        property.status = "Ordered";
        property.orderInfo.fullPaymentCompleted = true;

        console.log("✅ Full payment completed for property");
      } else if (paymentType === "booking_fee") {
        property.status = "Ordered";
        property.orderInfo.bookingFeePaid = true;
        console.log("✅ Booking fee payment completed");
      }

      // Update payment status in the payment record if needed
      payment.relatedProperty = propertyId;
      await payment.save();
    }

    await property.save();

    // Populate the response
    const updatedProperty = await Property.findById(propertyId)
      .populate("owner", "fname lname email phone")
      .populate("currentBuyer", "fname lname email phone")
      .populate("currentRenter", "fname lname email phone")
      .populate("assignedBroker", "fname lname email phone");

    console.log("✅ Property updated successfully after payment");

    res.json({
      success: true,
      message: "Property updated successfully after payment",
      data: {
        property: updatedProperty,
        paymentStatus: payment.paymentStatus,
        paymentType: paymentType,
        isCommissionPayment: isCommissionPayment,
      },
    });
  } catch (error) {
    console.error("❌ Update property after payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating property after payment",
      error: error.message,
    });
  }
};

// @desc    Debug payment creation
// @route   POST /api/properties/debug-payment-creation
// @access  Private
exports.debugPaymentCreation = async (req, res) => {
  try {
    const { propertyId } = req.body;

    console.log("🔍 DEBUG: Testing payment creation for property:", propertyId);
    console.log("🔍 DEBUG: User ID:", req.user._id);

    // Find the property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    console.log("🔍 DEBUG: Property found:", {
      id: property._id,
      title: property.title,
      status: property.status,
      price: property.price,
      orderInfo: property.orderInfo,
    });

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      property: propertyId,
      user: req.user._id,
    });

    console.log("🔍 DEBUG: Existing payment:", existingPayment);

    res.json({
      success: true,
      data: {
        property: property,
        existingPayment: existingPayment,
        user: req.user._id,
      },
    });
  } catch (error) {
    console.error("❌ Debug payment creation error:", error);
    res
      .status(500)
      .json({ success: false, message: "Debug failed", error: error.message });
  }
};

// @desc    Get properties ordered by current user with payment info
// @route   GET /api/property/user/orders
// @access  Private
exports.getUserOrderedProperties = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    console.log("🔍 Getting ordered properties for user:", req.user._id);
    console.log("📋 Request query params:", { page, limit, status });

    // ✅ FIXED: Find properties that are either:
    // 1. Currently ordered by user (orderInfo.orderedBy exists)
    // 2. Completed properties (Sold/Rented) where user is the buyer/renter
    let filter = {
      $or: [
        // Currently ordered properties
        { "orderInfo.orderedBy": req.user._id },
        // Completed properties where user is buyer
        {
          status: "Sold",
          currentBuyer: req.user._id
        },
        // Completed properties where user is renter
        {
          status: "Rented",
          currentRenter: req.user._id
        }
      ]
    };

    // Optional status filter
    if (status && status !== "all") {
      filter.status = status;
    }

    const properties = await Property.find(filter)
      .populate("owner", "fname lname email phone")
      .populate("assignedBroker", "fname lname email phone")
      .populate("orderInfo.orderedBy", "fname lname email phone")
      .populate("currentBuyer", "fname lname email phone")
      .populate("currentRenter", "fname lname email phone")
      .sort({ updatedAt: -1 }) // Sort by last updated (includes completed transactions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // ✅ ENHANCED: Get payment information for each property
    const propertiesWithPayments = await Promise.all(
      properties.map(async (property) => {
        const payment = await Payment.findOne({
          property: property._id,
          user: req.user._id,
        }).sort({ createdAt: -1 }); // Get the latest payment

        // ✅ ENHANCED: Determine display status for frontend
        let displayStatus = property.status;
        let paymentStatus = "No Payment";

        if (payment) {
          paymentStatus = payment.paymentStatus;

          // If property is completed (Sold/Rented), show as "Completed"
          if (property.status === "Sold" || property.status === "Rented") {
            displayStatus = "Completed";
          }
          // If property is ordered with pending payment
          else if (property.status === "Ordered" && payment.paymentStatus === "Pending") {
            displayStatus = "Payment Pending";
          }
          // If property is ordered with completed payment
          else if (property.status === "Ordered" && payment.paymentStatus === "Completed") {
            displayStatus = "Processing"; // Should not happen, but just in case
          }
        }

        return {
          ...property.toObject(),
          displayStatus, // Add display status for frontend
          paymentInfo: payment
            ? {
              _id: payment._id,
              paymentStatus: payment.paymentStatus,
              amount: payment.amount,
              paymentUrl: payment.paymentUrl,
              dueDate: payment.dueDate,
              chapaReference: payment.chapaReference,
              paymentDate: payment.paymentDate,
              createdAt: payment.createdAt,
            }
            : null,
        };
      })
    );

    const total = await Property.countDocuments(filter);

    console.log(`✅ Found ${properties.length} ordered/completed properties for user`);
    console.log("📦 Properties with payments:", propertiesWithPayments.map(p => ({
      id: p._id,
      title: p.title,
      status: p.status,
      displayStatus: p.displayStatus,
      orderInfo: p.orderInfo,
      paymentInfo: p.paymentInfo
    })));

    res.status(200).json({
      success: true,
      data: {
        properties: propertiesWithPayments, // ✅ Now includes payment info and completed properties
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    console.error("❌ Get user ordered properties error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching your ordered properties",
      error: error.message,
    });
  }
};

// @desc    Get dashboard statistics for admin
// @route   GET /api/property/admin/dashboard-stats
// @access  Private (Admin only)
exports.getAdminDashboardStats = async (req, res) => {
  try {
    console.log("🔍 Fetching admin dashboard stats...");

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Get all users count
    const users = await User.find({});
    const totalUsers = users.length;
    const totalBrokers = users.filter((user) => user.role === "broker").length;
    const totalClients = users.filter((user) => user.role === "client").length;
    const pendingVerifications = users.filter(
      (user) => !user.isVerified
    ).length;

    // Get all properties
    const properties = await Property.find({});
    const totalProperties = properties.length;
    const pendingProperties = properties.filter(
      (p) => p.status === "Pending"
    ).length;
    const availableProperties = properties.filter(
      (p) => p.status === "Available"
    ).length;
    const orderedProperties = properties.filter(
      (p) => p.status === "Ordered"
    ).length;
    const soldProperties = properties.filter((p) => p.status === "Sold").length;
    const rentedProperties = properties.filter(
      (p) => p.status === "Rented"
    ).length;

    // FIXED: Count ALL ordered properties as payment pending
    const paymentPendingProperties = orderedProperties;

    console.log("🏠 Property stats:", {
      totalProperties,
      pendingProperties,
      availableProperties,
      orderedProperties,
      soldProperties,
      rentedProperties,
      paymentPendingProperties,
    });

    // Get broker assignments count
    const brokerAssignments = await Property.countDocuments({
      assignedBroker: { $exists: true, $ne: null },
    });

    // Get recent properties for dashboard 
    const recentPropertiesRaw = await Property.find({})
      .populate("owner", "fname lname email")
      .populate("assignedBroker", "fname lname email phone")
      .populate("orderInfo.orderedBy", "fname lname email")
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate total commission for each property
    const recentProperties = await Promise.all(
      recentPropertiesRaw.map(async (property) => {
        const propertyObj = property.toObject();

        // Only calculate commission for sold or rented properties
        if (property.status === "Sold" || property.status === "Rented") {
          try {
            // Get all commission payments for this property
            const commissionPayments = await Payment.find({
              property: property._id,
              paymentType: "broker_commission",
              paymentStatus: "Completed"
            });

            if (commissionPayments && commissionPayments.length > 0) {
              // Sum all commission amounts (buyer + seller)
              propertyObj.commission = commissionPayments.reduce((total, payment) => total + payment.amount, 0);
              console.log(`🔍 Property ${property.title}: Found ${commissionPayments.length} commission payments, total: ${propertyObj.commission}`);
            } else {
              // No commission payments found, calculate expected total (4%)
              propertyObj.commission = property.price * 0.04;
              console.log(`🔍 Property ${property.title}: No commission payments, calculated 4%: ${propertyObj.commission}`);
            }
          } catch (error) {
            console.error("Error calculating commission for property:", property._id, error);
            propertyObj.commission = property.price * 0.04;
          }
        } else {
          propertyObj.commission = 0;
        }

        return propertyObj;
      })
    );

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          brokers: totalBrokers,
          clients: totalClients,
          pendingVerifications: pendingVerifications,
        },
        properties: {
          total: totalProperties,
          pending: pendingProperties,
          available: availableProperties,
          ordered: orderedProperties,
          sold: soldProperties,
          rented: rentedProperties,
          paymentPending: paymentPendingProperties,
        },
        brokerAssignments: brokerAssignments,
        recentProperties: recentProperties,
      },
    });
  } catch (error) {
    console.error("❌ Get admin dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message,
    });
  }
};

// @desc    Get all properties for admin management
// @route   GET /api/property/admin/all-properties
// @access  Private (Admin only)
exports.getAllPropertiesForAdmin = async (req, res) => {
  try {
    console.log("🔍 Fetching all properties for admin...");

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { page = 1, limit = 1000, status, search } = req.query;

    let filter = {};

    // Filter by status if provided
    if (status && status !== "all") {
      filter.status = status;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { propertyType: { $regex: search, $options: "i" } },
        { "owner.fname": { $regex: search, $options: "i" } },
        { "owner.lname": { $regex: search, $options: "i" } },
      ];
    }

    const properties = await Property.find(filter)
      .populate("owner", "fname lname email phone")
      .populate("assignedBroker", "fname lname email phone")
      .populate("orderInfo.orderedBy", "fname lname email phone")
      .populate("currentBuyer", "fname lname email phone")
      .populate("currentRenter", "fname lname email phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Property.countDocuments(filter);

    console.log(`✅ Found ${properties.length} properties for admin`);

    res.status(200).json({
      success: true,
      data: {
        properties,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    console.error("❌ Get all properties for admin error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching properties",
      error: error.message,
    });
  }
};

exports.getBrokerDashboardStats = async (req, res) => {
  try {
    if (req.user.role !== "broker") {
      return res.status(403).json({ message: "Broker access required" });
    }

    const brokerId = req.user._id;

    // Get assigned properties count by status
    const propertyStats = await Property.aggregate([
      { $match: { assignedBroker: brokerId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get commission summary
    const commissionSummary = await Payment.aggregate([
      {
        $match: {
          $or: [{ broker: brokerId }, { assignedBroker: brokerId }],
          paymentType: "broker_commission",
        },
      },
      {
        $group: {
          _id: "$paymentStatus",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent commissions
    const recentCommissions = await Payment.find({
      $or: [{ broker: brokerId }, { assignedBroker: brokerId }],
      paymentType: "broker_commission",
    })
      .populate("property", "title propertyType")
      .populate("user", "fname lname email")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        propertyStats,
        commissionSummary,
        recentCommissions,
        brokerInfo: {
          brokerId,
          name: `${req.user.fname} ${req.user.lname}`,
          email: req.user.email,
        },
      },
    });
  } catch (error) {
    console.error("Get broker dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching broker dashboard stats",
      error: error.message,
    });
  }
};

// @desc    Get public statistics for home page
// @route   GET /api/property/public/stats
// @access  Public
exports.getPublicStats = async (req, res) => {
  try {
    console.log("🔍 Fetching public stats for home page...");

    // Get ALL properties count (regardless of status)
    const totalProperties = await Property.countDocuments({});

    // Also get available properties count for reference
    const availableProperties = await Property.countDocuments({
      $or: [
        { status: "Available" },
        {
          status: "Ordered",
          "orderInfo.paymentStatus": "Pending",
        },
      ],
    });

    // Get verified brokers count
    const verifiedBrokers = await User.countDocuments({
      role: "broker",
      isVerified: true,
    });

    // Get happy clients count (all verified clients)
    const happyClients = await User.countDocuments({
      role: "client",
      isVerified: true,
    });

    // Get unique cities count
    const cities = await Property.distinct("city");
    const citiesCovered = cities.length;

    console.log("📊 Public stats results:", {
      totalProperties,
      availableProperties,
      verifiedBrokers,
      happyClients,
      citiesCovered,
    });

    res.json({
      success: true,
      data: {
        totalProperties,
        availableProperties,
        verifiedBrokers,
        happyClients,
        citiesCovered: citiesCovered > 50 ? "50+" : citiesCovered.toString(),
      },
    });
  } catch (error) {
    console.error("❌ Get public stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching public statistics",
      error: error.message,
    });
  }
};
