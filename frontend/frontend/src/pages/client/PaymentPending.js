// import React, { useState, useEffect } from "react";
// import { Link, useSearchParams, useNavigate } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";
// import { useTranslation } from "react-i18next";
// import axios from "../../api/axios";

// const PaymentPending = () => {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const { t } = useTranslation();
//   const [payment, setPayment] = useState(null);
//   const [property, setProperty] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [checkingStatus, setCheckingStatus] = useState(false);
//   const [message, setMessage] = useState("");

//   const paymentId = searchParams.get("payment_id");
//   const txRef = searchParams.get("tx_ref");

//   useEffect(() => {
//     if (paymentId || txRef) {
//       fetchPaymentStatus();
//     } else {
//       setMessage(t("client.noPaymentInfoFound"));
//       setLoading(false);
//     }
//   }, [paymentId, txRef]);

//   const fetchPaymentStatus = async () => {
//     try {
//       setLoading(true);
//       let paymentData;

//       if (paymentId) {
//         const response = await axios.get(`/api/payments/${paymentId}/status`);
//         paymentData = response.data.data;
//       } else if (txRef) {
//         const response = await axios.get(`/api/payments/verify/${txRef}`);
//         paymentData = response.data.data?.payment;
//       }

//       if (paymentData) {
//         setPayment(paymentData);

//         if (paymentData.property) {
//           const propertyResponse = await axios.get(
//             `/api/property/view/${paymentData.property._id}`
//           );
//           setProperty(propertyResponse.data.property || propertyResponse.data);
//         }

//         if (paymentData.paymentStatus === "Completed") {
//           navigate(`/payment/success?payment_id=${paymentData._id}`);
//         }
//       } else {
//         setMessage(t("client.paymentInfoNotFound"));
//       }
//     } catch (error) {
//       console.error("Error fetching payment status:", error);
//       setMessage(t("client.paymentStatusError"));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const checkPaymentStatus = async () => {
//     setCheckingStatus(true);
//     setMessage(t("client.checkingPaymentStatus"));

//     try {
//       await fetchPaymentStatus();

//       if (payment && payment.paymentStatus === "Pending") {
//         setMessage(t("client.paymentStillProcessing"));
//       }
//     } catch (error) {
//       console.error("Error checking payment:", error);
//       setMessage(t("client.paymentCheckError"));
//     } finally {
//       setCheckingStatus(false);
//     }
//   };

//   const formatPrice = (price) => {
//     return new Intl.NumberFormat("en-ET", {
//       style: "currency",
//       currency: "ETB",
//     }).format(price);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex justify-center items-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto mb-4"></div>
//           <p className="text-gray-600 text-lg">
//             {t("client.loadingPaymentInfo")}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-4xl mx-auto px-4">
//         <div className="bg-white rounded-xl shadow-lg overflow-hidden">
//           {/* Header */}
//           <div className="bg-yellow-600 text-white py-8 text-center">
//             <div className="text-6xl mb-4">⏳</div>
//             <h1 className="text-3xl md:text-4xl font-bold mb-2">
//               {t("client.paymentProcessing")}
//             </h1>
//             <p className="text-xl opacity-90">
//               {t("client.paymentProcessingDescription")}
//             </p>
//           </div>

//           {/* Payment Details */}
//           <div className="p-8">
//             {message && (
//               <div className="bg-blue-100 text-blue-700 p-4 rounded-lg mb-6">
//                 {message}
//               </div>
//             )}

