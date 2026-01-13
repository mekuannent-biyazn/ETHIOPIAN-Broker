import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ManageProperties = () => {
  const { t } = useTranslation();
  const [allProperties, setAllProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAllProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [activeTab, allProperties, searchTerm]);

  const fetchAllProperties = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching all properties from database...");

      let properties = [];

      try {
        const response = await axios.get("/api/property/admin/all-properties");
        if (response.data.success) {
          properties = response.data.data.properties || [];
          console.log(
            "✅ Admin endpoint success:",
            properties.length,
            "properties"
          );
        }
      } catch (adminError) {
        console.log("❌ Admin endpoint failed, trying main endpoint...");

        try {
          const response = await axios.get("/api/property?limit=1000");
          properties = response.data.properties || response.data || [];
          console.log(
            "✅ Main endpoint success:",
            properties.length,
            "properties"
          );
        } catch (mainError) {
          console.log(
            "❌ Main endpoint failed, trying individual endpoints..."
          );

          const endpoints = [
            "/api/property?status=Available",
            "/api/property?status=Pending",
            "/api/property?status=Ordered",
            "/api/property?status=Sold",
            "/api/property?status=Rented",
          ];

          const responses = await Promise.allSettled(
            endpoints.map((endpoint) => axios.get(endpoint))
          );

          properties = responses.reduce((acc, response) => {
            if (response.status === "fulfilled") {
              const data =
                response.value.data.properties || response.value.data;
              return [...acc, ...(Array.isArray(data) ? data : [])];
            }
            return acc;
          }, []);

          console.log(
            "✅ Combined endpoints success:",
            properties.length,
            "properties"
          );
        }
      }

      const uniqueProperties = properties.filter(
        (property, index, self) =>
          index === self.findIndex((p) => p._id === property._id)
      );

      setAllProperties(uniqueProperties);
    } catch (error) {
      console.error("❌ All fetch methods failed:", error);
      setMessage({
        type: "error",
        text: `${t("errors.fetchError")}: ${error.message}`,
      });
      setAllProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = allProperties;

    switch (activeTab) {
      case "pending":
        filtered = filtered.filter((property) => property.status === "Pending");
        break;
      case "available":
        filtered = filtered.filter(
          (property) => property.status === "Available"
        );
        break;
      case "ordered":
        filtered = filtered.filter((property) => property.status === "Ordered");
        break;
      case "sold":
        filtered = filtered.filter((property) => property.status === "Sold");
        break;
      case "rented":
        filtered = filtered.filter((property) => property.status === "Rented");
        break;
      case "payment-pending":
        filtered = filtered.filter((property) => property.status === "Ordered");
        break;
      case "all":
      default:
        filtered = filtered;
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (property) =>
          property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.propertyType
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          property.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.owner?.fname
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          property.owner?.lname
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          property.owner?.email
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProperties(filtered);
  };

  const getCount = (status) => {
    const count = allProperties.filter((property) => {
      switch (status) {
        case "pending":
          return property.status === "Pending";
        case "available":
          return property.status === "Available";
        case "ordered":
          return property.status === "Ordered";
        case "sold":
          return property.status === "Sold";
        case "rented":
          return property.status === "Rented";
        case "payment-pending":
          return property.status === "Ordered";
        case "all":
        default:
          return true;
      }
    }).length;

    return count;
  };

  const handleApproveProperty = async (propertyId) => {
    try {
      const response = await axios.patch(`/api/property/${propertyId}/approve`);

      if (response.data.success) {
        setMessage({
          type: "success",
          text: t("success.propertyApproved"),
        });
        fetchAllProperties();
      }
    } catch (error) {
      console.error("Error approving property:", error);
      setMessage({ type: "error", text: t("errors.updateError") });
    }
  };

  const handleRejectProperty = async (propertyId) => {
    try {
      const response = await axios.patch(`/api/property/${propertyId}`, {
        status: "Cancelled",
      });

      if (response.data.success) {
        setMessage({
          type: "success",
          text: t("success.propertyRejected"),
        });
        fetchAllProperties();
      }
    } catch (error) {
      console.error("Error rejecting property:", error);
      setMessage({ type: "error", text: t("errors.updateError") });
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm(t("common.confirmDelete"))) {
      return;
    }

    try {
      await axios.delete(`/api/property/${propertyId}`);
      setMessage({ type: "success", text: t("success.propertyDeleted") });
      fetchAllProperties();
    } catch (error) {
      console.error("Error deleting property:", error);
      setMessage({ type: "error", text: t("errors.deleteError") });
    }
  };

  const handleCompleteOrder = async (propertyId) => {
    try {
      const response = await axios.patch(
        `/api/property/${propertyId}/complete`
      );

      if (response.data.success) {
        setMessage({ type: "success", text: t("success.orderCompleted") });
        fetchAllProperties();
      }
    } catch (error) {
      console.error("Error completing order:", error);
      setMessage({ type: "error", text: t("errors.updateError") });
    }
  };

  const handleAssignBrokerClick = (property) => {
    localStorage.setItem(
      "selectedPropertyForAssignment",
      JSON.stringify(property)
    );
    setSelectedProperty(property);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
    }).format(price);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800 border border-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "Ordered":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "Sold":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "Rented":
        return "bg-indigo-100 text-indigo-800 border border-indigo-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Available":
        return "✅";
      case "Pending":
        return "⏳";
      case "Ordered":
        return "💰";
      case "Sold":
        return "🛒";
      case "Rented":
        return "🏘️";
      case "Cancelled":
        return "❌";
      default:
        return "📄";
    }
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case "all":
        return "🏠";
      case "pending":
        return "⏳";
      case "available":
        return "✅";
      case "ordered":
        return "💰";
      case "payment-pending":
        return "💳";
      case "sold":
        return "🛒";
      case "rented":
        return "🏘️";
      default:
        return "📊";
    }
  };

  const getTabLabel = (tab) => {
    const tabLabels = {
      all: t("properties.allProperties"),
      pending: t("properties.pending"),
      available: t("properties.approved"),
      ordered: t("properties.status.ordered"),
      "payment-pending": t("dashboard.paymentPending"),
      sold: t("properties.status.sold"),
      rented: t("properties.status.rented"),
    };
    return tabLabels[tab] || tab;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">
                {t("properties.manageProperties")}
              </h1>
              <p className="text-gray-600 mt-2">
                {t("properties.manageDescription")}
              </p>
              <div className="mt-2 text-sm text-gray-500">
                {t("properties.totalProperties")}: {allProperties.length}
              </div>
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t("common.search")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-80 bg-white shadow-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>
              <button
                onClick={fetchAllProperties}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200 font-medium shadow-sm flex items-center justify-center"
              >
                <span className="mr-2">🔄</span>
                {t("common.refresh")}
              </button>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border-l-4 ${
              message.type === "success"
                ? "bg-green-50 border-green-400 text-green-700"
                : "bg-red-50 border-red-400 text-red-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-lg mr-3">
                  {message.type === "success" ? "✅" : "❌"}
                </span>
                <span className="font-medium">{message.text}</span>
              </div>
              <button
                onClick={() => setMessage("")}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Selected Property Info */}
        {selectedProperty && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h3 className="font-semibold text-blue-900 text-lg">
                  {t("users.assigningBroker")}
                </h3>
                <p className="text-blue-700">
                  {t("common.selected")}:{" "}
                  <strong>"{selectedProperty.title}"</strong> •{" "}
                  {t(
                    `properties.propertyTypes.${selectedProperty.propertyType?.toLowerCase()}`
                  )}{" "}
                  • {formatPrice(selectedProperty.price)}
                </p>
                <p className="text-blue-600 text-sm mt-1">
                  {t("properties.navigateToUsers")}
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/admin/users"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 font-medium shadow-sm flex items-center"
                >
                  <span className="mr-2">👥</span>
                  {t("users.goToUsers")}
                </Link>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200 font-medium shadow-sm"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Tabs */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
            <div className="flex overflow-x-auto space-x-1">
              {[
                { key: "all", label: t("properties.allProperties") },
                { key: "pending", label: t("properties.pending") },
                { key: "available", label: t("properties.approved") },
                { key: "ordered", label: t("properties.status.ordered") },
                {
                  key: "payment-pending",
                  label: t("dashboard.paymentPending"),
                },
                { key: "sold", label: t("properties.status.sold") },
                { key: "rented", label: t("properties.status.rented") },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center px-6 py-3 rounded-xl transition duration-200 font-medium whitespace-nowrap flex-1 justify-center min-w-0 ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-2 text-lg">{getTabIcon(tab.key)}</span>
                  <span className="truncate">{tab.label}</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                      activeTab === tab.key
                        ? "bg-white text-blue-600"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {getCount(tab.key)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {[
            {
              status: "all",
              label: t("properties.total"),
              color: "from-gray-500 to-gray-600",
              count: allProperties.length,
            },
            {
              status: "pending",
              label: t("properties.pending"),
              color: "from-yellow-500 to-yellow-600",
              count: getCount("pending"),
            },
            {
              status: "available",
              label: t("properties.approved"),
              color: "from-green-500 to-green-600",
              count: getCount("available"),
            },
            {
              status: "ordered",
              label: t("properties.status.ordered"),
              color: "from-blue-500 to-blue-600",
              count: getCount("ordered"),
            },
            {
              status: "payment-pending",
              label: t("dashboard.paymentPending"),
              color: "from-orange-500 to-orange-600",
              count: getCount("payment-pending"),
            },
            {
              status: "sold",
              label: t("properties.status.sold"),
              color: "from-purple-500 to-purple-600",
              count: getCount("sold"),
            },
            {
              status: "rented",
              label: t("properties.status.rented"),
              color: "from-indigo-500 to-indigo-600",
              count: getCount("rented"),
            },
          ].map((stat) => (
            <div
              key={stat.status}
              className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 text-white cursor-pointer transform hover:scale-105 transition duration-200 shadow-lg`}
              onClick={() => setActiveTab(stat.status)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold">{stat.count}</p>
                  <p className="text-blue-100 font-medium">{stat.label}</p>
                </div>
                <div className="text-3xl opacity-90">
                  {getTabIcon(stat.status)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Properties Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {getTabLabel(activeTab)}
                <span className="text-gray-500 ml-2">
                  ({filteredProperties.length})
                </span>
              </h3>
              <div className="text-sm text-gray-500">
                {t("common.lastUpdated")}: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t("properties.propertyDetails")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t("properties.ownerInfo")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t("properties.price")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t("properties.status")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t("properties.assignedBroker")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t("users.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProperties.map((property) => (
                  <tr
                    key={property._id}
                    className="hover:bg-blue-50 transition duration-150 group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-14 w-14 flex-shrink-0">
                          {property.images && property.images.length > 0 ? (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="h-14 w-14 rounded-xl object-cover shadow-md group-hover:shadow-lg transition duration-200"
                            />
                          ) : (
                            <div className="h-14 w-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition duration-200">
                              <span className="text-xl">
                                {property.propertyType === "Home"
                                  ? "🏠"
                                  : property.propertyType === "Car"
                                  ? "🚗"
                                  : "💻"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900">
                            {property.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {t(
                              `properties.propertyTypes.${property.propertyType?.toLowerCase()}`
                            )}{" "}
                            •{" "}
                            {t(
                              `properties.purposes.${property.purpose?.toLowerCase()}`
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {property.city} • {t("properties.propertyId")}:{" "}
                            {property._id?.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {property.owner ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">
                            {property.owner.fname} {property.owner.lname}
                          </div>
                          <div className="text-sm text-gray-500">
                            {property.owner.email}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">
                          {t("properties.noOwnerInfo")}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(property.price)}
                      </div>
                      <div className="text-xs text-gray-500 uppercase">
                        {property.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusBadgeColor(
                            property.status
                          )}`}
                        >
                          <span className="mr-2">
                            {getStatusIcon(property.status)}
                          </span>
                          {t(
                            `properties.status.${property.status.toLowerCase()}`
                          )}
                        </span>
                        {property.orderInfo?.paymentStatus === "Pending" && (
                          <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                            💳 {t("dashboard.paymentPending")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {property.assignedBroker ? (
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mr-3 shadow-sm">
                            <span className="text-sm font-bold text-green-800">
                              {property.assignedBroker.fname?.[0]}
                              {property.assignedBroker.lname?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {property.assignedBroker.fname}{" "}
                              {property.assignedBroker.lname}
                            </div>
                            <div className="text-xs text-gray-500">
                              {property.assignedBroker.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-400">
                          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mr-3 shadow-sm">
                            <span className="text-sm">👤</span>
                          </div>
                          <span className="text-sm font-medium">
                            {t("properties.notAssigned")}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {/* Approve Action */}
                        {property.status === "Pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleApproveProperty(property._id)
                              }
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 text-sm font-medium flex items-center shadow-sm"
                              title={t("properties.approve")}
                            >
                              <span className="mr-1">✓</span>
                              {t("properties.approve")}
                            </button>
                            <button
                              onClick={() => handleRejectProperty(property._id)}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 text-sm font-medium flex items-center shadow-sm"
                              title={t("properties.reject")}
                            >
                              <span className="mr-1">✗</span>
                              {t("properties.reject")}
                            </button>
                          </>
                        )}

                        {/* Broker Assignment */}
                        {!property.assignedBroker &&
                          (property.status === "Pending" ||
                            property.status === "Available") && (
                            <button
                              onClick={() => handleAssignBrokerClick(property)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 text-sm font-medium flex items-center shadow-sm"
                              title={t("properties.assignBroker")}
                            >
                              <span className="mr-1">👤</span>
                              {t("properties.assignBroker")}
                            </button>
                          )}

                        {/* Change Broker */}
                        {property.assignedBroker && (
                          <button
                            onClick={() => handleAssignBrokerClick(property)}
                            className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200 text-sm font-medium flex items-center shadow-sm"
                            title={t("properties.changeBroker")}
                          >
                            <span className="mr-1">🔄</span>
                            {t("properties.changeBroker")}
                          </button>
                        )}

                        {/* Complete Order Action */}
                        {property.status === "Ordered" && (
                          <button
                            onClick={() => handleCompleteOrder(property._id)}
                            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-200 text-sm font-medium flex items-center shadow-sm"
                            title={t("properties.completeOrder")}
                          >
                            <span className="mr-1">✅</span>
                            {t("properties.completeOrder")}
                          </button>
                        )}

                        {/* Delete Action */}
                        <button
                          onClick={() => handleDeleteProperty(property._id)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 text-sm font-medium flex items-center shadow-sm"
                          title={t("common.delete")}
                        >
                          <span className="mr-1">🗑️</span>
                          {t("common.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProperties.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-300 text-8xl mb-4">
                {getTabIcon(activeTab)}
              </div>
              <h3 className="text-2xl font-semibold text-gray-600 mb-4">
                {activeTab === "pending"
                  ? t("properties.noPendingProperties")
                  : activeTab === "available"
                  ? t("properties.noApprovedProperties")
                  : activeTab === "ordered"
                  ? t("properties.noOrderedProperties")
                  : activeTab === "payment-pending"
                  ? t("properties.noPaymentPendingProperties")
                  : activeTab === "sold"
                  ? t("properties.noSoldProperties")
                  : activeTab === "rented"
                  ? t("properties.noRentedProperties")
                  : t("properties.noPropertiesFound")}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto text-lg mb-6">
                {activeTab === "pending"
                  ? t("properties.pendingDescription")
                  : activeTab === "available"
                  ? t("properties.approvedDescription")
                  : activeTab === "ordered"
                  ? t("properties.orderedDescription")
                  : activeTab === "payment-pending"
                  ? t("properties.paymentPendingDescription")
                  : activeTab === "sold"
                  ? t("properties.soldDescription")
                  : activeTab === "rented"
                  ? t("properties.rentedDescription")
                  : t("properties.noPropertiesDescription")}
              </p>
              <button
                onClick={fetchAllProperties}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200 font-medium shadow-lg flex items-center mx-auto"
              >
                <span className="mr-2">🔄</span>
                {t("common.refresh")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageProperties;
