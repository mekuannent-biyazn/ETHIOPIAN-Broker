import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import axios from "../../api/axios";
import {
  FiPackage,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiDollarSign,
  FiCalendar,
  FiEye,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiAlertCircle,
  FiDownload,
  FiExternalLink,
  FiShoppingBag,
} from "react-icons/fi";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayments, setProcessingPayments] = useState({});
  const [cancellingPayments, setCancellingPayments] = useState({});
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/property/user/orders");
      let ordersData =
        response.data.data?.properties ||
        response.data.properties ||
        response.data ||
        [];

      if (!Array.isArray(ordersData)) {
        ordersData = [];
      }

      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return "ETB 0";
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
    }).format(price);
  };

  const getStatusBadge = (order) => {
    const paymentStatus =
      order.paymentInfo?.paymentStatus ||
      order.orderInfo?.paymentStatus ||
      order.paymentStatus ||
      "pending";

    switch (paymentStatus.toLowerCase()) {
      case "completed":
      case "paid":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center">
            <FiCheckCircle className="mr-1" /> {t("orders.completed")}
          </span>
        );
      case "pending":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center">
            <FiClock className="mr-1" /> {t("orders.pending")}
          </span>
        );
      case "cancelled":
      case "failed":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center">
            <FiXCircle className="mr-1" /> {t("orders.cancelled")}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
            {paymentStatus}
          </span>
        );
    }
  };

  const canCompletePayment = (order) => {
    const status =
      order.paymentInfo?.paymentStatus ||
      order.orderInfo?.paymentStatus ||
      order.paymentStatus;

    return status === "pending" || status === "Pending";
  };

  const canCancelPayment = (order) => {
    const status =
      order.paymentInfo?.paymentStatus ||
      order.orderInfo?.paymentStatus ||
      order.paymentStatus;

    return (
      (status === "pending" || status === "Pending") &&
      (order.paymentInfo?.paymentId || order.paymentInfo?._id)
    );
  };

  const handleCompletePayment = async (order) => {
    try {
      setProcessingPayments((prev) => ({ ...prev, [order._id]: true }));

      // If there's already a payment URL, redirect to it
      if (order.paymentInfo?.paymentUrl) {
        window.location.href = order.paymentInfo.paymentUrl;
        return;
      }

      // Otherwise, initialize a new payment
      const response = await axios.post("/api/payments/initialize", {
        propertyId: order._id,
        paymentType: "full_payment",
      });

      if (response.data.success && response.data.data?.paymentUrl) {
        window.location.href = response.data.data.paymentUrl;
      } else {
        throw new Error(
          response.data.message || "Payment initialization failed"
        );
      }
    } catch (error) {
      console.error("Error completing payment:", error);
      let errorMessage = "Failed to process payment";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message.includes("Network Error")) {
        errorMessage = "Network error. Please check your connection.";
      }
      alert(errorMessage);
    } finally {
      setProcessingPayments((prev) => ({ ...prev, [order._id]: false }));
    }
  };

  const handleCancelPayment = async (order) => {
    if (!window.confirm(t("orders.cancelConfirmation"))) {
      return;
    }

    try {
      setCancellingPayments((prev) => ({ ...prev, [order._id]: true }));

      const paymentId = order.paymentInfo?.paymentId || order.paymentInfo?._id;
      if (!paymentId) {
        throw new Error("Payment ID not found");
      }

      const response = await axios.post(`/api/payments/${paymentId}/cancel`);

      if (response.data.success) {
        alert(t("orders.cancelSuccess"));
        // Update the local state immediately
        setOrders((prevOrders) =>
          prevOrders.map((o) =>
            o._id === order._id
              ? {
                  ...o,
                  paymentInfo: {
                    ...o.paymentInfo,
                    paymentStatus: "cancelled",
                  },
                  paymentStatus: "cancelled",
                }
              : o
          )
        );
        // Also refresh the list after a delay
        setTimeout(() => {
          fetchOrders();
        }, 1000);
      } else {
        throw new Error(response.data.message || "Cancellation failed");
      }
    } catch (error) {
      console.error("Error cancelling payment:", error);
      alert(error.response?.data?.message || "Failed to cancel payment");
    } finally {
      setCancellingPayments((prev) => ({ ...prev, [order._id]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getPaymentDate = (order) => {
    return (
      order.paymentInfo?.createdAt ||
      order.orderInfo?.orderDate ||
      order.createdAt ||
      null
    );
  };

  const handleDownloadReceipt = async (order) => {
    try {
      const paymentId = order.paymentInfo?.paymentId || order.paymentInfo?._id;
      if (!paymentId) {
        alert("Receipt not available for this order");
        return;
      }

      // This would be your API endpoint for downloading receipts
      // For now, we'll just show an alert
      alert(
        "Receipt download feature will be implemented soon. Payment ID: " +
          paymentId
      );

      // Example implementation:
      // const response = await axios.get(`/api/payments/${paymentId}/receipt`, {
      //   responseType: 'blob'
      // });
      // const url = window.URL.createObjectURL(new Blob([response.data]));
      // const link = document.createElement('a');
      // link.href = url;
      // link.setAttribute('download', `receipt-${paymentId}.pdf`);
      // document.body.appendChild(link);
      // link.click();
    } catch (error) {
      console.error("Error downloading receipt:", error);
      alert("Failed to download receipt");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t("client.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {t("navigation.orders")}
              </h1>
              <p className="text-blue-100">{t("orders.manageTrackOrders")}</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link
                to="/properties"
                className="inline-flex items-center bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition duration-200 backdrop-blur-sm"
              >
                <FiShoppingBag className="mr-2" />
                {t("orders.browseMore")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {t("orders.totalOrders")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiPackage className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {t("orders.pendingPayments")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter((order) => canCompletePayment(order)).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FiClock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {t("orders.totalValue")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(
                    orders.reduce(
                      (total, order) => total + (order.price || 0),
                      0
                    )
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiDollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("orders.property")}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("orders.orderDate")}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("orders.price")}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("orders.status")}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("orders.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => {
                    const isProcessing = processingPayments[order._id];
                    const isCancelling = cancellingPayments[order._id];
                    const canComplete = canCompletePayment(order);
                    const canCancel = canCancelPayment(order);
                    const isCompleted =
                      order.paymentInfo?.paymentStatus === "completed" ||
                      order.paymentInfo?.paymentStatus === "Completed" ||
                      order.orderInfo?.paymentStatus === "completed" ||
                      order.paymentStatus === "completed";

                    return (
                      <tr
                        key={order._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {order.images && order.images.length > 0 ? (
                              <img
                                src={order.images[0]}
                                alt={order.title}
                                className="w-16 h-16 object-cover rounded-lg mr-3"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mr-3">
                                <FiPackage className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {order.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.propertyType} • {order.purpose}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {order.city || "Location not specified"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiCalendar className="mr-2 text-gray-400" />
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {formatDate(getPaymentDate(order))}
                              </span>
                              {order.paymentInfo?.dueDate && (
                                <div className="text-xs text-gray-500">
                                  Due: {formatDate(order.paymentInfo.dueDate)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-bold text-blue-600">
                            {formatPrice(order.price)}
                          </div>
                          {order.paymentInfo?.amount &&
                            order.paymentInfo.amount !== order.price && (
                              <div className="text-xs text-gray-500">
                                Paid: {formatPrice(order.paymentInfo.amount)}
                              </div>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(order)}
                            {order.status && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                                {order.status}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {/* View Details Button */}
                            <Link
                              to={`/property/${order._id}`}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              <FiEye className="mr-2" />
                              {t("orders.viewDetails")}
                            </Link>

                            {/* Complete Payment Button */}
                            {canComplete && (
                              <button
                                onClick={() => handleCompletePayment(order)}
                                disabled={isProcessing || isCancelling}
                                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                                  isProcessing
                                    ? "bg-blue-400 text-white cursor-not-allowed"
                                    : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                              >
                                {isProcessing ? (
                                  <>
                                    <FiRefreshCw className="mr-2 animate-spin" />
                                    {t("orders.processing")}
                                  </>
                                ) : order.paymentInfo?.paymentUrl ? (
                                  <>
                                    <FiExternalLink className="mr-2" />
                                    {t("orders.resumePayment")}
                                  </>
                                ) : (
                                  <>
                                    <FiCheck className="mr-2" />
                                    {t("orders.completePayment")}
                                  </>
                                )}
                              </button>
                            )}

                            {/* Cancel Payment Button */}
                            {canCancel && (
                              <button
                                onClick={() => handleCancelPayment(order)}
                                disabled={isProcessing || isCancelling}
                                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                                  isCancelling
                                    ? "bg-red-400 text-white cursor-not-allowed"
                                    : "bg-red-600 text-white hover:bg-red-700"
                                }`}
                              >
                                {isCancelling ? (
                                  <>
                                    <FiRefreshCw className="mr-2 animate-spin" />
                                    {t("orders.cancelling")}
                                  </>
                                ) : (
                                  <>
                                    <FiX className="mr-2" />
                                    {t("orders.cancelPayment")}
                                  </>
                                )}
                              </button>
                            )}

                            {/* Download Receipt Button */}
                            {isCompleted && (
                              <button
                                onClick={() => handleDownloadReceipt(order)}
                                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm"
                              >
                                <FiDownload className="mr-2" />
                                {t("orders.receipt")}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPackage className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("orders.noOrdersFound")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t("orders.noOrdersDescription")}
              </p>
              <Link
                to="/properties"
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-lg"
              >
                <FiShoppingBag className="mr-2" />
                {t("orders.browseProperties")}
              </Link>
            </div>
          )}
        </div>

        {/* Help Section */}
        {orders.some((order) => canCompletePayment(order)) && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start">
              <FiAlertCircle className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  {t("orders.paymentInstructions")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <FiCheck className="w-4 h-4 text-green-600" />
                      </div>
                      <h4 className="font-medium text-gray-900">
                        {t("orders.completePaymentTitle")}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t("orders.instruction1")}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <FiX className="w-4 h-4 text-red-600" />
                      </div>
                      <h4 className="font-medium text-gray-900">
                        {t("orders.cancelPaymentTitle")}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t("orders.instruction2")}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <FiDownload className="w-4 h-4 text-purple-600" />
                      </div>
                      <h4 className="font-medium text-gray-900">
                        {t("orders.receiptTitle")}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t("orders.instruction3")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {orders.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("orders.recentActivity")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.slice(0, 3).map((order) => (
                <div
                  key={order._id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 truncate">
                      {order.title}
                    </h4>
                    {getStatusBadge(order)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {formatDate(getPaymentDate(order))}
                    </span>
                    <span className="font-semibold text-blue-600">
                      {formatPrice(order.price)}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Link
                      to={`/property/${order._id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {t("orders.viewDetails")} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
