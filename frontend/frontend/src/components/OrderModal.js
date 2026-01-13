import React, { useState } from "react";
import { useOrder } from "../context/OrderContext";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const OrderModal = ({ property, isOpen, onClose, onOrderSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { orderProperty, loading, error } = useOrder();
  const { user, updateUserRole } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreedToTerms) {
      alert(t("orderModal.agreeToTerms"));
      return;
    }

    try {
      const result = await orderProperty(property._id, {
        paymentMethod,
        extraInfo,
      });

      // Update user role if it changed
      if (result.userRoleUpdated) {
        updateUserRole(result.newRole);
      }

      onOrderSuccess(result);
      onClose();
    } catch (error) {
      // Error is handled by context
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {property.purpose === "Sell"
              ? t("orderModal.purchaseOrder")
              : t("orderModal.rentalOrder")}{" "}
            - {property.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <h3 className="font-semibold text-blue-800 mb-2">
            {t("orderModal.orderProcess")}
          </h3>
          <p className="text-blue-700 text-sm">
            • {t("orderModal.step1")}
            <br />• {t("orderModal.step2")}
            <br />• {t("orderModal.step3")}
            <br />• {t("orderModal.step4")}{" "}
            {property.purpose === "Sell"
              ? t("properties.status.sold")
              : t("properties.status.rented")}{" "}
            {t("orderModal.afterPayment")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("orderModal.paymentMethod")} *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t("orderModal.selectPaymentMethod")}</option>
              <option value="Chapa">Chapa</option>
              <option value="Cash">{t("orderModal.cash")}</option>
              <option value="Bank Transfer">
                {t("orderModal.bankTransfer")}
              </option>
              <option value="Other">{t("orderModal.other")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("orderModal.additionalInfo")}
            </label>
            <textarea
              value={extraInfo}
              onChange={(e) => setExtraInfo(e.target.value)}
              rows="3"
              placeholder={t("orderModal.additionalInfoPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              {t("orderModal.agreeToTerms")}
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-md"
            >
              {loading
                ? t("orderModal.processing")
                : property.purpose === "Sell"
                ? t("orderModal.placePurchaseOrder")
                : t("orderModal.placeRentalOrder")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;
