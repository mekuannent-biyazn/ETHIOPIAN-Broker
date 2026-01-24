const validators = require("../utils/validators");

const validationMiddleware = {
  // Validate user registration data
  validateRegistration: (req, res, next) => {
    const { fname, lname, email, phone, password, confirmPassword, city, nationalId, tinNumber } =
      req.body;
    const errors = [];

    // Validate first name
    if (!fname || fname.trim().length < 2) {
      errors.push("First name must be at least 2 characters long");
    } else if (!/^[a-zA-Z\s]+$/.test(fname)) {
      errors.push("First name can only contain letters and spaces");
    }

    // Validate last name
    if (!lname || lname.trim().length < 2) {
      errors.push("Last name must be at least 2 characters long");
    } else if (!/^[a-zA-Z\s]+$/.test(lname)) {
      errors.push("Last name can only contain letters and spaces");
    }

    // Validate email
    if (!email || !validators.validateEmail(email)) {
      errors.push(
        "Please provide a valid email address (e.g., user@example.com)"
      );
    }

    // Validate phone
    if (!phone || !validators.validateEthiopianPhone(phone)) {
      errors.push(
        "Phone number must start with +2519 or 09 followed by 8 digits"
      );
    }

    // Validate FIN number (12 digits)
    if (!nationalId || !/^\d{12}$/.test(nationalId)) {
      errors.push("FIN number must be exactly 12 digits");
    }

    // Validate Fan number (16 digits)
    if (!tinNumber || !/^\d{16}$/.test(tinNumber)) {
      errors.push("Fan number must be exactly 16 digits");
    }

    // Validate password
    if (!password || password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      errors.push("Passwords do not match");
    }

    // Validate city
    if (!city || city.trim().length < 2) {
      errors.push("City must be at least 2 characters long");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    // Format data before saving
    req.body.phone = validators.formatEthiopianPhone(phone);
    req.body.email = email.toLowerCase().trim();
    req.body.fname = fname.trim();
    req.body.lname = lname.trim();
    req.body.city = city.trim();
    req.body.nationalId = nationalId.trim();
    req.body.tinNumber = tinNumber.trim();

    next();
  },

  // Validate user login data
  validateLogin: (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !validators.validateEmail(email)) {
      errors.push("Please provide a valid email address");
    }

    if (!password) {
      errors.push("Please provide a password");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    req.body.email = email.toLowerCase().trim();
    next();
  },

  // Validate email for password reset
  validateEmail: (req, res, next) => {
    const { email } = req.body;

    if (!email || !validators.validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    req.body.email = email.toLowerCase().trim();
    next();
  },

  // Validate profile update
  validateProfileUpdate: (req, res, next) => {
    const { fname, lname, phone, city, password, confirmPassword } = req.body;
    const errors = [];

    // Validate first name
    if (fname && (fname.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(fname))) {
      errors.push(
        "First name must be at least 2 characters and contain only letters"
      );
    }

    // Validate last name
    if (lname && (lname.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(lname))) {
      errors.push(
        "Last name must be at least 2 characters and contain only letters"
      );
    }

    // Validate phone
    if (phone && !validators.validateEthiopianPhone(phone)) {
      errors.push("Please provide a valid Ethiopian phone number");
    }

    // Validate city
    if (city && city.trim().length < 2) {
      errors.push("City must be at least 2 characters long");
    }

    // Validate passwords
    if (password || confirmPassword) {
      if (password.length < 6) {
        errors.push("Password must be at least 6 characters long");
      }
      if (password !== confirmPassword) {
        errors.push("Passwords do not match");
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    // Format data
    if (phone) req.body.phone = validators.formatEthiopianPhone(phone);
    if (fname) req.body.fname = fname.trim();
    if (lname) req.body.lname = lname.trim();
    if (city) req.body.city = city.trim();

    next();
  },
};

module.exports = validationMiddleware;
