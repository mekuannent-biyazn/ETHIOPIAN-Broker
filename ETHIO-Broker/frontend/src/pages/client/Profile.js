

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { validators } from "../../utils/validators";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    phone: "",
    city: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fname: user.fname || "",
        lname: user.lname || "",
        email: user.email || "",
        phone: validators.formatPhoneForDisplay(user.phone) || "",
        city: user.city || "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  const validateField = (name, value) => {
    switch (name) {
      case "fname":
        return validators.validateName(value, t("client.firstName"));
      case "lname":
        return validators.validateName(value, t("client.lastName"));
      case "phone":
        return value
          ? validators.validateEthiopianPhone(value)
          : { isValid: true, message: "" };
      case "city":
        return value
          ? validators.validateCity(value)
          : { isValid: true, message: "" };
      case "password":
        return value
          ? validators.validatePassword(value)
          : { isValid: true, message: "" };
      case "confirmPassword":
        return formData.password
          ? validators.validateConfirmPassword(formData.password, value)
          : { isValid: true, message: "" };
      default:
        return { isValid: true, message: "" };
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    const validation = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: validation.isValid ? "" : validation.message,
    }));
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    Object.keys(formData).forEach((field) => {
      if (field === "password" && !formData.password) {
        return;
      }

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
    setSuccess(false);

    if (!validateForm()) {
      setMessage(t("client.fixValidationErrors"));
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        fname: formData.fname.trim(),
        lname: formData.lname.trim(),
        city: formData.city.trim(),
      };

      if (formData.phone) {
        updateData.phone = validators.formatPhoneForStorage(formData.phone);
      }

      if (formData.password) {
        updateData.password = formData.password;
        updateData.confirmPassword = formData.confirmPassword;
      }

      const result = await updateProfile(updateData);

      if (result.success) {
        setMessage(t("client.profileUpdatedSuccess"));
        setSuccess(true);

        setFormData((prev) => ({
          ...prev,
          password: "",
          confirmPassword: "",
        }));

        setTimeout(() => {
          setMessage("");
          setSuccess(false);
        }, 5000);
      } else {
        setMessage(result.message || t("client.profileUpdateFailed"));
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage(t("client.profileUpdateError"));
    } finally {
      setLoading(false);
    }
  };

  const getInputClass = (fieldName) => {
    const baseClass =
      "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200";
    if (fieldErrors[fieldName]) {
      return `${baseClass} border-red-500 bg-red-50`;
    }
    return `${baseClass} border-gray-300`;
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader"></div>
        <span className="ml-2">{t("client.loadingProfile")}</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">
            {t("client.profileSettings")}
          </h1>
          <p className="text-blue-100">{t("client.updatePersonalInfo")}</p>
        </div>

        <div className="p-6">
          {/* User Info Summary */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {user.fname?.charAt(0)}
                {user.lname?.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {user.fname} {user.lname}
                </h3>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500 capitalize">
                  {user.role} •{" "}
                  {user.isVerified
                    ? t("client.verified")
                    : t("client.pendingVerification")}
                </p>
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-md border ${success
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-red-100 text-red-700 border-red-200"
                }`}
            >
              <div className="flex justify-between items-center">
                <span>{message}</span>
                <button
                  onClick={() => setMessage("")}
                  className="text-sm hover:opacity-70"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                {t("client.personalInformation")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="fname"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t("client.firstName")} *
                  </label>
                  <input
                    id="fname"
                    name="fname"
                    type="text"
                    required
                    className={getInputClass("fname")}
                    placeholder={t("client.enterFirstName")}
                    value={formData.fname}
                    onChange={handleChange}
                  />
                  {fieldErrors.fname && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.fname}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lname"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t("client.lastName")} *
                  </label>
                  <input
                    id="lname"
                    name="lname"
                    type="text"
                    required
                    className={getInputClass("lname")}
                    placeholder={t("client.enterLastName")}
                    value={formData.lname}
                    onChange={handleChange}
                  />
                  {fieldErrors.lname && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.lname}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t("client.phoneNumber")}
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className={getInputClass("phone")}
                    placeholder={t("client.phonePlaceholder")}
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.phone}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {t("client.phoneFormat")}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t("client.city")}
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    className={getInputClass("city")}
                    placeholder={t("client.enterCity")}
                    value={formData.city}
                    onChange={handleChange}
                  />
                  {fieldErrors.city && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.city}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("client.emailAddress")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                  value={formData.email}
                  readOnly
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t("client.emailCannotChange")}
                </p>
              </div>
            </div>

            {/* Password Change Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                {t("client.changePassword")}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {t("client.leavePasswordBlank")}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t("client.newPassword")}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className={getInputClass("password")}
                    placeholder={t("client.enterNewPassword")}
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.password}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {t("client.minimumCharacters")}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t("client.confirmNewPassword")}
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    className={getInputClass("confirmPassword")}
                    placeholder={t("client.confirmNewPassword")}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {t("client.updating")}
                  </span>
                ) : (
                  t("client.updateProfile")
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData({
                    fname: user.fname || "",
                    lname: user.lname || "",
                    email: user.email || "",
                    phone: validators.formatPhoneForDisplay(user.phone) || "",
                    city: user.city || "",
                    password: "",
                    confirmPassword: "",
                  });
                  setFieldErrors({});
                  setMessage("");
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200"
              >
                {t("client.resetForm")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
