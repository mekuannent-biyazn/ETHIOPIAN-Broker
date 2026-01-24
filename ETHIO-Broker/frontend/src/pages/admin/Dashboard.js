

import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Dashboard = () => {
  const { t, i18n } = useTranslation();
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
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState(i18n.language || "en");

  useEffect(() => {
    fetchDashboardStats();
    // Listen for language changes
    const handleLanguageChange = (lng) => {
      setLanguage(lng);
    };
    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setError(null);
      setLoading(true);
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
      setError(
        t("errors.fetchError") ||
          "Failed to load dashboard data. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
      case "ይገኛል":
        return "bg-green-100 text-green-800";
      case "Pending":
      case "በጥበቃ ላይ":
        return "bg-yellow-100 text-yellow-800";
      case "Ordered":
      case "የተዘዘ":
        return "bg-blue-100 text-blue-800";
      case "Sold":
      case "ተሸጧል":
        return "bg-purple-100 text-purple-800";
      case "Rented":
      case "ተከራይቷል":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Available":
        return language === "am" ? "ይገኛል" : "Available";
      case "Pending":
        return language === "am" ? "በጥበቃ ላይ" : "Pending";
      case "Ordered":
        return language === "am" ? "የተዘዘ" : "Ordered";
      case "Sold":
        return language === "am" ? "ተሸጧል" : "Sold";
      case "Rented":
        return language === "am" ? "ተከራይቷል" : "Rented";
      default:
        return status;
    }
  };

  const getPropertyTypeIcon = (propertyType) => {
    if (propertyType === "Home" || propertyType === "ቤት") {
      return "🏠";
    } else if (propertyType === "Car" || propertyType === "መኪና") {
      return "🚗";
    } else {
      return "💻";
    }
  };

  const getPropertyTypeText = (propertyType) => {
    switch (propertyType) {
      case "Home":
        return language === "am" ? "ቤት" : "Home";
      case "Car":
        return language === "am" ? "መኪና" : "Car";
      case "Electronics":
        return language === "am" ? "ኤሌክትሮኒክስ" : "Electronics";
      default:
        return propertyType;
    }
  };

  const toggleLanguage = () => {
    const newLang = language === "en" ? "am" : "en";
    i18n.changeLanguage(newLang);
    setLanguage(newLang);
  };

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {language === "am" ? "ስህተት ተከስቷል" : "Something went wrong"}
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {language === "am" ? "እንደገና ሞክር" : "Retry Loading"}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-600">
            {language === "am" ? "ዳሽቦርድ በመጫን ላይ..." : "Loading Dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      dir={language === "am" ? "rtl" : "ltr"}
    >
      {/* Simple Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {language === "am" ? "የአስተዳዳሪ ዳሽቦርድ" : "Admin Dashboard"}
              </h1>
              <p className="text-gray-600 mt-1">
                {language === "am"
                  ? "የስርዓት አጠቃላይ እይታ እና አስተዳደር"
                  : "System overview and management"}
              </p>
            </div>
            <div
              className="flex items-center space-x-3"
              style={language === "am" ? { flexDirection: "row-reverse" } : {}}
            >
              <button
                onClick={toggleLanguage}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              >
                {language === "am" ? (
                  <>
                    <span className="mr-2">🇬🇧</span>
                    English
                  </>
                ) : (
                  <>
                    <span className="mr-2">🇪🇹</span>
                    አማርኛ
                  </>
                )}
              </button>
              <button
                onClick={fetchDashboardStats}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {language === "am" ? "አድስ" : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Stats - Simplified */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div
              className="flex items-center"
              style={language === "am" ? { flexDirection: "row-reverse" } : {}}
            >
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div className={language === "am" ? "mr-4 text-right" : "ml-4"}>
                <p className="text-sm font-medium text-gray-600">
                  {language === "am" ? "ጠቅላላ ተጠቃሚዎች" : "Total Users"}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.users.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div
              className="flex items-center"
              style={language === "am" ? { flexDirection: "row-reverse" } : {}}
            >
              <div className="p-3 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className={language === "am" ? "mr-4 text-right" : "ml-4"}>
                <p className="text-sm font-medium text-gray-600">
                  {language === "am" ? "ጠቅላላ ንብረቶች" : "Total Properties"}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.properties.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div
              className="flex items-center"
              style={language === "am" ? { flexDirection: "row-reverse" } : {}}
            >
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
                  />
                </svg>
              </div>
              <div className={language === "am" ? "mr-4 text-right" : "ml-4"}>
                <p className="text-sm font-medium text-gray-600">
                  {language === "am" ? "በኩሌዎች" : "Brokers"}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.users.brokers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div
              className="flex items-center"
              style={language === "am" ? { flexDirection: "row-reverse" } : {}}
            >
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className={language === "am" ? "mr-4 text-right" : "ml-4"}>
                <p className="text-sm font-medium text-gray-600">
                  {language === "am" ? "ደንበኞች" : "Clients"}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.users.clients}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Property Status Summary - Consolidated */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {language === "am" ? "የንብረት ሁኔታ" : "Property Status"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.properties.pending}
              </div>
              <div className="text-sm text-gray-600">
                {language === "am" ? "በጥበቃ ላይ" : "Pending"}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.properties.available}
              </div>
              <div className="text-sm text-gray-600">
                {language === "am" ? "ይገኛል" : "Available"}
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.properties.ordered}
              </div>
              <div className="text-sm text-gray-600">
                {language === "am" ? "የተዘዘ" : "Ordered"}
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.properties.sold + stats.properties.rented}
              </div>
              <div className="text-sm text-gray-600">
                {language === "am" ? "የተጠናቀቀ" : "Completed"}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities - Table Format */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-8">
          <div
            className="flex justify-between items-center p-6 border-b"
            style={language === "am" ? { flexDirection: "row-reverse" } : {}}
          >
            <h2 className="text-xl font-bold text-gray-900">
              {language === "am" ? "የቅርብ ማንኛት" : "Recent Activities"}
            </h2>
            <Link
              to="/admin/properties"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {language === "am" ? "ሁሉንም ይመልከቱ" : "View All"}
            </Link>
          </div>
          <div className="overflow-x-auto">
            {recentProperties.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === "am" ? "ንብረት" : "Property"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === "am" ? "ሁኔታ" : "Status"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === "am" ? "የተመደበ በኩሌ" : "Assigned Broker"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === "am" ? "የተገኘ ኮሚሽን" : "Commission Earned"}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentProperties.slice(0, 10).map((property) => (
                    <tr key={property._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className="flex items-center"
                          style={
                            language === "am"
                              ? { flexDirection: "row-reverse" }
                              : {}
                          }
                        >
                          {property.images && property.images.length > 0 ? (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="w-10 h-10 object-cover rounded-lg mr-3"
                              style={
                                language === "am"
                                  ? { marginRight: 0, marginLeft: "0.75rem" }
                                  : {}
                              }
                            />
                          ) : (
                            <div
                              className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3"
                              style={
                                language === "am"
                                  ? { marginRight: 0, marginLeft: "0.75rem" }
                                  : {}
                              }
                            >
                              <span className="text-sm">
                                {getPropertyTypeIcon(property.propertyType)}
                              </span>
                            </div>
                          )}
                          <div
                            className={language === "am" ? "text-right" : ""}
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {property.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {getPropertyTypeText(property.propertyType)} •{" "}
                              {formatPrice(property.price)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(property.status)}`}
                        >
                          {getStatusText(property.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {property.assignedBroker ? (
                            <div
                              className={language === "am" ? "text-right" : ""}
                            >
                              <div className="font-medium text-gray-900">
                                {property.assignedBroker.fname}{" "}
                                {property.assignedBroker.lname}
                              </div>
                              <div className="text-xs text-gray-500">
                                ({property.assignedBroker.email})
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">
                              {language === "am"
                                ? "በኩሌ አልተመደበም"
                                : "No broker assigned"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {property.status === "Sold" ||
                          property.status === "Rented" ||
                          property.status === "ተሸጧል" ||
                          property.status === "ተከራይቷል" ? (
                            property.commission ? (
                              <div className="font-medium text-green-600">
                                {formatPrice(property.commission)}
                              </div>
                            ) : (
                              <div className="font-medium text-yellow-600">
                                {formatPrice(property.price * 0.04)}
                              </div>
                            )
                          ) : (
                            <span className="text-gray-400 italic">
                              {language === "am" ? "አይመሰርትም" : "N/A"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {language === "am"
                    ? "ምንም የቅርብ ማንኛት የለም"
                    : "No recent activities"}
                </h3>
                <p className="text-gray-600">
                  {language === "am"
                    ? "የንብረት ማንኛት እዚህ ይታያሉ"
                    : "Property activities will appear here"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* System Report Section */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-xl font-bold text-gray-900">
              {language === "am" ? "የስርዓት ዘገባ" : "System Report"}
            </h2>
            <p className="text-gray-600 mt-1">
              {language === "am"
                ? "በቀጥታ የሚገኙ ትንተናዎች እና የስርዓት አጠቃላይ እይታ"
                : "Real-time analytics and system overview"}
            </p>
          </div>

          {/* Financial Overview */}
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === "am" ? "የፋይናንስ አጠቃላይ እይታ" : "Financial Overview"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div
                  className="flex items-center"
                  style={
                    language === "am" ? { flexDirection: "row-reverse" } : {}
                  }
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <div
                    className={language === "am" ? "mr-3 text-right" : "ml-3"}
                  >
                    <p className="text-sm font-medium text-gray-600">
                      {language === "am" ? "ጠቅላላ ገቢ" : "Total Revenue"}
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      {formatPrice(
                        recentProperties
                          .filter(
                            (p) =>
                              p.status === "Sold" ||
                              p.status === "Rented" ||
                              p.status === "ተሸጧል" ||
                              p.status === "ተከራይቷል",
                          )
                          .reduce((sum, p) => sum + (p.price || 0), 0),
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div
                  className="flex items-center"
                  style={
                    language === "am" ? { flexDirection: "row-reverse" } : {}
                  }
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
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
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div
                    className={language === "am" ? "mr-3 text-right" : "ml-3"}
                  >
                    <p className="text-sm font-medium text-gray-600">
                      {language === "am" ? "ጠቅላላ ኮሚሽኖች" : "Total Commissions"}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatPrice(
                        recentProperties
                          .filter(
                            (p) =>
                              p.status === "Sold" ||
                              p.status === "Rented" ||
                              p.status === "ተሸጧል" ||
                              p.status === "ተከራይቷል",
                          )
                          .reduce((sum, p) => sum + (p.commission || 0), 0),
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div
                  className="flex items-center"
                  style={
                    language === "am" ? { flexDirection: "row-reverse" } : {}
                  }
                >
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div
                    className={language === "am" ? "mr-3 text-right" : "ml-3"}
                  >
                    <p className="text-sm font-medium text-gray-600">
                      {language === "am"
                        ? "አማካይ የንብረት ዋጋ"
                        : "Avg Property Value"}
                    </p>
                    <p className="text-lg font-bold text-purple-600">
                      {formatPrice(
                        stats.properties.total > 0
                          ? recentProperties.reduce(
                              (sum, p) => sum + (p.price || 0),
                              0,
                            ) / recentProperties.length
                          : 0,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === "am" ? "የአፈፃፀም ዘርፎች" : "Performance Metrics"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.properties.total > 0
                    ? Math.round(
                        ((stats.properties.sold + stats.properties.rented) /
                          stats.properties.total) *
                          100,
                      )
                    : 0}
                  %
                </div>
                <div className="text-sm text-gray-600">
                  {language === "am" ? "የተሳካ መጠን" : "Success Rate"}
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.users.brokers > 0
                    ? Math.round(
                        (stats.properties.sold + stats.properties.rented) /
                          stats.users.brokers,
                      )
                    : 0}
                </div>
                <div className="text-sm text-gray-600">
                  {language === "am"
                    ? "አማካይ ሽያጭ በበሮከር"
                    : "Avg Sales per Broker"}
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.properties.pending}
                </div>
                <div className="text-sm text-gray-600">
                  {language === "am"
                    ? "በመጠባበቅ ላይ ያሉ ማረጋገጫዎች"
                    : "Pending Approvals"}
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.properties.ordered}
                </div>
                <div className="text-sm text-gray-600">
                  {language === "am" ? "ንቁ ትዕዛዞች" : "Active Orders"}
                </div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === "am" ? "የስርዓት ጤና" : "System Health"}
            </h3>
            <div className="space-y-4">
              <div
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                style={
                  language === "am" ? { flexDirection: "row-reverse" } : {}
                }
              >
                <div
                  className="flex items-center"
                  style={
                    language === "am" ? { flexDirection: "row-reverse" } : {}
                  }
                >
                  <div
                    className="w-3 h-3 bg-green-500 rounded-full mr-3"
                    style={
                      language === "am"
                        ? { marginRight: 0, marginLeft: "0.75rem" }
                        : {}
                    }
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    {language === "am"
                      ? "የውሂብ ጎታ ግንኙነት"
                      : "Database Connection"}
                  </span>
                </div>
                <span className="text-sm text-green-600 font-semibold">
                  {language === "am" ? "ጤናማ" : "Healthy"}
                </span>
              </div>

              <div
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                style={
                  language === "am" ? { flexDirection: "row-reverse" } : {}
                }
              >
                <div
                  className="flex items-center"
                  style={
                    language === "am" ? { flexDirection: "row-reverse" } : {}
                  }
                >
                  <div
                    className="w-3 h-3 bg-green-500 rounded-full mr-3"
                    style={
                      language === "am"
                        ? { marginRight: 0, marginLeft: "0.75rem" }
                        : {}
                    }
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    {language === "am" ? "የክፍያ ስርዓት" : "Payment System"}
                  </span>
                </div>
                <span className="text-sm text-green-600 font-semibold">
                  {language === "am" ? "ንቁ" : "Active"}
                </span>
              </div>

              <div
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                style={
                  language === "am" ? { flexDirection: "row-reverse" } : {}
                }
              >
                <div
                  className="flex items-center"
                  style={
                    language === "am" ? { flexDirection: "row-reverse" } : {}
                  }
                >
                  <div
                    className="w-3 h-3 bg-green-500 rounded-full mr-3"
                    style={
                      language === "am"
                        ? { marginRight: 0, marginLeft: "0.75rem" }
                        : {}
                    }
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    {language === "am" ? "የኢሜል ማሳወቂያዎች" : "Email Notifications"}
                  </span>
                </div>
                <span className="text-sm text-green-600 font-semibold">
                  {language === "am" ? "ተግባራዊ" : "Operational"}
                </span>
              </div>

              <div
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                style={
                  language === "am" ? { flexDirection: "row-reverse" } : {}
                }
              >
                <div
                  className="flex items-center"
                  style={
                    language === "am" ? { flexDirection: "row-reverse" } : {}
                  }
                >
                  <div
                    className="w-3 h-3 bg-blue-500 rounded-full mr-3"
                    style={
                      language === "am"
                        ? { marginRight: 0, marginLeft: "0.75rem" }
                        : {}
                    }
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    {language === "am"
                      ? "ጠቅላላ የስርዓት ተጠቃሚዎች"
                      : "Total System Users"}
                  </span>
                </div>
                <span className="text-sm text-blue-600 font-semibold">
                  {stats.users.total}
                </span>
              </div>

              <div
                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                style={
                  language === "am" ? { flexDirection: "row-reverse" } : {}
                }
              >
                <div
                  className="flex items-center"
                  style={
                    language === "am" ? { flexDirection: "row-reverse" } : {}
                  }
                >
                  <div
                    className="w-3 h-3 bg-yellow-500 rounded-full mr-3"
                    style={
                      language === "am"
                        ? { marginRight: 0, marginLeft: "0.75rem" }
                        : {}
                    }
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    {language === "am" ? "ያልተረጋገጡ ተጠቃሚዎች" : "Unverified Users"}
                  </span>
                </div>
                <span className="text-sm text-yellow-600 font-semibold">
                  {stats.users.pendingVerifications}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
