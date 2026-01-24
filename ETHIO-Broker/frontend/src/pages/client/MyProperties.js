import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import axios from "../../api/axios";

const MyProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchMyProperties();
  }, []);

  const fetchMyProperties = async () => {
    try {
      const response = await axios.get("/api/property/my-properties");
      setProperties(response.data.properties || response.data);
    } catch (error) {
      console.error("Error fetching properties:", error);
      setMessage(t("client.propertyFetchError"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = () => {
    navigate("/client/create-property");
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
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Ordered":
        return "bg-blue-100 text-blue-800";
      case "Sold":
        return "bg-red-100 text-red-800";
      case "Rented":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm(t("client.confirmDeleteProperty"))) {
      return;
    }

    try {
      await axios.delete(`/api/property/${propertyId}`);
      setMessage(t("client.propertyDeletedSuccess"));
      fetchMyProperties();
    } catch (error) {
      console.error("Error deleting property:", error);
      setMessage(t("client.propertyDeleteError"));
    }
  };

  const handleEditProperty = (propertyId) => {
    const property = properties.find((p) => p._id === propertyId);
    if (
      property &&
      (property.status === "Sold" || property.status === "Rented")
    ) {
      setMessage(t("client.cannotEditSoldRented"));
      return;
    }
    navigate(`/client/edit-property/${propertyId}`);
  };

  const handleViewProperty = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  const canEditProperty = (property) => {
    return property.status !== "Sold" && property.status !== "Rented";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">
              {t("client.loadingProperties")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("client.myProperties")}
            </h1>
            <p className="text-gray-600 mt-2">{t("client.manageProperties")}</p>
          </div>

          <button
            onClick={handleAddProperty}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {t("client.addNewProperty")}
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">
              {properties.length}
            </div>
            <div className="text-sm text-gray-600">
              {t("client.totalProperties")}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-green-600">
              {properties.filter((p) => p.status === "Available").length}
            </div>
            <div className="text-sm text-gray-600">{t("client.available")}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-yellow-600">
              {properties.filter((p) => p.status === "Pending").length}
            </div>
            <div className="text-sm text-gray-600">{t("client.pending")}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">
              {properties.filter((p) => p.status === "Ordered").length}
            </div>
            <div className="text-sm text-gray-600">{t("client.ordered")}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-red-600">
              {
                properties.filter(
                  (p) => p.status === "Sold" || p.status === "Rented",
                ).length
              }
            </div>
            <div className="text-sm text-gray-600">
              {t("client.soldRented")}
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("success")
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div
                key={property._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                {/* Property Image */}
                <div className="relative h-48 bg-gray-200">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full flex items-center justify-center text-gray-400 ${
                      property.images && property.images.length > 0
                        ? "hidden"
                        : "flex"
                    }`}
                  >
                    <span className="text-4xl">
                      {property.propertyType === "Home"
                        ? "🏠"
                        : property.propertyType === "Car"
                          ? "🚗"
                          : "💻"}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        property.status,
                      )}`}
                    >
                      {t(`client.${property.status.toLowerCase()}`)}
                    </span>
                  </div>

                  {/* Admin Approval Badge */}
                  {property.approvedByAdmin && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        ✓ {t("client.approved")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                    {property.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {property.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {t("client.price")}:
                      </span>
                      <span className="font-bold text-blue-600">
                        {formatPrice(property.price)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{t("client.type")}:</span>
                      <span className="capitalize">
                        {property.propertyType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {t("client.purpose")}:
                      </span>
                      <span className="capitalize">{property.purpose}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {t("client.location")}:
                      </span>
                      <span>{property.city}</span>
                    </div>
                  </div>

                  {/* Order Info */}
                  {property.orderInfo && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2 text-sm">
                        {t("client.orderInformation")}
                      </h4>
                      <div className="text-xs text-blue-700 space-y-1">
                        <div>
                          {t("client.orderedBy")}:{" "}
                          {property.orderInfo.orderedBy?.fname}{" "}
                          {property.orderInfo.orderedBy?.lname}
                        </div>
                        <div>
                          {t("client.date")}:{" "}
                          {new Date(
                            property.orderInfo.orderDate,
                          ).toLocaleDateString()}
                        </div>
                        <div className="capitalize">
                          {t("client.payment")}:{" "}
                          {property.orderInfo.paymentStatus ||
                            t("client.pending")}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewProperty(property._id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-3 rounded text-sm font-medium transition-colors"
                    >
                      {t("client.view")}
                    </button>

                    <button
                      onClick={() => handleEditProperty(property._id)}
                      disabled={!canEditProperty(property)}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-center py-2 px-3 rounded text-sm font-medium transition-colors"
                    >
                      {t("client.edit")}
                    </button>

                    <button
                      onClick={() => handleDeleteProperty(property._id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                    >
                      {t("client.delete")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {t("client.noPropertiesYet")}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {t("client.noPropertiesDescription")}
            </p>
            <button
              onClick={handleAddProperty}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t("client.listFirstProperty")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProperties;
