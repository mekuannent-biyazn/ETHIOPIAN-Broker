import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import axios from "../../api/axios";

const PaymentHistory = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    paymentType: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
  });

  useEffect(() => {
    fetchPayments();
  }, [filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.paymentType)
        queryParams.append("paymentType", filters.paymentType);
      queryParams.append("page", filters.page);
      queryParams.append("limit", filters.limit);

      const response = await axios.get(
        `/api/payments/user/my-payments?${queryParams}`
      );

      if (response.data.success) {
        setPayments(response.data.data.payments);
        setPagination({
          total: response.data.data.total,
          totalPages: response.data.data.totalPages,
          currentPage: response.data.data.currentPage,
        });
      } else {
        setError(t("client.paymentLoadError"));
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError(t("client.paymentHistoryError"));
    } finally {
      setLoading(false);
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
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      case "Cancelled":
        return "bg-gray-100 text-gray-800";
      case "Expired":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentTypeLabel = (type) => {
    switch (type) {
      case "full_payment":
        return t("client.fullPayment");
      case "booking_fee":
        return t("client.bookingFee");
      case "broker_commission":
        return t("client.brokerCommission");
      default:
        return type;
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
    window.scrollTo(0, 0);
  };

  if (loading && payments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t("client.loadingPaymentHistory")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {t("client.paymentHistory")}
            </h1>
            <Link
              to="/client"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200"
            >
              {t("client.backToDashboard")}
            </Link>
          </div>
          <p className="text-gray-600">{t("client.viewManageTransactions")}</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("client.paymentStatus")}
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t("client.allStatus")}</option>
                <option value="Completed">{t("client.completed")}</option>
                <option value="Pending">{t("client.pending")}</option>
                <option value="Failed">{t("client.failed")}</option>
                <option value="Cancelled">{t("client.cancelled")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("client.paymentType")}
              </label>
              <select
                value={filters.paymentType}
                onChange={(e) =>
                  handleFilterChange("paymentType", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t("client.allTypes")}</option>
                <option value="full_payment">{t("client.fullPayment")}</option>
                <option value="booking_fee">{t("client.bookingFee")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("client.itemsPerPage")}
              </label>
              <select
                value={filters.limit}
                onChange={(e) =>
                  handleFilterChange("limit", parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="5">5 {t("client.perPage")}</option>
                <option value="10">10 {t("client.perPage")}</option>
                <option value="20">20 {t("client.perPage")}</option>
                <option value="50">50 {t("client.perPage")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-red-500 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Payments List */}
        {payments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">💸</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t("client.noPaymentsFound")}
            </h3>
            <p className="text-gray-600 mb-4">
              {filters.status || filters.paymentType
                ? t("client.noPaymentsMatchFilters")
                : t("client.noPaymentsYet")}
            </p>
            <Link
              to="/properties"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200"
            >
              {t("client.browseProperties")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment._id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {payment.property?.title ||
                            t("client.propertyPayment")}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            payment.paymentStatus
                          )}`}
                        >
                          {payment.paymentStatus}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {getPaymentTypeLabel(payment.paymentType)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">
                            {t("client.amount")}:
                          </span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {formatPrice(payment.amount)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">
                            {t("client.date")}:
                          </span>
                          <span className="ml-2">
                            {formatDate(
                              payment.paymentDate || payment.createdAt
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">
                            {t("client.transactionId")}:
                          </span>
                          <span className="ml-2 font-mono text-xs">
                            {payment.chapaReference || payment._id}
                          </span>
                        </div>
                      </div>

                      {payment.property && (
                        <div className="mt-3 flex items-center space-x-3">
                          {payment.property.images &&
                            payment.property.images.length > 0 && (
                              <img
                                src={payment.property.images[0]}
                                alt={payment.property.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                          <div>
                            <p className="text-sm text-gray-600">
                              {payment.property.propertyType} •{" "}
                              {payment.property.purpose}
                            </p>
                            <p className="text-sm text-gray-500">
                              {payment.property.city ||
                                payment.property.location}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 md:mt-0 md:ml-6 flex space-x-2">
                      <Link
                        to={`/payment/success?payment_id=${payment._id}`}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition duration-200"
                      >
                        {t("client.viewDetails")}
                      </Link>
                      {payment.paymentStatus === "Completed" && (
                        <button
                          onClick={() => window.print()}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium transition duration-200"
                        >
                          {t("client.print")}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Commission Breakdown for Completed Payments */}
                  {payment.paymentStatus === "Completed" &&
                    (payment.buyerCommission > 0 ||
                      payment.sellerCommission > 0) && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">
                          {t("client.commissionBreakdown")}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {payment.buyerCommission > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {t("client.buyerCommission")} (2%):
                              </span>
                              <span className="font-medium">
                                {formatPrice(payment.buyerCommission)}
                              </span>
                            </div>
                          )}
                          {payment.sellerCommission > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {t("client.sellerCommission")} (2%):
                              </span>
                              <span className="font-medium">
                                {formatPrice(payment.sellerCommission)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("client.previous")}
              </button>

              {[...Array(pagination.totalPages)].map((_, index) => {
                const page = index + 1;
                if (
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= filters.page - 1 && page <= filters.page + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium border rounded-md ${
                        filters.page === page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === filters.page - 2 ||
                  page === filters.page + 2
                ) {
                  return (
                    <span key={page} className="px-3 py-2 text-gray-500">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === pagination.totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("client.next")}
              </button>
            </nav>
          </div>
        )}

        {/* Summary */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("client.summary")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {payments.filter((p) => p.paymentStatus === "Completed").length}
              </div>
              <div className="text-green-700">{t("client.completed")}</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {payments.filter((p) => p.paymentStatus === "Pending").length}
              </div>
              <div className="text-yellow-700">{t("client.pending")}</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {payments.filter((p) => p.paymentStatus === "Failed").length}
              </div>
              <div className="text-red-700">{t("client.failed")}</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatPrice(
                  payments
                    .filter((p) => p.paymentStatus === "Completed")
                    .reduce((sum, p) => sum + p.amount, 0)
                )}
              </div>
              <div className="text-blue-700">{t("client.totalSpent")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
