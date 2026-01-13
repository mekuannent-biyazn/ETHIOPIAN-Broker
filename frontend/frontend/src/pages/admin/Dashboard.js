import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    users: {
      total: 0,
      brokers: 0,
      clients: 0,
      pendingVerifications: 0,
    },
    properties: {
      total: 0,
      pending: 0,
      available: 0,
      ordered: 0,
      sold: 0,
      rented: 0,
      paymentPending: 0,
    },
    brokerAssignments: 0,
  });
  const [recentProperties, setRecentProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get("/api/property/admin/dashboard-stats");
      const data = response.data.data;

      setStats({
        users: data.users,
        properties: data.properties,
        brokerAssignments: data.brokerAssignments,
      });
      setRecentProperties(data.recentProperties || []);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
    }).format(price);
  };

  const getStatusTranslation = (status) => {
    const statusMap = {
      Available: t("properties.status.available"),
      Pending: t("properties.status.pending"),
      Ordered: t("properties.status.ordered"),
      Sold: t("properties.status.sold"),
      Rented: t("properties.status.rented"),
      Payment_Pending: t("dashboard.paymentPending"),
      Cancelled: t("properties.status.cancelled"),
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      Available: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Ordered: "bg-blue-100 text-blue-800",
      Sold: "bg-purple-100 text-purple-800",
      Rented: "bg-indigo-100 text-indigo-800",
      Payment_Pending: "bg-orange-100 text-orange-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-2">{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t("dashboard.adminDashboard")}
        </h1>

        {/* User Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-500 rounded-lg">
                <span className="text-white text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">
                  {t("dashboard.totalUsers")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.users.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-500 rounded-lg">
                <span className="text-white text-2xl">🏠</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">
                  {t("dashboard.totalProperties")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.properties.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-500 rounded-lg">
                <span className="text-white text-2xl">🤝</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">
                  {t("dashboard.brokers")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.users.brokers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-500 rounded-lg">
                <span className="text-white text-2xl">👤</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">
                  {t("dashboard.clients")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.users.clients}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Property Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-500 rounded-lg">
                <span className="text-white text-2xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">
                  {t("dashboard.pendingProperties")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.properties.pending}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-500 rounded-lg">
                <span className="text-white text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">
                  {t("dashboard.availableProperties")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.properties.available}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-500 rounded-lg">
                <span className="text-white text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">
                  {t("dashboard.orderedProperties")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.properties.ordered}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-500 rounded-lg">
                <span className="text-white text-2xl">💳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">
                  {t("dashboard.paymentPending")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.properties.paymentPending}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  {stats.properties.ordered > 0
                    ? `${Math.round(
                        (stats.properties.paymentPending /
                          stats.properties.ordered) *
                          100
                      )}% ${t("dashboard.ofOrdered")}`
                    : t("dashboard.noOrders")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-500 rounded-lg">
                <span className="text-white text-2xl">🛒</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">
                  {t("dashboard.soldProperties")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.properties.sold}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-500 rounded-lg">
                <span className="text-white text-2xl">🏘️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-indigo-600">
                  {t("dashboard.rentedProperties")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.properties.rented}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-teal-50 p-6 rounded-lg border border-teal-200">
            <div className="flex items-center">
              <div className="p-3 bg-teal-500 rounded-lg">
                <span className="text-white text-2xl">🤝</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-teal-600">
                  {t("dashboard.brokerAssignments")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.brokerAssignments}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("dashboard.quickActions")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              to="/admin/users"
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-500 transition duration-300 block"
            >
              <h3 className="font-semibold text-gray-900">
                {t("dashboard.manageUsers")}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {t("dashboard.viewAllUsers")}
              </p>
            </Link>
            <Link
              to="/admin/manual-verification"
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-yellow-500 transition duration-300 block"
            >
              <h3 className="font-semibold text-gray-900">
                {t("dashboard.manualVerification")}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {stats.users.pendingVerifications > 0
                  ? `${stats.users.pendingVerifications} ${t(
                      "dashboard.usersWaiting"
                    )}`
                  : t("dashboard.noPendingVerifications")}
              </p>
            </Link>
            <Link
              to="/admin/properties"
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-green-500 transition duration-300 block"
            >
              <h3 className="font-semibold text-gray-900">
                {t("dashboard.manageProperties")}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {stats.properties.pending > 0
                  ? `${stats.properties.pending} ${t(
                      "dashboard.pendingApproval"
                    )}`
                  : t("dashboard.viewAllProperties")}
              </p>
            </Link>
            <Link
              to="/admin/ordered-properties"
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-500 transition duration-300 block"
            >
              <h3 className="font-semibold text-gray-900">
                {t("dashboard.manageOrders")}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {stats.properties.ordered > 0
                  ? `${stats.properties.ordered} ${t(
                      "dashboard.pendingOrders"
                    )}`
                  : t("dashboard.viewAllOrders")}
              </p>
            </Link>
          </div>
        </div>

        {/* Recent Properties */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("dashboard.recentProperties")}
            </h2>
            <Link
              to="/admin/properties"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              {t("dashboard.viewAll")}
            </Link>
          </div>
          <div className="p-6">
            {recentProperties.length > 0 ? (
              <div className="space-y-4">
                {recentProperties.map((property) => (
                  <div
                    key={property._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      {property.images && property.images.length > 0 ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-16 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-lg">
                            {property.propertyType === "Home"
                              ? "🏠"
                              : property.propertyType === "Car"
                              ? "🚗"
                              : "💻"}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {property.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {t(
                            `properties.propertyTypes.${property.propertyType?.toLowerCase()}`
                          )}{" "}
                          •{" "}
                          {t(
                            `properties.purposes.${property.purpose?.toLowerCase()}`
                          )}
                          {property.orderInfo &&
                            property.orderInfo.orderedBy && (
                              <span className="text-blue-600 ml-2">
                                • {t("dashboard.orderedBy")}{" "}
                                {property.orderInfo.orderedBy.fname}
                              </span>
                            )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatPrice(property.price)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          property.status
                        )}`}
                      >
                        {getStatusTranslation(property.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">🏠</div>
                <p className="text-gray-600">
                  {t("dashboard.noPropertiesFound")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
