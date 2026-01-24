const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/transporter"); // This imports the sendEmail function
const { createUserRegistrationNotification } = require("../utils/notificationHelper");

// Register user
exports.registerUser = async (req, res, next) => {
  try {
    const { fname, lname, email, password, confirmPassword, phone, city, nationalId, tinNumber } =
      req.body;

    // Validation
    if (!fname || !lname || !email || !password || !confirmPassword || !phone || !city || !nationalId || !tinNumber) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    // Validate phone number (Ethiopian format: +2519XXXXXXXX or 09XXXXXXXX)
    if (!/^(\+2519|09)\d{8}$/.test(phone)) {
      return res.status(400).json({ message: "Phone number must start with +2519 or 09 followed by 8 digits" });
    }

    // Validate FIN number (12 digits)
    if (!/^\d{12}$/.test(nationalId)) {
      return res.status(400).json({ message: "FIN number must be exactly 12 digits" });
    }

    // Validate Fan number (16 digits)
    if (!/^\d{16}$/.test(tinNumber)) {
      return res.status(400).json({ message: "Fan number must be exactly 16 digits" });
    }

    // Check if all required photos were uploaded
    if (!req.files || !req.files.idPhotoFront || !req.files.idPhotoBack || !req.files.selfiePhoto) {
      return res.status(400).json({ message: "Please upload all required photos: ID front, ID back, and selfie" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Password and Confirm Password do not match" });
    }

    // Check if user already exists by email, phone, nationalId, or tinNumber
    const existingUser = await User.findOne({
      $or: [
        { email },
        { phone },
        { nationalId },
        { tinNumber }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already exists" });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({ message: "Phone number already exists" });
      }
      if (existingUser.nationalId === nationalId) {
        return res.status(400).json({ message: "FIN number already exists" });
      }
      if (existingUser.tinNumber === tinNumber) {
        return res.status(400).json({ message: "Fan number already exists" });
      }
    }

    // Determine role based on user count
    const count = await User.countDocuments();
    let assignRole = "client";
    if (count === 0) assignRole = "admin";
    else if (count === 1) assignRole = "broker";

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Get uploaded file paths
    const idPhotoFrontPath = req.files.idPhotoFront[0].path.replace(/\\/g, '/');
    const idPhotoBackPath = req.files.idPhotoBack[0].path.replace(/\\/g, '/');
    const selfiePhotoPath = req.files.selfiePhoto[0].path.replace(/\\/g, '/');

    // Create user
    const user = await User.create({
      fname,
      lname,
      email,
      password: hash,
      phone,
      city,
      nationalId,
      tinNumber,
      idPhotoFront: idPhotoFrontPath,
      idPhotoBack: idPhotoBackPath,
      selfiePhoto: selfiePhotoPath,
      role: assignRole,
      verificationToken,
      verificationTokenExpiry,
    });

    // Create verification URLs
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    const adminVerificationUrl = `${process.env.CLIENT_URL}/admin/verify-user?userId=${user._id}`;

    // Send verification email to user
    await sendEmail({
      email: user.email,
      subject: "Account Verification - M4S Brokerage",
      message: `
        <h2>Email Verification</h2>
        <p>Hello ${user.fname},</p>
        <p>Your account has been successfully created. Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" target="_blank" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
          Verify Email Address
        </a>
        <p>Or copy this link: ${verificationUrl}</p>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `,
    });

    // Send notification to admin
    const adminEmail = process.env.ADMIN_EMAIL
    await sendEmail({
      email: adminEmail,
      subject: "New User Registration",
      message: `
        <h2>New User Registered - M4S Brokerage</h2>
        <p>A new user has registered:</p>
        <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr><td><strong>Name:</strong></td><td>${user.fname} ${user.lname}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${user.email}</td></tr>
          <tr><td><strong>Phone:</strong></td><td>${user.phone}</td></tr>
          <tr><td><strong>City:</strong></td><td>${user.city}</td></tr>
          <tr><td><strong>FIN Number:</strong></td><td>${user.nationalId}</td></tr>
          <tr><td><strong>Fan Number:</strong></td><td>${user.tinNumber}</td></tr>
          <tr><td><strong>Role:</strong></td><td>${user.role}</td></tr>
          <tr><td><strong>Registration Date:</strong></td><td>${new Date().toLocaleString()}</td></tr>
        </table>
        
        <div style="margin: 20px 0;">
          <p><strong>Quick Actions:</strong></p>
          <a href="${adminVerificationUrl}" target="_blank" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px;">
            ✅ Verify User Manually
          </a>
          <a href="${process.env.CLIENT_URL}/admin/users" target="_blank" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px;">
            👥 View All Users
          </a>
        </div>
        
        <p><strong>User ID:</strong> ${user._id}</p>
        <p><strong>Verification Token:</strong> ${verificationToken}</p>
        <p><strong>ID Photos:</strong> Front: ${idPhotoFrontPath}, Back: ${idPhotoBackPath}, Selfie: ${selfiePhotoPath}</p>
      `,
    });

    // ✅ CREATE NOTIFICATION FOR ADMINS ABOUT NEW USER REGISTRATION
    try {
      // Get all admin users
      const admins = await User.find({ role: "admin" }, "_id");

      // Create notifications for all admins
      for (const admin of admins) {
        await createUserRegistrationNotification(
          admin._id,
          `${user.fname} ${user.lname}`,
          user.role
        );
      }

      console.log(`✅ User registration notifications sent to ${admins.length} admins`);
    } catch (notificationError) {
      console.error("❌ Error creating user registration notifications:", notificationError);
      // Don't fail user registration if notifications fail
    }

    res.status(201).json({
      message: "User created successfully. Please check your email for verification link.",
      _id: user.id,
      fname: user.fname,
      lname: user.lname,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// Verify email with token
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // Find user with valid token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification link." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    // Mark as verified and clear token
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.status(200).json({
      message: "Email verified successfully, you can now log in!"
    });
  } catch (error) {
    res.status(500).json({ message: "Error verifying email", error: error.message });
  }
};

// Resend verification email
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found!" });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "User is already verified" });
    }

    // Generate new token
    const token = crypto.randomBytes(32).toString("hex");
    user.verificationToken = token;
    user.verificationTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Create verification URL
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

    // Send email
    await sendEmail({
      email: user.email,
      subject: "Resend Email Verification - ETHIO Broker",
      message: `
        <h2>Email Verification</h2>
        <p>Hello ${user.fname},</p>
        <p>You requested a new verification link. Click below to verify your email:</p>
        <a href="${verificationUrl}" target="_blank" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
          Verify Email Address
        </a>
        <p>Or copy this link: ${verificationUrl}</p>
        <p>This link will expire in 10 minutes.</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Verification email resent successfully. Please check your inbox.",
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Enter Email and Password!" });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(400).json({ message: "This Email is not registered!" });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(403).json({ 
        message: "Your account has been deactivated. Please contact the administrator." 
      });
    }

    // Check if verified
    if (!user.isVerified) {
      return res.status(400).json({
        message: "Email not verified. Please verify your email before logging in.",
      });
    }

    // Check password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Invalid Password!" });
    }

    // Generate token and respond
    const token = generateToken(user._id);

    return res.json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        name: user.fname,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token: token,
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateUserById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fname, lname, phone, city, password, confirmPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User Not found!" });
    }

    // Update basic info
    if (fname) user.fname = fname;
    if (lname) user.lname = lname;
    if (phone) user.phone = phone;
    if (city) user.city = city;

    // Update password if provided
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Password and Confirm Password do not match" });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    // Remove password from response
    const { password: _, ...updatedUser } = user.toObject();

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Please provide your email." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User with that email not found." });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Save token with expiry (1 hour)
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&id=${user._id}`;

    // Send reset email
    await sendEmail({
      email: user.email,
      subject: "Password Reset Request - ETHIO Broker",
      message: `
        <h3>Hello ${user.fname},</h3>
        <p>You requested to reset your password. Click the link below to set a new password. This link will expire in 1 hour.</p>
        <a href="${resetUrl}" target="_blank" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
          Reset Your Password
        </a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    res.status(200).json({
      message: "Password reset email sent. Please check your inbox."
    });
  } catch (error) {
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, id, password, confirmPassword } = req.body;

    // Validate input
    if (!token || !id) {
      return res.status(400).json({ message: "Invalid or missing reset token/ID." });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({ message: "Please provide and confirm your new password." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // Hash token for comparison
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      _id: id,
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token is invalid or has expired." });
    }

    // Update password
    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Send confirmation email
    await sendEmail({
      email: user.email,
      subject: "Password Changed Successfully - ETHIO Broker",
      message: `
        <h3>Hello ${user.fname},</h3>
        <p>Your password has been successfully changed. If you did not perform this action, please contact support immediately.</p>
        <p>You can now log in with your new password.</p>
      `,
    });

    // Generate new token for auto-login
    const jwtToken = generateToken(user._id);

    res.status(200).json({
      message: "Password reset successful",
      token: jwtToken
    });
  } catch (error) {
    next(error);
  }
};

// ==================== CHAT FUNCTIONALITY ====================

// Get available users for chat
exports.getAvailableUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get all users except current user
    const allUsers = await User.find({
      _id: { $ne: currentUserId },
    })
      .select("fname lname email role isOnline lastSeen avatar isApproved createdAt")
      .sort({ isOnline: -1, fname: 1, lname: 1 });

    // Filter based on user role
    const filteredUsers = allUsers.filter((user) => {
      // Admin can see everyone
      if (currentUser.role === "admin") return true;

      // Client can see brokers and admins
      if (currentUser.role === "client") {
        return user.role === "broker" || user.role === "admin";
      }

      // Broker can see clients, admins, and approved brokers
      if (currentUser.role === "broker") {
        if (user.role === "client" || user.role === "admin") return true;
        if (user.role === "broker") return user.isApproved;
      }

      return false;
    });

    res.json({
      success: true,
      users: filteredUsers,
      currentUserRole: currentUser.role,
      totalUsers: allUsers.length,
      filteredCount: filteredUsers.length,
      message: `${filteredUsers.length} users available for messaging`,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error("Error fetching available users");
    }
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
      details: error.message,
    });
  }
};

// Search users for chat
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);

    // Return empty if no search query
    if (!q || q.trim().length < 1) {
      return res.json({
        success: true,
        users: [],
      });
    }

    const searchQuery = q.trim().toLowerCase();

    // Get available users first
    const availableUsers = await User.find({
      _id: { $ne: currentUserId },
    }).select("fname lname email role isApproved");

    // Filter available users
    const available = availableUsers.filter((user) => {
      if (currentUser.role === "admin") return true;
      if (currentUser.role === "client") {
        return user.role === "broker" || user.role === "admin";
      }
      if (currentUser.role === "broker") {
        if (user.role === "client" || user.role === "admin") return true;
        if (user.role === "broker") return user.isApproved;
      }
      return false;
    });

    // Filter by search query
    const searchResults = available.filter(
      (user) =>
        user.fname?.toLowerCase().includes(searchQuery) ||
        user.lname?.toLowerCase().includes(searchQuery) ||
        user.email?.toLowerCase().includes(searchQuery) ||
        `${user.fname} ${user.lname}`.toLowerCase().includes(searchQuery)
    );

    res.json({
      success: true,
      users: searchResults,
      currentUserRole: currentUser.role,
      searchQuery: searchQuery,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error("Error searching users");
    }
    res.status(500).json({
      success: false,
      error: "Failed to search users",
    });
  }
};

// Get user by ID for chat
exports.getUserById = async (req, res) => {
  try {
    const currentUser = req.user;
    const targetUser = await User.findById(req.params.userId).select(
      "fname lname email role isOnline lastSeen avatar isApproved"
    );

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if communication is allowed
    const allowedCommunications = {
      client: ["broker", "admin"],
      broker: ["client", "admin", "broker"],
      admin: ["client", "broker", "admin"],
    };

    const isCommunicationAllowed = allowedCommunications[currentUser.role]?.includes(targetUser.role);

    if (!isCommunicationAllowed) {
      return res.status(403).json({
        success: false,
        message: `Communication not allowed from ${currentUser.role} to ${targetUser.role}`,
      });
    }

    res.json({
      success: true,
      user: targetUser,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error("Get user by ID error");
    }
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Get all brokers for admin
exports.getAllBrokers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    // Get all users with broker role
    const brokers = await User.find({ role: "broker" })
      .select("fname lname email phone city")
      .sort({ fname: 1 });

    res.status(200).json({
      success: true,
      brokers: brokers
    });
  } catch (error) {
    console.error("Error fetching brokers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching brokers",
      error: error.message
    });
  }
};