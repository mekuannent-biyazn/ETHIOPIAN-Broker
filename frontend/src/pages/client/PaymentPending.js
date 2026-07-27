import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import axios from "../../api/axios";

const PaymentPending = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [payment, setPayment] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [message, setMessage] = useState("");

  const paymentId = searchParams.get("payment_id");
  const txRef = searchParams.get("tx_ref");

  useEffect(() => {
    if (paymentId || txRef) {
      fetchPaymentStatus();
    } else {
      setMessage(t("client.noPaymentInfoFound"));
      setLoading(false);
    }
  }, [paymentId, txRef]);

  const fetchPaymentStatus = async () => {
    try {
      setLoading(true);
      let paymentData;

      if (paymentId) {
        const response = await axios.get(`/api/payments/${paymentId}/status`);
        paymentData = response.data.data;
      } else if (txRef) {
        const response = await axios.get(`/api/payments/verify/${txRef}`);
        paymentData = response.data.data?.payment;
      }

      if (paymentData) {
        setPayment(paymentData);

        if (paymentData.property) {
          const propertyResponse = await axios.get(
            `/api/property/view/${paymentData.property._id}`,
          );
          setProperty(propertyResponse.data.property || propertyResponse.data);
        }

        if (paymentData.paymentStatus === "Completed") {
          navigate(`/payment/success?payment_id=${paymentData._id}`);
        }
      } else {
        setMessage(t("client.paymentInfoNotFound"));
      }
    } catch (error) {
      console.error("Error fetching payment status:", error);
      setMessage(t("client.paymentStatusError"));
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    setCheckingStatus(true);
    setMessage(t("client.checkingPaymentStatus"));

    try {
      await fetchPaymentStatus();

      if (payment && payment.paymentStatus === "Pending") {
        setMessage(t("client.paymentStillProcessing"));
      }
    } catch (error) {
      console.error("Error checking payment:", error);
      setMessage(t("client.paymentCheckError"));
    } finally {
      setCheckingStatus(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">
            {t("client.loadingPaymentInfo")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-yellow-600 text-white py-8 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {t("client.paymentProcessing")}
            </h1>
            <p className="text-xl opacity-90">
              {t("client.paymentProcessingDescription")}
            </p>
          </div>

          {/* Payment Details */}
          <div className="p-8">
            {message && (
              <div className="bg-blue-100 text-blue-700 p-4 rounded-lg mb-6">
                {message}
              </div>
            )}

            {payment && (
              <div className="space-y-6">
                {/* Transaction Summary */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {t("client.transactionDetails")}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        {t("client.transactionReference")}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {payment.chapaReference}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {t("client.amount")}
                      </p>
                      <p className="font-semibold text-yellow-600 text-xl">
                        {formatPrice(payment.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {t("client.paymentStatus")}
                      </p>
                      <p className="font-semibold text-yellow-600">
                        {payment.paymentStatus}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {t("client.dueDate")}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {payment.dueDate
                          ? new Date(payment.dueDate).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                {property && (
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      {t("client.propertyDetails")}
                    </h2>
                    <div className="flex items-center space-x-4">
                      {property.images && property.images.length > 0 && (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {property.title}
                        </h3>
                        <p className="text-gray-600">{property.propertyType}</p>
                        <p className="text-gray-600">
                          {t("client.for")} {property.purpose}
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatPrice(property.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* What to Expect */}
                <div className="bg-green-50 p-6 rounded-lg">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {t("client.whatToExpectNext")}
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">✅</span>
                      <div>
                        <p className="font-semibold">
                          {t("client.paymentConfirmation")}
                        </p>
                        <p className="text-gray-600">
                          {t("client.paymentConfirmationDescription")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📧</span>
                      <div>
                        <p className="font-semibold">
                          {t("client.emailNotification")}
                        </p>
                        <p className="text-gray-600">
                          {t("client.emailNotificationDescription")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🤝</span>
                      <div>
                        <p className="font-semibold">
                          {t("client.brokerContact")}
                        </p>
                        <p className="text-gray-600">
                          {t("client.brokerContactDescription")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Troubleshooting */}
                <div className="bg-yellow-50 p-6 rounded-lg">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {t("client.havingIssues")}
                  </h2>
                  <ul className="text-yellow-700 space-y-2">
                    <li>• {t("client.paymentProcessingTime")}</li>
                    <li>• {t("client.checkEmailConfirmation")}</li>
                    <li>• {t("client.ensureChapaPayment")}</li>
                    <li>• {t("client.contactSupportIfDelayed")}</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={checkPaymentStatus}
                disabled={checkingStatus}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white text-center py-4 px-6 rounded-lg font-semibold text-lg transition duration-200"
              >
                {checkingStatus ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {t("client.checking")}
                  </span>
                ) : (
                  t("client.checkPaymentStatus")
                )}
              </button>

              <Link
                to="/client"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-4 px-6 rounded-lg font-semibold text-lg transition duration-200"
              >
                {t("client.goToDashboard")}
              </Link>

              <Link
                to="/properties"
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-center py-4 px-6 rounded-lg font-semibold text-lg transition duration-200"
              >
                {t("client.browseProperties")}
              </Link>
            </div>

            {/* Support Info */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                {t("client.needHelp")}{" "}
                <a
                  href="mailto:support@ethiobroker.com"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  support@ethiobroker.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPending;
