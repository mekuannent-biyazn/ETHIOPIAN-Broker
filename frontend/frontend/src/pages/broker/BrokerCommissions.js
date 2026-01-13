import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../../api/axios";
import { useTranslation } from "react-i18next";

const BrokerCommissions = () => {
  const { t } = useTranslation();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    role: "all",
    dateRange: "all",
  });
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
  });

  useEffect(() => {
    fetchCommissions();
  }, [filters]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);

      const propertiesResponse = await axios.get(
        "/api/property/broker/assigned?limit=1000"
      );
      const propertiesData =
        propertiesResponse.data.properties || propertiesResponse.data;
      const properties = Array.isArray(propertiesData) ? propertiesData : [];

      const generatedCommissions =
        generateCommissionsFromProperties(properties);
      setCommissions(generatedCommissions);
      calculateStats(generatedCommissions);
    } catch (error) {
      console.error("Error fetching commissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCommissionsFromProperties = (properties) => {
    const commissions = [];

    properties.forEach((property) => {
      if (property.status === "Sold" || property.status === "Rented") {
        const finalPrice =
          property.finalPrice || property.price || property.rentPrice || 0;
        const commissionAmount = finalPrice * 0.02;

        commissions.push({
          _id: `${property._id}_seller`,
          property: property,
          amount: commissionAmount,
          paymentStatus: "Completed",
          paymentDate: property.updatedAt || property.createdAt,
          metadata: {
            role: "property_owner",
            assignmentType: "admin_assigned",
            source: "property_sale",
          },
          user: property.owner || {
            fname: t("broker.property"),
            lname: t("broker.owner"),
          },
          title: property.title,
          createdAt: property.createdAt,
        });

        commissions.push({
          _id: `${property._id}_buyer`,
          property: property,
          amount: commissionAmount,
          paymentStatus: "Completed",
          paymentDate: property.updatedAt || property.createdAt,
          metadata: {
            role: "buyer_renter",
            assignmentType: "admin_assigned",
            source: "property_sale",
          },
          user: { fname: t("broker.buyer"), lname: t("broker.renter") },
          title: property.title,
          createdAt: property.createdAt,
        });
      }

      if (
        property.status === "Ordered" ||
        property.status === "Payment_Pending"
      ) {
        const price = property.price || 0;
        const potentialCommission = price * 0.02;

        commissions.push({
          _id: `${property._id}_pending`,
          property: property,
          amount: potentialCommission * 2,
          paymentStatus: "Pending",
          paymentDate: null,
          metadata: {
            role: "both",
            assignmentType: "admin_assigned",
            source: "property_sale",
          },
          user: property.owner || {
            fname: t("broker.pending"),
            lname: t("broker.transaction"),
          },
          title: property.title,
          createdAt: property.createdAt,
        });
      }
    });

    return commissions;
  };

  const calculateStats = (commissionsData) => {
    const completedCommissions = commissionsData.filter(
      (c) => c.paymentStatus === "Completed"
    );
    const pendingCommissions = commissionsData.filter(
      (c) => c.paymentStatus === "Pending"
    );

    const totalEarnings = completedCommissions.reduce(
      (sum, c) => sum + (c.amount || 0),
      0
    );
    const pendingEarnings = pendingCommissions.reduce(
      (sum, c) => sum + (c.amount || 0),
      0
    );

    setStats({
      totalEarnings,
      pendingEarnings,
      completedTransactions: completedCommissions.length,
      pendingTransactions: pendingCommissions.length,
    });
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return "ETB 0";
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return t("broker.unknownDate");
    return new Date(dateString).toLocaleDateString("en-ET", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Completed: { color: "bg-green-100 text-green-800", icon: "✅" },
      Pending: { color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
      Failed: { color: "bg-red-100 text-red-800", icon: "❌" },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800",
      icon: "❓",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.icon} {t(`broker.${status.toLowerCase()}`)}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      buyer_renter: {
        color: "bg-blue-100 text-blue-800",
        label: t("broker.buyerRenter"),
      },
      property_owner: {
        color: "bg-purple-100 text-purple-800",
        label: t("broker.propertyOwner"),
      },
      both: {
        color: "bg-indigo-100 text-indigo-800",
        label: t("broker.bothParties"),
      },
    };

    const config = roleConfig[role] || {
      color: "bg-gray-100 text-gray-800",
      label: role,
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getPropertyTitle = (commission) => {
    return (
      commission.property?.title ||
      commission.title ||
      t("broker.unknownProperty")
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToCSV = () => {
    const headers = [
      t("properties.propertyDetails"),
      t("users.client"),
      t("users.role"),
      t("properties.price"),
      t("properties.status"),
      t("common.date"),
      t("broker.reference"),
    ];
    const csvData = commissions.map((commission) => [
      getPropertyTitle(commission),
      `${commission.user?.fname || t("common.unknown")} ${
        commission.user?.lname || ""
      }`,
      commission.metadata?.role || t("common.unknown"),
      commission.amount,
      commission.paymentStatus,
      formatDate(commission.paymentDate || commission.createdAt),
      commission.chapaReference || "N/A",
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `commissions-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleViewReceipt = (commission) => {
    const receiptWindow = window.open("", "_blank");
    receiptWindow.document.write(`
      <html>
        <head>
          <title>${t("broker.commissionReceipt")} - ${getPropertyTitle(
      commission
    )}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .details { margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .footer { margin-top: 40px; text-align: center; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${t("broker.commissionReceipt")}</h1>
            <p>${t("broker.commissionPaymentConfirmation")}</p>
          </div>
          <div class="details">
            <div class="detail-row">
              <strong>${t(
                "properties.propertyDetails"
              )}:</strong> <span>${getPropertyTitle(commission)}</span>
            </div>
            <div class="detail-row">
              <strong>${t("users.client")}:</strong> <span>${
      commission.user?.fname || t("common.unknown")
    } ${commission.user?.lname || ""}</span>
            </div>
            <div class="detail-row">
              <strong>${t("users.role")}:</strong> <span>${
      commission.metadata?.role || t("common.unknown")
    }</span>
            </div>
            <div class="detail-row">
              <strong>${t("properties.price")}:</strong> <span>${formatPrice(
      commission.amount
    )}</span>
            </div>
            <div class="detail-row">
              <strong>${t("properties.status")}:</strong> <span>${
      commission.paymentStatus
    }</span>
            </div>
            <div class="detail-row">
              <strong>${t("common.date")}:</strong> <span>${formatDate(
      commission.paymentDate || commission.createdAt
    )}</span>
            </div>
            <div class="detail-row">
              <strong>${t("broker.referenceId")}:</strong> <span>${
      commission._id
    }</span>
            </div>
          </div>
          <div class="footer">
            <p>${t("broker.thankYouService")}</p>
            <p>${t("broker.automatedReceipt")}</p>
          </div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  const filteredCommissions = commissions.filter((commission) => {
    if (
      filters.status !== "all" &&
      commission.paymentStatus !== filters.status
    ) {
      return false;
    }
    if (filters.role !== "all" && commission.metadata?.role !== filters.role) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t("broker.commissionHistory")}
              </h1>
              <p className="text-gray-600 mt-2">
                {t("broker.trackCommissionEarnings")}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportToCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-200 flex items-center space-x-2"
              >
                <span>📊</span>
                <span>{t("broker.exportCSV")}</span>
              </button>
              <button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-200 flex items-center space-x-2"
              >
                <span>🖨️</span>
                <span>{t("broker.print")}</span>
              </button>
              <Link
                to="/broker/dashboard"
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 flex items-center space-x-2"
              >
                <span>←</span>
                <span>{t("broker.backToDashboard")}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Commission Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl mr-4">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("broker.totalEarnings")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(stats.totalEarnings)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.completedTransactions}{" "}
                  {t("broker.completedTransactions")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-xl mr-4">
                <span className="text-2xl">⏳</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("broker.pendingEarnings")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(stats.pendingEarnings)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.pendingTransactions} {t("broker.pendingTransactions")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl mr-4">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("broker.completed")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completedTransactions}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("broker.successfulTransactions")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-xl mr-4">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("broker.pending")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingTransactions}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("broker.awaitingPayment")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("properties.status")}
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              >
                <option value="all">{t("broker.allStatus")}</option>
                <option value="Completed">{t("broker.completed")}</option>
                <option value="Pending">{t("broker.pending")}</option>
                <option value="Failed">{t("broker.failed")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("users.role")}
              </label>
              <select
                value={filters.role}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, role: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              >
                <option value="all">{t("broker.allRoles")}</option>
                <option value="buyer_renter">{t("broker.buyerRenter")}</option>
                <option value="property_owner">
                  {t("broker.propertyOwner")}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("broker.dateRange")}
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateRange: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              >
                <option value="all">{t("broker.allTime")}</option>
                <option value="today">{t("broker.today")}</option>
                <option value="week">{t("broker.thisWeek")}</option>
                <option value="month">{t("broker.thisMonth")}</option>
                <option value="year">{t("broker.thisYear")}</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() =>
                  setFilters({ status: "all", role: "all", dateRange: "all" })
                }
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-semibold transition duration-200"
              >
                {t("broker.resetFilters")}
              </button>
            </div>
          </div>
        </div>

        {/* Commissions Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                {t("broker.loadingCommissions")}
              </span>
            </div>
          ) : filteredCommissions.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("broker.propertyAndClient")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("users.role")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("broker.commissionDetails")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("properties.status")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("common.date")}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("users.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCommissions.map((commission) => (
                      <tr
                        key={commission._id}
                        className="hover:bg-gray-50 transition duration-150"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getPropertyTitle(commission)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {commission.user?.fname} {commission.user?.lname}
                            </div>
                            <div className="text-xs text-gray-400 capitalize">
                              {commission.property?.propertyType || "N/A"} •{" "}
                              {commission.property?.purpose || "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getRoleBadge(commission.metadata?.role)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-green-600">
                            {formatPrice(commission.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(commission.paymentStatus)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(
                            commission.paymentDate || commission.createdAt
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium space-x-3">
                          {commission.property?._id && (
                            <Link
                              to={`/property/${commission.property._id}`}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              {t("broker.viewProperty")}
                            </Link>
                          )}
                          {commission.paymentStatus === "Completed" && (
                            <button
                              onClick={() => handleViewReceipt(commission)}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              {t("broker.receipt")}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">💰</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("broker.noCommissionsFound")}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {commissions.length === 0
                  ? t("broker.noCommissionRecords")
                  : t("broker.noCommissionsMatch")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .bg-gray-50 {
            background: white !important;
          }
          .py-8 {
            padding: 0 !important;
          }
          .max-w-7xl {
            max-width: none !important;
          }
          .px-4 {
            padding: 0 !important;
          }
          .mb-8 {
            margin-bottom: 1rem !important;
          }
          .grid {
            display: block !important;
          }
          .gap-6 > * {
            margin-bottom: 1rem !important;
          }
          .hidden-print {
            display: none !important;
          }
          .bg-white {
            background: white !important;
          }
          .shadow-xl {
            box-shadow: none !important;
          }
          .rounded-2xl {
            border-radius: 0 !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th,
          td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          th {
            background: #f9fafb !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BrokerCommissions;
