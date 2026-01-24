// Enhanced Ethiopian phone number validation
const ethiopianPhoneRegex = /^(\+2519|09)\d{8}$/;
// Enhanced email validation
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const validators = {
  // Email validation
  validateEmail: (email) => {
    if (!email) return false;
    return emailRegex.test(email.toLowerCase().trim());
  },

  // Ethiopian phone number validation
  validateEthiopianPhone: (phone) => {
    if (!phone) return false;
    const cleanedPhone = phone.replace(/[\s\-]/g, "");
    return ethiopianPhoneRegex.test(cleanedPhone);
  },

  // Format Ethiopian phone number to consistent format
  formatEthiopianPhone: (phone) => {
    if (!phone) return phone;
    const cleanedPhone = phone.replace(/[\s\-]/g, "");

    // If it starts with 09, convert to +2519 format
    if (cleanedPhone.startsWith("09")) {
      return "+2519" + cleanedPhone.substring(2);
    }

    // If it already starts with +2519, return as is
    if (cleanedPhone.startsWith("+2519")) {
      return cleanedPhone;
    }

    return cleanedPhone;
  },

  // Format phone for display
  formatPhoneForDisplay: (phone) => {
    if (!phone) return phone;
    const cleanedPhone = phone.replace(/[\s\-]/g, "");

    // If it starts with +2519, convert to 09 format for display
    if (cleanedPhone.startsWith("+2519")) {
      return "09" + cleanedPhone.substring(5);
    }

    return cleanedPhone;
  },

  // Password strength validation
  validatePassword: (password) => {
    return password && password.length >= 6;
  },

  // Name validation
  validateName: (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return (
      name && nameRegex.test(name) && name.length >= 2 && name.length <= 50
    );
  },

  // City validation
  validateCity: (city) => {
    return city && city.trim().length >= 2;
  },
};

module.exports = validators;
