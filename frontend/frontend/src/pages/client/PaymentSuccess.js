import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import axios from "../../api/axios";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [payment, setPayment] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [printLoading, setPrintLoading] = useState(false);
  const receiptRef = useRef();

  const paymentId = searchParams.get("payment_id");
  const txRef = searchParams.get("tx_ref");
  const status = searchParams.get("status");
  const amount = searchParams.get("amount");
  const propertyId = searchParams.get("property_id");

  useEffect(() => {
    console.log("Payment Success - URL Parameters:", {
      paymentId,
      txRef,
      status,
      amount,
      propertyId,
    });

    verifyPayment();
  }, [paymentId, txRef]);

  const verifyPayment = async () => {
    try {
      setLoading(true);
      let paymentData = null;

      if (paymentId) {
        console.log("🔄 Method 1: Fetching payment by ID:", paymentId);
        try {
          const response = await axios.get(`/api/payments/${paymentId}/status`);
          if (response.data.success) {
            paymentData = response.data.data;
            console.log("✅ Payment found by ID:", paymentData);
          }
        } catch (error) {
          console.log("❌ Method 1 failed:", error.response?.data);
        }
      }

      if (!paymentData && txRef) {
        console.log("🔄 Method 2: Verifying by transaction reference:", txRef);
        try {
          const response = await axios.get(`/api/payments/verify/${txRef}`);
          if (response.data.success) {
            paymentData = response.data.data?.payment;
            console.log("✅ Payment found by tx_ref:", paymentData);
          }
        } catch (error) {
          console.log("❌ Method 2 failed:", error.response?.data);
        }
      }

      if (!paymentData) {
        console.log("🔄 Method 3: Fetching recent completed payment");
        try {
          const response = await axios.get(
            "/api/payments/user/my-payments?limit=5&status=Completed"
          );
          if (response.data.success && response.data.data.payments.length > 0) {
            const recentPayments = response.data.data.payments;

            if (propertyId) {
              paymentData = recentPayments.find(
                (p) => p.property && p.property._id === propertyId
              );
            }

            if (!paymentData) {
              paymentData = recentPayments[0];
            }

            console.log("✅ Recent payment found:", paymentData);
          }
        } catch (error) {
          console.log("❌ Method 3 failed:", error.response?.data);
        }
      }

      if (paymentData) {
        setPayment(paymentData);

        if (paymentData.property) {
          await fetchPropertyDetails(
            paymentData.property._id || paymentData.property || propertyId
          );
        } else if (propertyId) {
          await fetchPropertyDetails(propertyId);
        }

        setMessage("");
      } else {
        setMessage(t("client.paymentProcessingMessage"));
      }
    } catch (error) {
      console.error("❌ Payment verification error:", error);
      setMessage(t("client.paymentVerificationInProgress"));
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyDetails = async (propId) => {
    if (!propId) return;

    try {
      console.log("🔄 Fetching property details:", propId);
      const response = await axios.get(`/api/property/${propId}`);
      setProperty(response.data.property || response.data);
      console.log("✅ Property details loaded");
    } catch (error) {
      console.error("Error fetching property details:", error);
    }
  };

  const formatPrice = (price) => {
    if (!price) return "ETB 0.00";
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString();
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrint = async () => {
    setPrintLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.print();
    } catch (error) {
      console.error("Print error:", error);
    } finally {
      setPrintLoading(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setMessage("");
    verifyPayment();
  };

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .receipt-container, .receipt-container * {
          visibility: visible;
        }
        .receipt-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: white;
          box-shadow: none;
          margin: 0;
          padding: 0;
        }
        .no-print {
          display: none !important;
        }
        .print-only {
          display: block !important;
        }
        .bg-green-600 { background: #059669 !important; -webkit-print-color-adjust: exact; }
        .bg-gray-50 { background: #f9fafb !important; -webkit-print-color-adjust: exact; }
        .bg-blue-50 { background: #eff6ff !important; -webkit-print-color-adjust: exact; }
        .bg-purple-50 { background: #faf5ff !important; -webkit-print-color-adjust: exact; }
        .bg-yellow-50 { background: #fefce8 !important; -webkit-print-color-adjust: exact; }
        .text-green-600 { color: #059669 !important; }
      }
      .print-only {
        display: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">
            {t("client.verifyingPayment")}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {t("client.pleaseWaitConfirmation")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Main Content */}
        <div
          ref={receiptRef}
          className="receipt-container bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-green-600 text-white py-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {t("client.paymentSuccessful")}
            </h1>
            <p className="text-xl opacity-90">
              {t("client.paymentSuccessfulDescription")}
            </p>
          </div>

          {/* Payment Details */}
          <div className="p-8">
            {message && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg mb-6">
                <div className="flex items-start">
                  <div className="py-1">
                    <svg
                      className="h-6 w-6 text-yellow-500 mr-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{message}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        onClick={handleRetry}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm font-medium transition duration-200"
                      >
                        {t("client.retryVerification")}
                      </button>
                      <Link
                        to="/client/payment-history"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition duration-200"
                      >
                        {t("client.checkPaymentHistory")}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {payment ? (
              <div className="space-y-6">
                {/* Transaction Summary */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                    {t("client.transactionSummary")}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        {t("client.transactionId")}
                      </p>
                      <p className="font-semibold text-gray-900 text-lg font-mono">
                        {payment.chapaReference || payment._id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        {t("client.paymentId")}
                      </p>
                      <p className="font-semibold text-gray-900 font-mono">
                        {payment._id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        {t("client.amountPaid")}
                      </p>
                      <p className="font-semibold text-green-600 text-2xl">
                        {formatPrice(payment.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        {t("client.paymentStatus")}
                      </p>
                      <p className="font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm inline-block">
                        {payment.paymentStatus || t("client.completed")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        {t("client.paymentDate")}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(payment.paymentDate || payment.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        {t("client.paymentMethod")}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {payment.paymentMethod || "Chapa"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                {property && (
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                      {t("client.propertyDetails")}
                    </h2>
                    <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
                      {property.images && property.images.length > 0 && (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-32 h-32 object-cover rounded-lg shadow-md"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {property.title}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm text-gray-600">
                              {t("client.propertyType")}
                            </p>
                            <p className="font-medium text-gray-900">
                              {property.propertyType}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              {t("client.purpose")}
                            </p>
                            <p className="font-medium text-gray-900 capitalize">
                              {property.purpose}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              {t("client.location")}
                            </p>
                            <p className="font-medium text-gray-900">
                              {property.city || property.location || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              {t("client.propertyPrice")}
                            </p>
                            <p className="font-medium text-gray-900">
                              {formatPrice(property.price)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Commission Breakdown */}
                {(payment.paymentBreakdown || payment.buyerCommission) && (
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                      {t("client.paymentBreakdown")}
                    </h2>
                    <div className="space-y-3 max-w-md mx-auto">
                      <div className="flex justify-between items-center py-2 border-b border-purple-100">
                        <span className="text-gray-600">
                          {t("client.propertyAmount")}:
                        </span>
                        <span className="font-semibold">
                          {formatPrice(
                            payment.paymentBreakdown?.propertyAmount ||
                              payment.amount - (payment.buyerCommission || 0)
                          )}
                        </span>
                      </div>
                      {payment.buyerCommission > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-purple-100">
                          <span className="text-gray-600">
                            {t("client.buyerCommission")} (2%):
                          </span>
                          <span className="font-semibold text-blue-600">
                            {formatPrice(
                              payment.paymentBreakdown?.buyerCommission ||
                                payment.buyerCommission
                            )}
                          </span>
                        </div>
                      )}
                      {payment.sellerCommission > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-purple-100">
                          <span className="text-gray-600">
                            {t("client.sellerCommission")} (2%):
                          </span>
                          <span className="font-semibold text-orange-600">
                            {formatPrice(
                              payment.paymentBreakdown?.sellerCommission ||
                                payment.sellerCommission
                            )}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-3 border-t-2 border-purple-300 mt-2">
                        <span className="text-lg font-bold text-gray-900">
                          {t("client.totalPaid")}:
                        </span>
                        <span className="text-xl font-bold text-green-600">
                          {formatPrice(
                            payment.paymentBreakdown?.totalAmount ||
                              payment.amount
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Commission Note */}
                    {(payment.buyerCommission > 0 ||
                      payment.sellerCommission > 0) && (
                      <div className="mt-4 p-4 bg-white rounded-lg border border-purple-100">
                        <p className="text-sm text-gray-600 text-center">
                          💡 <strong>{t("client.note")}:</strong>{" "}
                          {t("client.commissionNote")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Next Steps */}
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                    {t("client.whatsNext")}
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <span className="text-2xl mt-1">📧</span>
                      <div>
                        <p className="font-semibold text-lg">
                          {t("client.confirmationEmail")}
                        </p>
                        <p className="text-gray-600">
                          {t("client.confirmationEmailDescription")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <span className="text-2xl mt-1">🤝</span>
                      <div>
                        <p className="font-semibold text-lg">
                          {t("client.brokerContact")}
                        </p>
                        <p className="text-gray-600">
                          {t("client.brokerContactDescription")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <span className="text-2xl mt-1">📋</span>
                      <div>
                        <p className="font-semibold text-lg">
                          {t("client.documentation")}
                        </p>
                        <p className="text-gray-600">
                          {t("client.documentationDescription")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print Section - Only visible in print */}
                <div className="print-only bg-white p-6 border-t">
                  <div className="text-center">
                    <h3 className="text-lg font-bold">
                      {t("client.officialReceipt")}
                    </h3>
                    <p className="text-gray-600">
                      ETHIO Broker - {t("client.propertyTransaction")}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {t("client.generatedOn")}:{" "}
                      {new Date().toLocaleDateString()}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {t("client.transactionId")}:{" "}
                      {payment.chapaReference || payment._id}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Fallback when no payment data is available
              <div className="text-center py-8">
                <div className="text-4xl mb-4">❓</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t("client.paymentInfoNotAvailable")}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t("client.paymentInfoNotAvailableDescription")}
                </p>
                <div className="bg-blue-50 p-6 rounded-lg max-w-md mx-auto">
                  <h3 className="font-semibold text-lg mb-2">
                    {t("client.whatToDoNext")}
                  </h3>
                  <ul className="text-left space-y-2 text-gray-600">
                    <li>• {t("client.checkEmailPayment")}</li>
                    <li>• {t("client.visitDashboardPayment")}</li>
                    <li>• {t("client.contactSupportAssistance")}</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 no-print">
              <Link
                to="/client"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-4 px-6 rounded-lg font-semibold text-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                {t("client.goToDashboard")}
              </Link>
              <Link
                to="/payment-history"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-center py-4 px-6 rounded-lg font-semibold text-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                {t("client.viewPaymentHistory")}
              </Link>
              {payment && (
                <button
                  onClick={handlePrint}
                  disabled={printLoading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-center py-4 px-6 rounded-lg font-semibold text-lg transition duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {printLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {t("client.preparing")}
                    </>
                  ) : (
                    <>🖨️ {t("client.printReceipt")}</>
                  )}
                </button>
              )}
            </div>

            {/* Support Information */}
            <div className="mt-8 p-6 bg-gray-100 rounded-lg no-print">
              <h3 className="font-semibold text-lg mb-2">
                {t("client.needHelp")}
              </h3>
              <p className="text-gray-600 mb-3">
                {t("client.supportTeamDescription")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600">📞</span>
                  <span>{t("client.supportPhone")}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600">✉️</span>
                  <span>{t("client.supportEmail")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