//             {payment && (
//               <div className="space-y-6">
//                 {/* Transaction Summary */}
//                 <div className="bg-gray-50 p-6 rounded-lg">
//                   <h2 className="text-2xl font-bold text-gray-900 mb-4">
//                     {t("client.transactionDetails")}
//                   </h2>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <p className="text-sm text-gray-600">
//                         {t("client.transactionReference")}
//                       </p>
//                       <p className="font-semibold text-gray-900">
//                         {payment.chapaReference}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-600">
//                         {t("client.amount")}
//                       </p>
//                       <p className="font-semibold text-yellow-600 text-xl">
//                         {formatPrice(payment.amount)}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-600">
//                         {t("client.paymentStatus")}
//                       </p>
//                       <p className="font-semibold text-yellow-600">
//                         {payment.paymentStatus}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-600">
//                         {t("client.dueDate")}
//                       </p>
//                       <p className="font-semibold text-gray-900">
//                         {payment.dueDate
//                           ? new Date(payment.dueDate).toLocaleDateString()
//                           : "N/A"}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Property Details */}
//                 {property && (
//                   <div className="bg-blue-50 p-6 rounded-lg">
//                     <h2 className="text-2xl font-bold text-gray-900 mb-4">
//                       {t("client.propertyDetails")}
//                     </h2>
//                     <div className="flex items-center space-x-4">
//                       {property.images && property.images.length > 0 && (
//                         <img
//                           src={property.images[0]}
//                           alt={property.title}
//                           className="w-20 h-20 object-cover rounded-lg"
//                         />
//                       )}
//                       <div>
//                         <h3 className="text-xl font-semibold text-gray-900">
//                           {property.title}
//                         </h3>
//                         <p className="text-gray-600">{property.propertyType}</p>
//                         <p className="text-gray-600">
//                           {t("client.for")} {property.purpose}
//                         </p>
//                         <p className="text-lg font-bold text-blue-600">
//                           {formatPrice(property.price)}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* What to Expect */}
//                 <div className="bg-green-50 p-6 rounded-lg">
//                   <h2 className="text-2xl font-bold text-gray-900 mb-4">
//                     {t("client.whatToExpectNext")}
//                   </h2>
//                   <div className="space-y-3">
//                     <div className="flex items-center space-x-3">
//                       <span className="text-2xl">✅</span>
//                       <div>
//                         <p className="font-semibold">
//                           {t("client.paymentConfirmation")}
//                         </p>
//                         <p className="text-gray-600">
//                           {t("client.paymentConfirmationDescription")}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-center space-x-3">
//                       <span className="text-2xl">📧</span>
//                       <div>
//                         <p className="font-semibold">
//                           {t("client.emailNotification")}
//                         </p>
//                         <p className="text-gray-600">
//                           {t("client.emailNotificationDescription")}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-center space-x-3">
//                       <span className="text-2xl">🤝</span>
//                       <div>
//                         <p className="font-semibold">
//                           {t("client.brokerContact")}
//                         </p>
//                         <p className="text-gray-600">
//                           {t("client.brokerContactDescription")}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Troubleshooting */}
//                 <div className="bg-yellow-50 p-6 rounded-lg">
//                   <h2 className="text-2xl font-bold text-gray-900 mb-4">
//                     {t("client.havingIssues")}
//                   </h2>
//                   <ul className="text-yellow-700 space-y-2">
//                     <li>• {t("client.paymentProcessingTime")}</li>
//                     <li>• {t("client.checkEmailConfirmation")}</li>
//                     <li>• {t("client.ensureChapaPayment")}</li>
//                     <li>• {t("client.contactSupportIfDelayed")}</li>
//                   </ul>
//                 </div>
//               </div>
//             )}

//             {/* Action Buttons */}
//             <div className="flex flex-col sm:flex-row gap-4 mt-8">
//               <button
//                 onClick={checkPaymentStatus}
//                 disabled={checkingStatus}
//                 className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white text-center py-4 px-6 rounded-lg font-semibold text-lg transition duration-200"
//               >
//                 {checkingStatus ? (
//                   <span className="flex items-center justify-center">
//                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
//                     {t("client.checking")}
//                   </span>
//                 ) : (
//                   t("client.checkPaymentStatus")
//                 )}
//               </button>

//               <Link
//                 to="/client"
//                 className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-4 px-6 rounded-lg font-semibold text-lg transition duration-200"
//               >
//                 {t("client.goToDashboard")}
//               </Link>

