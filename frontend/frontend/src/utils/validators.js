// Ethiopian phone number validation regex
export const ethiopianPhoneRegex = /^(?:\+251|0)(9[0-9]{8})$/;
// Email validation regex
export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const validators = {
  // Email validation
  validateEmail: (email) => {
    if (!email) return { isValid: false, message: "Email is required" };
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        message: "Please enter a valid email address (e.g., user@example.com)",
      };
    }
    return { isValid: true, message: "" };
  },

  // Ethiopian phone number validation
  validateEthiopianPhone: (phone) => {
    if (!phone) return { isValid: false, message: "Phone number is required" };
    const cleanedPhone = phone.replace(/[\s-]/g, "");
    if (!ethiopianPhoneRegex.test(cleanedPhone)) {
      return {
        isValid: false,
        message:
          "Please enter a valid Ethiopian phone number starting with +251 or 0 followed by 9 digits (e.g., +251912345678 or 0912345678)",
      };
    }
    return { isValid: true, message: "" };
  },

  // Password validation
  validatePassword: (password) => {
    if (!password) return { isValid: false, message: "Password is required" };
    if (password.length < 6) {
      return {
        isValid: false,
        message: "Password must be at least 6 characters long",
      };
    }
    return { isValid: true, message: "" };
  },

  // Confirm password validation
  validateConfirmPassword: (password, confirmPassword) => {
    if (!confirmPassword)
      return { isValid: false, message: "Please confirm your password" };
    if (password !== confirmPassword) {
      return { isValid: false, message: "Passwords do not match" };
    }
    return { isValid: true, message: "" };
  },

  // Name validation
  validateName: (name, fieldName = "Name") => {
    if (!name) return { isValid: false, message: `${fieldName} is required` };
    if (name.trim().length < 2) {
      return {
        isValid: false,
        message: `${fieldName} must be at least 2 characters long`,
      };
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return {
        isValid: false,
        message: `${fieldName} can only contain letters and spaces`,
      };
    }
    return { isValid: true, message: "" };
  },

  // City validation
  validateCity: (city) => {
    if (!city) return { isValid: false, message: "City is required" };
    if (city.trim().length < 2) {
      return {
        isValid: false,
        message: "City must be at least 2 characters long",
      };
    }
    return { isValid: true, message: "" };
  },

  // Format phone number for display
  formatPhoneForDisplay: (phone) => {
    if (!phone) return phone;
    const cleanedPhone = phone.replace(/[\s-]/g, "");
    if (cleanedPhone.startsWith("+251")) {
      return "0" + cleanedPhone.substring(4);
    }
    return cleanedPhone;
  },

  // Format phone number for storage
  formatPhoneForStorage: (phone) => {
    if (!phone) return phone;
    const cleanedPhone = phone.replace(/[\s-]/g, "");
    if (cleanedPhone.startsWith("0")) {
      return "+251" + cleanedPhone.substring(1);
    }
    return cleanedPhone;
  },
};
