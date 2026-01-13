import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { validators } from "../../utils/validators";

const Register = () => {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    phone: "",
    city: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const validateField = (name, value) => {
    switch (name) {
      case "fname":
        return validators.validateName(value, t("auth.firstName"));
      case "lname":
        return validators.validateName(value, t("auth.lastName"));
      case "email":
        return validators.validateEmail(value);
      case "phone":
        return validators.validateEthiopianPhone(value);
      case "city":
        return validators.validateCity(value);
      case "password":
        return validators.validatePassword(value);
      case "confirmPassword":
        return validators.validateConfirmPassword(formData.password, value);
      case "agreedToTerms":
        return value
          ? { isValid: true, message: "" }
          : { isValid: false, message: t("errors.termsRequired") };
      default:
        return { isValid: true, message: "" };
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setFormData({
      ...formData,
      [name]: fieldValue,
    });

    // Real-time validation
    const validation = validateField(name, fieldValue);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: validation.isValid ? "" : validation.message,
    }));
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Validate all fields
    Object.keys(formData).forEach((field) => {
      const validation = validateField(field, formData[field]);
      if (!validation.isValid) {
        errors[field] = validation.message;
        isValid = false;
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!validateForm()) {
      setMessage(t("errors.fixValidation"));
      setLoading(false);
      return;
    }

    if (!formData.agreedToTerms) {
      setMessage(t("errors.termsRequired"));
      setLoading(false);
      return;
    }

    // Format phone number before sending
    const formattedData = {
      ...formData,
      phone: validators.formatPhoneForStorage(formData.phone),
      email: formData.email.toLowerCase().trim(),
    };

    const result = await register(formattedData);

    if (result.success) {
      setMessage(t("success.registration"));
      setTimeout(() => {
        navigate("/verify-email");
      }, 3000);
    } else {
      // Enhanced error handling for rate limiting and validation errors
      if (result.message?.includes("Too many requests")) {
        setMessage(t("errors.tooManyRequests"));
      } else if (result.errors && Array.isArray(result.errors)) {
        setMessage(result.errors.join(", "));
      } else if (result.message?.includes("already exists")) {
        setMessage(t("errors.userExists"));
      } else {
        setMessage(result.message || t("errors.registrationFailed"));
      }
    }

    setLoading(false);
  };

  const getInputClass = (fieldName) => {
    const baseClass =
      "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200";
    if (fieldErrors[fieldName]) {
      return `${baseClass} border-red-500 bg-red-50`;
    }
    return `${baseClass} border-gray-300`;
  };

  const getCheckboxClass = () => {
    const baseClass =
      "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded";
    if (fieldErrors.agreedToTerms) {
      return `${baseClass} border-red-500`;
    }
    return baseClass;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t("auth.createAccount")}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t("auth.hasAccount")}{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {t("auth.signIn")}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="fname"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("auth.firstName")} *
              </label>
              <input
                id="fname"
                name="fname"
                type="text"
                required
                className={getInputClass("fname")}
                placeholder={t("auth.firstName")}
                value={formData.fname}
                onChange={handleChange}
              />
              {fieldErrors.fname && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.fname}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="lname"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("auth.lastName")} *
              </label>
              <input
                id="lname"
                name="lname"
                type="text"
                required
                className={getInputClass("lname")}
                placeholder={t("auth.lastName")}
                value={formData.lname}
                onChange={handleChange}
              />
              {fieldErrors.lname && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.lname}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("auth.email")} *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={getInputClass("email")}
              placeholder="user@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("auth.phone")} *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className={getInputClass("phone")}
                placeholder="+251912345678 or 0912345678"
                value={formData.phone}
                onChange={handleChange}
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {t("registration.ethiopianFormat")}
              </p>
            </div>

            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("auth.city")} *
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                className={getInputClass("city")}
                placeholder={t("auth.city")}
                value={formData.city}
                onChange={handleChange}
              />
              {fieldErrors.city && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.city}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("auth.password")} *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className={getInputClass("password")}
              placeholder={t("auth.password")}
              value={formData.password}
              onChange={handleChange}
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.password}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {t("registration.minPasswordLength")}
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("auth.confirmPassword")} *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className={getInputClass("confirmPassword")}
              placeholder={t("auth.confirmPassword")}
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2">
            <input
              id="agreedToTerms"
              name="agreedToTerms"
              type="checkbox"
              required
              className={getCheckboxClass()}
              checked={formData.agreedToTerms}
              onChange={handleChange}
            />
            <label
              htmlFor="agreedToTerms"
              className="block text-sm text-gray-900"
            >
              {t("registration.agreeToTerms")}{" "}
              <Link
                to="/terms"
                className="text-blue-600 hover:text-blue-500 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("terms.title")}
              </Link>{" "}
              *
            </label>
          </div>
          {fieldErrors.agreedToTerms && (
            <p className="mt-1 text-sm text-red-600">
              {fieldErrors.agreedToTerms}
            </p>
          )}

          {message && (
            <div
              className={`p-3 rounded-md ${
                message.includes("successful") ||
                message.includes("check your email")
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-red-100 text-red-700 border border-red-200"
              }`}
            >
              <div className="flex items-center">
                {message.includes("successful") ? (
                  <span className="text-green-500 mr-2">✓</span>
                ) : (
                  <span className="text-red-500 mr-2">⚠</span>
                )}
                {message}
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t("registration.creatingAccount")}
                </span>
              ) : (
                t("auth.createAccount")
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              {t("registration.byRegistering")}
            </p>
          </div>
        </form>

        {/* Additional Help Section */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            {t("registration.needHelp")}
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• {t("registration.allFieldsRequired")}</li>
            <li>• {t("registration.validEthiopianPhone")}</li>
            <li>• {t("registration.passwordMinLength")}</li>
            <li>• {t("registration.mustAgreeToTerms")}</li>
            <li>• {t("registration.checkEmailVerification")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;