//               <Link
//                 to="/properties"
//                 className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-center py-4 px-6 rounded-lg font-semibold text-lg transition duration-200"
//               >
//                 {t("client.browseProperties")}
//               </Link>
//             </div>

//             {/* Support Info */}
//             <div className="mt-8 text-center">
//               <p className="text-gray-600">
//                 {t("client.needHelp")}{" "}
//                 <a
//                   href="mailto:support@ethiobroker.com"
//                   className="text-blue-600 hover:text-blue-700 font-semibold"
//                 >
//                   support@ethiobroker.com
//                 </a>
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PaymentPending;

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
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [actionStatus, setActionStatus] = useState(""); // 'success', 'error', 'warning'

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
            `/api/property/view/${paymentData.property._id}`
          );
          setProperty(propertyResponse.data.property || propertyResponse.data);
        }

        if (paymentData.paymentStatus === "Completed") {
          navigate(`/payment/success?payment_id=${paymentData._id}`);
        } else if (paymentData.paymentStatus === "Cancelled") {
          setActionStatus("warning");
          setMessage(t("client.paymentCancelled"));
        } else if (paymentData.paymentStatus === "Failed") {
          setActionStatus("error");
          setMessage(t("client.paymentFailed"));
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

  const handleCancelPayment = async () => {
    if (!paymentId) {
      setActionStatus("error");
      setMessage(t("client.paymentIdRequiredForCancel"));
      return;
    }

    setCancelling(true);
    try {
      const response = await axios.post(`/api/payments/${paymentId}/cancel`);

      if (response.data.success) {
        setActionStatus("success");
        setMessage(t("client.paymentCancelledSuccessfully"));
        setPayment((prev) => ({ ...prev, paymentStatus: "Cancelled" }));
        setShowCancelConfirm(false);

        // Update property status locally
        if (property) {
          setProperty((prev) => ({ ...prev, status: "Ordered" }));
        }

        // Redirect after 3 seconds
        setTimeout(() => {
          navigate("/client");
        }, 3000);
      }
    } catch (error) {
      console.error("Error cancelling payment:", error);
      setActionStatus("error");
      setMessage(
        error.response?.data?.message || t("client.cancelPaymentError")
      );
    } finally {
      setCancelling(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
    }).format(price);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "Cancelled":
        return "text-red-600 bg-red-50 border-red-200";
      case "Failed":
        return "text-gray-600 bg-gray-50 border-gray-200";
      case "Expired":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getActionStatusIcon = () => {
    switch (actionStatus) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex justify-center items-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 text-lg mt-4">
            {t("client.loadingPaymentInfo")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-r from-yellow-500 via-yellow-600 to-orange-600 text-white py-8 text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-white rounded-full"></div>
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white rounded-full"></div>
            </div>

            <div className="relative z-10">
              <div className="text-7xl mb-4 animate-pulse">⏳</div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
                {t("client.paymentProcessing")}
              </h1>
              <p className="text-xl opacity-95 font-light max-w-2xl mx-auto px-4">
                {t("client.paymentProcessingDescription")}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 md:p-8">
            {/* Status Messages */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-xl border ${
                  actionStatus === "success"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : actionStatus === "error"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : actionStatus === "warning"
                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getActionStatusIcon()}</span>
                  <div className="flex-1">
                    <p className="font-medium">{message}</p>
                    {actionStatus === "success" && (
                      <p className="text-sm mt-1 opacity-90">
                        {t("client.redirectingToDashboard")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {payment && (
              <div className="space-y-6">
                {/* Transaction Summary Card */}
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <span className="mr-3">📋</span>
                      {t("client.transactionDetails")}
                    </h2>
                    <div
                      className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
                        payment.paymentStatus
                      )}`}
                    >
                      {payment.paymentStatus}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-600 font-medium mb-1">
                          {t("client.transactionReference")}
                        </p>
                        <p
                          className="font-semibold text-gray-900 text-lg truncate"
                          title={payment.chapaReference}
                        >
                          {payment.chapaReference}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-600 font-medium mb-1">
                          {t("client.paymentDate")}
                        </p>
                        <p className="font-semibold text-gray-900">
                          {payment.createdAt
                            ? new Date(payment.createdAt).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-600 font-medium mb-1">
                          {t("client.amount")}
                        </p>
                        <div className="flex items-center">
                          <span className="text-3xl font-bold text-yellow-600">
                            {formatPrice(payment.amount)}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            ETB
                          </span>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-600 font-medium mb-1">
                          {t("client.dueDate")}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">
                            {payment.dueDate
                              ? new Date(payment.dueDate).toLocaleDateString()
                              : "N/A"}
                          </p>
                          {payment.dueDate &&
                            new Date() > new Date(payment.dueDate) && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                {t("client.overdue")}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Breakdown - Commission Details */}
                  {payment.metadata?.paymentBreakdown && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {t("client.paymentBreakdown")}
                      </h3>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {t("client.propertyAmount")}:
                            </span>
                            <span className="font-medium">
                              {formatPrice(
                                payment.metadata.paymentBreakdown.propertyAmount
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {t("client.buyerCommission")} (2%):
                            </span>
                            <span className="font-medium">
                              +{" "}
                              {formatPrice(
                                payment.metadata.paymentBreakdown
                                  .buyerCommission
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {t("client.totalAmount")}:
                            </span>
                            <span className="font-bold text-blue-600">
                              {formatPrice(
                                payment.metadata.paymentBreakdown.totalAmount
                              )}
                            </span>
                          </div>
                          {payment.metadata.paymentBreakdown
                            .assignedBrokerName && (
                            <div className="text-xs text-gray-500 mt-3 p-2 bg-white rounded-lg">
                              💼 {t("client.commissionNoteBroker")}:{" "}
                              {
                                payment.metadata.paymentBreakdown
                                  .assignedBrokerName
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Property Details Card */}
                {property && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="mr-3">🏠</span>
                      {t("client.propertyDetails")}
                    </h2>
                    <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
                      <div className="flex-shrink-0">
                        {property.images && property.images.length > 0 ? (
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-2xl shadow-lg"
                          />
                        ) : (
                          <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-2xl shadow-lg flex items-center justify-center">
                            <span className="text-5xl">
                              {property.propertyType === "Home"
                                ? "🏠"
                                : property.propertyType === "Car"
                                ? "🚗"
                                : "💻"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            {property.title}
                          </h3>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {property.propertyType}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              property.purpose === "Sell"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {t("client.for")} {property.purpose}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {property.description}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-500">
                              {t("client.price")}
                            </p>
                            <p className="font-bold text-blue-600 text-lg">
                              {formatPrice(property.price)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">
                              {t("client.location")}
                            </p>
                            <p className="font-semibold text-gray-900">
                              {property.city}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">
                              {t("client.status")}
                            </p>
                            <p className="font-semibold text-gray-900">
                              {property.status}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">
                              {t("client.type")}
                            </p>
                            <p className="font-semibold text-gray-900">
                              {property.propertyType}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Steps */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="mr-3">📋</span>
                    {t("client.paymentProgress")}
                  </h2>

                  <div className="relative">
                    {/* Progress line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-green-200"></div>

                    <div className="space-y-8 relative">
                      {[
                        {
                          icon: "🛒",
                          title: t("client.step1Title"),
                          desc: t("client.step1Desc"),
                        },
                        {
                          icon: "💳",
                          title: t("client.step2Title"),
                          desc: t("client.step2Desc"),
                        },
                        {
                          icon: "⏳",
                          title: t("client.step3Title"),
                          desc: t("client.step3Desc"),
                        },
                        {
                          icon: "✅",
                          title: t("client.step4Title"),
                          desc: t("client.step4Desc"),
                        },
                      ].map((step, index) => (
                        <div key={index} className="flex items-start space-x-4">
                          <div
                            className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl z-10 ${
                              index === 2
                                ? "bg-yellow-100 border-2 border-yellow-400"
                                : index < 2
                                ? "bg-green-100 border-2 border-green-400"
                                : "bg-gray-100 border-2 border-gray-300"
                            }`}
                          >
                            {step.icon}
                          </div>
                          <div className="pt-1">
                            <h3 className="font-bold text-gray-900 text-lg">
                              {step.title}
                            </h3>
                            <p className="text-gray-600 mt-1">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Troubleshooting */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-100 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-3">❓</span>
                    {t("client.havingIssues")}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-orange-200">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">⏰</span>
                        <h4 className="font-semibold text-gray-900">
                          {t("client.paymentProcessingTime")}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        {t("client.paymentProcessingTimeDesc")}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-orange-200">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">📧</span>
                        <h4 className="font-semibold text-gray-900">
                          {t("client.checkEmailConfirmation")}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        {t("client.checkEmailConfirmationDesc")}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-orange-200">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">🔍</span>
                        <h4 className="font-semibold text-gray-900">
                          {t("client.ensureChapaPayment")}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        {t("client.ensureChapaPaymentDesc")}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-orange-200">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">📞</span>
                        <h4 className="font-semibold text-gray-900">
                          {t("client.contactSupportIfDelayed")}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        {t("client.contactSupportIfDelayedDesc")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={checkPaymentStatus}
                disabled={
                  checkingStatus || payment?.paymentStatus === "Cancelled"
                }
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl disabled:transform-none disabled:shadow"
              >
                {checkingStatus ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {t("client.checking")}
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-2">🔄</span>
                    {t("client.checkPaymentStatus")}
                  </span>
                )}
              </button>

              <Link
                to="/client"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-xl font-semibold text-lg text-center transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl block"
              >
                <span className="flex items-center justify-center">
                  <span className="mr-2">🏠</span>
                  {t("client.goToDashboard")}
                </span>
              </Link>

              <Link
                to="/properties"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-4 rounded-xl font-semibold text-lg text-center transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl block"
              >
                <span className="flex items-center justify-center">
                  <span className="mr-2">🔍</span>
                  {t("client.browseProperties")}
                </span>
              </Link>

              {payment?.paymentStatus === "Pending" && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={cancelling}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl disabled:transform-none disabled:shadow"
                >
                  {cancelling ? (
                    <span className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {t("client.cancelling")}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">❌</span>
                      {t("client.cancelPayment")}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Support Info */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 rounded-2xl border border-blue-200">
                <div className="text-3xl mr-3">💬</div>
                <div className="text-left">
                  <p className="text-gray-700 font-medium">
                    {t("client.needHelp")}
                  </p>
                  <a
                    href="mailto:support@ethiobroker.com"
                    className="text-blue-600 hover:text-blue-800 font-semibold text-lg transition-colors duration-200"
                  >
                    support@ethiobroker.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Payment Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">❌</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {t("client.cancelPaymentConfirm")}
                </h3>
                <p className="text-gray-600">
                  {t("client.cancelPaymentWarning")}
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <div className="flex items-center space-x-2 text-red-700">
                    <span>⚠️</span>
                    <p className="font-medium">{t("client.importantNote")}:</p>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-red-600">
                    <li>• {t("client.cancelNote1")}</li>
                    <li>• {t("client.cancelNote2")}</li>
                    <li>• {t("client.cancelNote3")}</li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCancelPayment}
                    disabled={cancelling}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                  >
                    {cancelling ? (
                      <span className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {t("client.cancelling")}
                      </span>
                    ) : (
                      t("client.yesCancelPayment")
                    )}
                  </button>

                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={cancelling}
                    className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                  >
                    {t("client.noKeepPayment")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPending;
