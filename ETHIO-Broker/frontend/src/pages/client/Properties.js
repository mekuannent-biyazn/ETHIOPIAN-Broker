

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import axios from "../../api/axios";

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    propertyType: "",
    purpose: "",
    city: "",
    minPrice: "",
    maxPrice: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fetchProperties = useCallback(
    async (filterParams = filters) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: pagination.currentPage,
          limit: 12,
          ...filterParams,
        });

        const response = await axios.get(`/api/property?${params}`);
        const propertiesData = response.data.properties || response.data;

        setProperties(Array.isArray(propertiesData) ? propertiesData : []);
        setPagination({
          currentPage: response.data.currentPage || 1,
          totalPages: response.data.totalPages || 1,
          total: response.data.total || propertiesData.length || 0,
        });
      } catch (error) {
        console.error("Error fetching properties:", error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    },
    [pagination.currentPage, filters]
  );

  useEffect(() => {
    const propertyType = searchParams.get("propertyType") || "";
    const search = searchParams.get("search") || "";

    setFilters((prev) => ({
      ...prev,
      propertyType,
      search,
    }));
  }, [searchParams]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchProperties();
  };

  const clearFilters = () => {
    setFilters({
      propertyType: "",
      purpose: "",
      city: "",
      minPrice: "",
      maxPrice: "",
      search: "",
    });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  const PropertyCard = ({ property }) => {
    const [orderLoading, setOrderLoading] = useState(false);
    const [message, setMessage] = useState("");

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
        case "Ordered":
          return "bg-yellow-100 text-yellow-800";
        case "Sold":
        case "Rented":
          return "bg-red-100 text-red-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    const getPropertyTypeIcon = (type) => {
      switch (type) {
        case "Home":
          return "🏠";
        case "Car":
          return "🚗";
        case "Electronics":
          return "💻";
        default:
          return "🏢";
      }
    };

    const canOrderProperty = () => {
      if (!isAuthenticated) return false;
      if (property.owner?._id === user?._id) return false;
      if (["admin", "broker"].includes(user?.role)) return false;
      return property.status === "Available";
    };

    const handleOrder = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isAuthenticated) {
        setMessage(t("client.pleaseLoginToOrder"));
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }

      setOrderLoading(true);
      setMessage("");

      try {
        const orderResponse = await axios.post(
          `/api/property/${property._id}/order`
        );

        if (orderResponse.data.success) {
          setMessage(t("client.orderPlacedSuccessPayment"));

          const paymentResponse = await axios.post("/api/payments/initialize", {
            propertyId: property._id,
            paymentType: "full_payment",
          });

          if (paymentResponse.data.success) {
            window.location.href = paymentResponse.data.data.paymentUrl;
          } else {
            setMessage(t("client.paymentInitFailed"));
          }
        }
      } catch (error) {
        console.error("Error ordering property:", error);
        const errorMessage =
          error.response?.data?.message || t("client.orderError");
        setMessage(errorMessage);
      } finally {
        setOrderLoading(false);
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
        {/* Property Image */}
        <div className="relative h-48 bg-gray-200">
          {property.images && property.images.length > 0 ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-4xl">
                {getPropertyTypeIcon(property.propertyType)}
              </span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col space-y-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                property.status
              )}`}
            >
              {t(`client.${property.status.toLowerCase()}`)}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {property.propertyType}
            </span>
          </div>
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
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">{t("client.location")}:</span>
              <span className="ml-2">
                {property.city}, {property.location}
              </span>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">{t("client.price")}:</span>
              <span className="ml-2 text-lg font-bold text-blue-600">
                {formatPrice(property.price)}
              </span>
            </div>

            {/* Property Specific Details */}
            {property.propertyType === "Home" && property.homeDetails && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  🏠 {property.homeDetails.bedrooms} {t("client.beds")}
                </span>
                <span>
                  🛁 {property.homeDetails.bathrooms} {t("client.baths")}
                </span>
                <span>📏 {property.homeDetails.size} sqft</span>
              </div>
            )}

            {property.propertyType === "Car" && property.carDetails && (
              <div className="text-xs text-gray-500">
                <span>
                  🚗 {property.carDetails.brand} {property.carDetails.model}
                </span>
                <span className="ml-2">📅 {property.carDetails.year}</span>
              </div>
            )}
          </div>

          {/* Owner Info */}
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {property.owner?.fname?.charAt(0)}
              </div>
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-900">
                  {property.owner?.fname} {property.owner?.lname}
                </p>
                <p className="text-xs text-gray-500">{property.owner?.city}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 space-y-2">
            {message && (
              <div
                className={`text-sm p-2 rounded ${message.includes("success")
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                  }`}
              >
                {message}
              </div>
            )}

            <div className="flex space-x-2">
              <Link
                to={`/property/${property._id}`}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-center py-2 px-4 rounded text-sm font-medium transition duration-200"
              >
                {t("client.viewDetails")}
              </Link>

              <button
                onClick={handleOrder}
                disabled={
                  orderLoading ||
                  !isAuthenticated ||
                  property.owner?._id === user?._id ||
                  property.status !== "Available"
                }
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded text-sm font-medium transition duration-200"
              >
                {orderLoading ? t("client.ordering") : t("client.orderNow")}
              </button>
            </div>

            {!isAuthenticated && (
              <p className="text-xs text-gray-500 text-center">
                {t("client.pleaseLoginToOrder")}
              </p>
            )}

            {isAuthenticated && property.owner?._id === user?._id && (
              <p className="text-xs text-yellow-600 text-center">
                {t("client.yourProperty")}
              </p>
            )}

            {isAuthenticated &&
              property.status !== "Available" &&
              property.owner?._id !== user?._id && (
                <p className="text-xs text-red-600 text-center">
                  {t("client.propertyNotAvailable")}
                </p>
              )}
          </div>
        </div>
      </div>
    );
  };

  if (loading && properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-2">{t("client.loadingProperties")}</span>
          </div>
        </div>
      </div>
    );
  }

  // Filter available properties
  const availableProperties = properties.filter(
    (property) => property.status === "Available"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t("client.findPerfectProperty")}
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            {t("client.discoverPropertiesDescription")}
          </p>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  name="search"
                  placeholder={t("client.searchPropertiesPlaceholder")}
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
              >
                {t("client.search")}
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
              >
                {t("client.clear")}
              </button>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.propertyType")}
                </label>
                <select
                  name="propertyType"
                  value={filters.propertyType}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t("client.allTypes")}</option>
                  <option value="Home">{t("client.home")}</option>
                  <option value="Car">{t("client.car")}</option>
                  <option value="Electronics">{t("client.electronics")}</option>
                </select>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.purpose")}
                </label>
                <select
                  name="purpose"
                  value={filters.purpose}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t("client.allPurposes")}</option>
                  <option value="Sell">{t("client.forSale")}</option>
                  <option value="Rent">{t("client.forRent")}</option>
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.city")}
                </label>
                <input
                  type="text"
                  name="city"
                  placeholder={t("client.enterCity")}
                  value={filters.city}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Min Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.minPrice")} (ETB)
                </label>
                <input
                  type="number"
                  name="minPrice"
                  placeholder={t("client.minPrice")}
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.maxPrice")} (ETB)
                </label>
                <input
                  type="number"
                  name="maxPrice"
                  placeholder={t("client.maxPrice")}
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {t("client.availableProperties")} ({availableProperties.length})
          </h2>
          <p className="text-gray-600">
            {t("client.showingProperties", {
              count: availableProperties.length,
              total: pagination.total,
            })}
          </p>
        </div>

        {/* Properties Grid */}
        {availableProperties.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {availableProperties.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t("client.previous")}
                </button>

                <span className="px-4 py-2 text-gray-700">
                  {t("client.pageInfo", {
                    current: pagination.currentPage,
                    total: pagination.totalPages,
                  })}
                </span>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t("client.next")}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t("client.noPropertiesFound")}
            </h3>
            <p className="text-gray-600 mb-4">
              {t("client.adjustSearchCriteria")}
            </p>
            <button
              onClick={clearFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              {t("client.clearAllFilters")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;
