// Basic validation utilities

export const validators = {
  // Name validation
  validateName: (name, fieldName = "Name") => {
    if (!name || !name.trim()) {
      return {
        isValid: false,
        message: `${fieldName} is required`,
      };
    }

    if (name.trim().length < 2) {
      return {
        isValid: false,
        message: `${fieldName} must be at least 2 characters`,
      };
    }

    if (name.trim().length > 50) {
      return {
        isValid: false,
        message: `${fieldName} cannot exceed 50 characters`,
      };
    }

    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return {
        isValid: false,
        message: `${fieldName} can only contain letters and spaces`,
      };
    }

    return {
      isValid: true,
      message: "",
    };
  },

  // Email validation
  validateEmail: (email) => {
    if (!email || !email.trim()) {
      return {
        isValid: false,
        message: "Email is required",
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return {
        isValid: false,
        message: "Please enter a valid email address",
      };
    }

    return {
      isValid: true,
      message: "",
    };
  },

  // Phone validation
  validatePhone: (phone) => {
    if (!phone || !phone.trim()) {
      return {
        isValid: false,
        message: "Phone number is required",
      };
    }

    // Basic phone validation - can be enhanced based on requirements
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone.trim())) {
      return {
        isValid: false,
        message: "Please enter a valid phone number",
      };
    }

    return {
      isValid: true,
      message: "",
    };
  },

  // City validation
  validateCity: (city) => {
    if (!city || !city.trim()) {
      return {
        isValid: false,
        message: "City is required",
      };
    }

    if (city.trim().length < 2) {
      return {
        isValid: false,
        message: "City name must be at least 2 characters",
      };
    }

    if (city.trim().length > 50) {
      return {
        isValid: false,
        message: "City name cannot exceed 50 characters",
      };
    }

    return {
      isValid: true,
      message: "",
    };
  },

  // Password validation
  validatePassword: (password) => {
    if (!password) {
      return {
        isValid: false,
        message: "Password is required",
      };
    }

    if (password.length < 6) {
      return {
        isValid: false,
        message: "Password must be at least 6 characters",
      };
    }

    return {
      isValid: true,
      message: "",
    };
  },

  // Confirm password validation
  validateConfirmPassword: (password, confirmPassword) => {
    if (!confirmPassword) {
      return {
        isValid: false,
        message: "Please confirm your password",
      };
    }

    if (password !== confirmPassword) {
      return {
        isValid: false,
        message: "Passwords do not match",
      };
    }

    return {
      isValid: true,
      message: "",
    };
  },

  // Ethiopian phone number validation
  validateEthiopianPhone: (phone) => {
    if (!phone || !phone.trim()) {
      return {
        isValid: false,
        message: "Phone number is required",
      };
    }

    const cleanedPhone = phone.replace(/[\s\-]/g, "");
    const ethiopianPhoneRegex = /^(?:\+251|0)(9[0-9]{8})$/;

    if (!ethiopianPhoneRegex.test(cleanedPhone)) {
      return {
        isValid: false,
        message: "Please enter a valid Ethiopian phone number (e.g., 0912345678 or +251912345678)",
      };
    }

    return {
      isValid: true,
      message: "",
    };
  },

  // Format phone for storage (convert to +251 format)
  formatPhoneForStorage: (phone) => {
    if (!phone) return phone;
    const cleanedPhone = phone.replace(/[\s\-]/g, "");

    if (cleanedPhone.startsWith("0")) {
      return "+251" + cleanedPhone.substring(1);
    }

    return cleanedPhone;
  },

  // Format phone for display (convert to 0 format)
  formatPhoneForDisplay: (phone) => {
    if (!phone) return phone;
    const cleanedPhone = phone.replace(/[\s\-]/g, "");

    if (cleanedPhone.startsWith("+251")) {
      return "0" + cleanedPhone.substring(4);
    }

    return cleanedPhone;
  },
};