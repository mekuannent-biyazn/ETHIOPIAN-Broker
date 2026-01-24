import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { useTranslation } from "react-i18next";

const ManualVerificationDialog = ({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  onVerificationSuccess,
}) => {
  const [formData, setFormData] = useState({
    transactionReference: "",
    amount: "",
    paymentMethod: "Chapa",
    transactionDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationData, setVerificationData] = useState(null);
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || "en");

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setLanguage(lng);
    };
    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  // Fetch verification form data when dialog opens
  useEffect(() => {
    if (isOpen && propertyId) {
      fetchVerificationData();
    }
  }, [isOpen, propertyId]);

  // Validation function for transaction reference
  const isValidTransactionReference = (reference) => {
    if (!reference || reference.length < 10) return false;

    // Exclude commission payment references
    if (reference.startsWith("broker-comm-")) return false;

    // Updated pattern to exclude commission payments but include valid property payment formats
    const chapaReferencePattern =
      /^(ethio_broker_|chapa_|tx_ref_|CHK_|TXN_)\w+/i;
    return chapaReferencePattern.test(reference);
  };

  const fetchVerificationData = async () => {
    try {
      const response = await axios.get(
        `/api/manual-verification/verification-form/${propertyId}`,
      );
      if (response.data.success) {
        setVerificationData(response.data.data);
        // Pre-fill expected amount
        setFormData((prev) => ({
          ...prev,
          amount: response.data.data.paymentInfo.totalAmount.toString(),
        }));
      }
    } catch (error) {
      console.error("Error fetching verification data:", error);
      setError(t("manualVerification.fetchError"));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate required fields
      if (!formData.transactionReference.trim()) {
        throw new Error(t("manualVerification.referenceRequired"));
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error(t("manualVerification.amountRequired"));
      }

      // Validate transaction reference format
      if (!isValidTransactionReference(formData.transactionReference.trim())) {
        if (formData.transactionReference.trim().startsWith("broker-comm-")) {
          throw new Error(t("manualVerification.commissionReferenceError"));
        }
        throw new Error(t("manualVerification.invalidReferenceFormat"));
      }

      console.log("🔍 Submitting manual verification:", {
        propertyId,
        ...formData,
      });

      const response = await axios.post(
        "/api/manual-verification/manual-verify-transaction",
        {
          propertyId,
          transactionReference: formData.transactionReference.trim(),
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          transactionDate: formData.transactionDate || new Date().toISOString(),
        },
      );

      if (response.data.success) {
        setSuccess(t("manualVerification.success"));

        // Call success callback after a short delay
        setTimeout(() => {
          onVerificationSuccess && onVerificationSuccess(response.data.data);
          onClose();
        }, 2000);
      } else {
        throw new Error(
          response.data.message || t("manualVerification.failed"),
        );
      }
    } catch (error) {
      console.error("❌ Manual verification error:", error);

      let errorMessage = t("manualVerification.failed") + " ";
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;

        // Add helpful hints for common errors
        if (
          error.response.data.message.includes(
            "Invalid transaction reference format",
          )
        ) {
          errorMessage += "\n\n" + t("manualVerification.referenceTip");
        }
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += t("manualVerification.checkDetails");
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        transactionReference: "",
        amount: "",
        paymentMethod: "Chapa",
        transactionDate: "",
      });
      setError("");
      setSuccess("");
      setVerificationData(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const formatPrice = (price) => {
    const currency = language === "am" ? "ETB" : "ETB";
    const locale = language === "am" ? "am-ET" : "en-ET";

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        dir={language === "am" ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div
            className="flex items-center justify-between"
            style={language === "am" ? { flexDirection: "row-reverse" } : {}}
          >
            <div>
              <h2 className="text-xl font-bold">
                {t("manualVerification.title")}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {t("manualVerification.subtitle")}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-white hover:text-blue-200 transition-colors disabled:opacity-50"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Property Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              {t("manualVerification.propertyDetails")}
            </h3>
            <p className="text-gray-700 font-medium">{propertyTitle}</p>
            {verificationData && (
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("manualVerification.propertyPrice")}:
                  </span>
                  <span className="font-medium">
                    {formatPrice(verificationData.paymentInfo.baseAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("manualVerification.buyerCommission")}:
                  </span>
                  <span className="font-medium">
                    {formatPrice(verificationData.paymentInfo.buyerCommission)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="text-gray-900 font-semibold">
                    {t("manualVerification.totalAmount")}:
                  </span>
                  <span className="font-bold text-blue-600">
                    {formatPrice(verificationData.paymentInfo.totalAmount)}
                  </span>
                </div>
                {verificationData.existingPayments &&
                  verificationData.existingPayments.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">
                        {t("manualVerification.existingPayment")}:
                      </h4>
                      {verificationData.existingPayments.map(
                        (payment, index) => (
                          <div
                            key={payment.id}
                            className="text-xs text-blue-800"
                          >
                            <div className="flex justify-between">
                              <span>{t("common.status")}:</span>
                              <span className="font-medium">
                                {payment.status}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t("common.amount")}:</span>
                              <span className="font-medium">
                                {formatPrice(payment.amount)}
                              </span>
                            </div>
                            {payment.transactionReference && (
                              <div className="flex justify-between">
                                <span>
                                  {t("manualVerification.reference")}:
                                </span>
                                <span className="font-mono text-xs">
                                  {payment.transactionReference}
                                </span>
                              </div>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div
              className="flex items-center"
              style={language === "am" ? { flexDirection: "row-reverse" } : {}}
            >
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className={language === "am" ? "mr-3" : "ml-3"}>
                <p className="text-sm text-blue-800">
                  {t("manualVerification.instruction")}
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <div
                className="flex items-start"
                style={
                  language === "am" ? { flexDirection: "row-reverse" } : {}
                }
              >
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p
                  className={language === "am" ? "mr-3 text-right" : "ml-3"}
                  style={language === "am" ? { textAlign: "right" } : {}}
                >
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <div
                className="flex items-start"
                style={
                  language === "am" ? { flexDirection: "row-reverse" } : {}
                }
              >
                <svg
                  className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p
                  className={language === "am" ? "mr-3 text-right" : "ml-3"}
                  style={language === "am" ? { textAlign: "right" } : {}}
                >
                  {success}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Transaction Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("manualVerification.transactionReference")} *
              </label>
              <input
                type="text"
                name="transactionReference"
                value={formData.transactionReference}
                onChange={handleInputChange}
                placeholder={t("manualVerification.referencePlaceholder")}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formData.transactionReference &&
                  !isValidTransactionReference(formData.transactionReference)
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
                required
                disabled={loading}
                dir="ltr" // Always LTR for reference numbers
              />
              <div
                className="mt-1 space-y-1"
                style={language === "am" ? { textAlign: "right" } : {}}
              >
                <p className="text-xs text-gray-500">
                  {t("manualVerification.referenceHint")}
                </p>
                {formData.transactionReference &&
                  !isValidTransactionReference(
                    formData.transactionReference,
                  ) && (
                    <p
                      className="text-xs text-red-600 flex items-center"
                      style={
                        language === "am"
                          ? {
                              flexDirection: "row-reverse",
                              justifyContent: "flex-end",
                            }
                          : {}
                      }
                    >
                      <span className={language === "am" ? "ml-1" : "mr-1"}>
                        ❌
                      </span>
                      {formData.transactionReference.startsWith("broker-comm-")
                        ? t("manualVerification.commissionReferenceWarning")
                        : t("manualVerification.invalidReferenceWarning")}
                    </p>
                  )}
                {formData.transactionReference &&
                  isValidTransactionReference(
                    formData.transactionReference,
                  ) && (
                    <p
                      className="text-xs text-green-600 flex items-center"
                      style={
                        language === "am"
                          ? {
                              flexDirection: "row-reverse",
                              justifyContent: "flex-end",
                            }
                          : {}
                      }
                    >
                      <span className={language === "am" ? "ml-1" : "mr-1"}>
                        ✅
                      </span>
                      {t("manualVerification.validReference")}
                    </p>
                  )}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("manualVerification.amountPaid")} (ETB) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder={t("manualVerification.amountPlaceholder")}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min="1"
                step="0.01"
                disabled={loading}
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("manualVerification.paymentMethod")}
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="Chapa">{t("manualVerification.chapa")}</option>
                <option value="Bank Transfer">
                  {t("manualVerification.bankTransfer")}
                </option>
                <option value="Cash">{t("manualVerification.cash")}</option>
                <option value="Other">{t("manualVerification.other")}</option>
              </select>
            </div>

            {/* Transaction Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("manualVerification.transactionDate")} (
                {t("common.optional")})
              </label>
              <input
                type="datetime-local"
                name="transactionDate"
                value={formData.transactionDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Action Buttons */}
            <div
              className="flex space-x-3 pt-4"
              style={language === "am" ? { flexDirection: "row-reverse" } : {}}
            >
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  !formData.transactionReference.trim() ||
                  !formData.amount ||
                  !isValidTransactionReference(
                    formData.transactionReference.trim(),
                  )
                }
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div
                    className="flex items-center justify-center"
                    style={
                      language === "am" ? { flexDirection: "row-reverse" } : {}
                    }
                  >
                    <div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                      style={
                        language === "am"
                          ? { marginLeft: "0.5rem" }
                          : { marginRight: "0.5rem" }
                      }
                    ></div>
                    {t("manualVerification.verifying")}
                  </div>
                ) : (
                  t("manualVerification.verifyPayment")
                )}
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {t("manualVerification.troubleText")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualVerificationDialog;
