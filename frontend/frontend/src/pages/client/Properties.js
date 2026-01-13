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
  const [showFilters, setShowFilters] = useState(false);
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
    }).format(price);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Available":
        return "bg-emerald-500/10 text-emerald-700 border border-emerald-200";
      case "Ordered":
        return "bg-yellow-500/10 text-yellow-700 border border-yellow-200";
      case "Sold":
        return "bg-red-500/10 text-red-700 border border-red-200";
      case "Rented":
        return "bg-purple-500/10 text-purple-700 border border-purple-200";
      default:
        return "bg-gray-500/10 text-gray-700 border border-gray-200";
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

  const canOrderProperty = (property) => {
    if (!isAuthenticated) return false;
    if (property.owner?._id === user?._id) return false;
    if (["admin", "broker"].includes(user?.role)) return false;
    return property.status === "Available";
  };

  const PropertyCard = ({ property }) => {
    const [orderLoading, setOrderLoading] = useState(false);
    const [message, setMessage] = useState("");

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
      <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-100">
        {/* Image Section */}
        <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {property.images && property.images.length > 0 ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-5xl text-gray-300">
                {getPropertyTypeIcon(property.propertyType)}
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm ${getStatusBadgeColor(
                property.status
              )}`}
            >
              {t(`client.${property.status.toLowerCase()}`)}
            </span>
          </div>

          {/* Price Tag */}
          <div className="absolute bottom-4 left-4">
            <div className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(property.price)}
              </span>
            </div>
          </div>

          {/* Property Type Tag */}
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-gray-700 rounded-lg text-xs font-semibold shadow-sm">
              {property.propertyType}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Title */}
          <h3 className="font-bold text-gray-900 text-lg mb-3 line-clamp-1">
            {property.title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
            {property.description}
          </p>

          {/* Location */}
          <div className="flex items-center text-sm text-gray-500 mb-5">
            <svg
              className="w-4 h-4 mr-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>
              {property.city}, {property.location}
            </span>
          </div>

          {/* Details Grid */}
          {property.propertyType === "Home" && property.homeDetails && (
            <div className="grid grid-cols-3 gap-2 mb-5 p-3 bg-gray-50 rounded-xl">
              <div className="text-center">
                <div className="text-gray-700 font-semibold">
                  {property.homeDetails.bedrooms}
                </div>
                <div className="text-xs text-gray-500">{t("client.beds")}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-700 font-semibold">
                  {property.homeDetails.bathrooms}
                </div>
                <div className="text-xs text-gray-500">{t("client.baths")}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-700 font-semibold">
                  {property.homeDetails.size}
                </div>
                <div className="text-xs text-gray-500">sqft</div>
              </div>
            </div>
          )}

          {property.propertyType === "Car" && property.carDetails && (
            <div className="grid grid-cols-3 gap-2 mb-5 p-3 bg-gray-50 rounded-xl">
              <div className="text-center">
                <div className="text-gray-700 font-semibold text-sm">
                  {property.carDetails.brand}
                </div>
                <div className="text-xs text-gray-500">Brand</div>
              </div>
              <div className="text-center">
                <div className="text-gray-700 font-semibold text-sm">
                  {property.carDetails.model}
                </div>
                <div className="text-xs text-gray-500">Model</div>
              </div>
              <div className="text-center">
                <div className="text-gray-700 font-semibold">
                  {property.carDetails.year}
                </div>
                <div className="text-xs text-gray-500">Year</div>
              </div>
            </div>
          )}

          {/* Owner Info */}
          <div className="flex items-center justify-between mb-5 border-t pt-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {property.owner?.fname?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {property.owner?.fname} {property.owner?.lname}
                </p>
                <p className="text-xs text-gray-500">{property.owner?.city}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Link
              to={`/property/${property._id}`}
              className="flex-1 bg-gray-900 hover:bg-black text-white text-center py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
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
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 text-white text-center py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {orderLoading ? (
                <span className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t("client.ordering")}
                </span>
              ) : (
                t("client.orderNow")
              )}
            </button>
          </div>

          {/* Status Messages */}
          {message && (
            <div
              className={`mt-3 text-sm p-2.5 rounded-lg ${
                message.includes("success")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          {!isAuthenticated && (
            <p className="mt-3 text-xs text-gray-500 text-center">
              {t("client.pleaseLoginToOrder")}
            </p>
          )}

          {isAuthenticated && property.owner?._id === user?._id && (
            <p className="mt-3 text-xs text-yellow-600 text-center">
              {t("client.yourProperty")}
            </p>
          )}

          {isAuthenticated &&
            property.status !== "Available" &&
            property.owner?._id !== user?._id && (
              <p className="mt-3 text-xs text-red-600 text-center">
                {t("client.propertyNotAvailable")}
              </p>
            )}
        </div>
      </div>
    );
  };

  if (loading && properties.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-gray-600 text-lg font-medium">
            {t("client.loadingProperties")}
          </p>
        </div>
      </div>
    );
  }

  // Filter available properties
  const availableProperties = properties.filter(
    (property) => property.status === "Available"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Search Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Professional Search Bar */}
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl blur opacity-30"></div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-1">
                  <div className="flex items-center">
                    <svg
                      className="absolute left-6 w-5 h-5 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      name="search"
                      placeholder={t("client.searchPropertiesPlaceholder")}
                      value={filters.search}
                      onChange={handleFilterChange}
                      className="w-full pl-14 pr-40 py-4 bg-transparent text-white placeholder-gray-300 focus:outline-none text-lg"
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-4 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-all duration-200"
                      >
                        {showFilters ? "Hide Filters" : "Show Filters"}
                      </button>
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg"
                      >
                        {t("client.search")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Collapsible Filters */}
        {showFilters && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {t("client.filterProperties")}
                </h2>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  >
                    {t("client.applyFilters")}
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  >
                    {t("client.clearAll")}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("client.propertyType")}
                  </label>
                  <div className="relative">
                    <select
                      name="propertyType"
                      value={filters.propertyType}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    >
                      <option value="">{t("client.allTypes")}</option>
                      <option value="Home">{t("client.home")}</option>
                      <option value="Car">{t("client.car")}</option>
                      <option value="Electronics">
                        {t("client.electronics")}
                      </option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("client.purpose")}
                  </label>
                  <div className="relative">
                    <select
                      name="purpose"
                      value={filters.purpose}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    >
                      <option value="">{t("client.allPurposes")}</option>
                      <option value="Sell">{t("client.forSale")}</option>
                      <option value="Rent">{t("client.forRent")}</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("client.city")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="city"
                      placeholder={t("client.enterCity")}
                      value={filters.city}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Min Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("client.minPrice")}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="minPrice"
                      placeholder={t("client.minPrice")}
                      value={filters.minPrice}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500">ETB</span>
                    </div>
                  </div>
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("client.maxPrice")}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="maxPrice"
                      placeholder={t("client.maxPrice")}
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500">ETB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t("client.availableProperties")}
            </h2>
            <p className="text-gray-600 mt-2">
              {t("client.showingProperties", {
                count: availableProperties.length,
                total: pagination.total,
              })}
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center gap-4">
            <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
              {availableProperties.length} {t("client.properties")}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              {showFilters ? t("client.hideFilters") : t("client.showFilters")}
            </button>
          </div>
        </div>

        {/* Properties Grid */}
        {availableProperties.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {availableProperties.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>

            {/* Modern Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-8 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {t("client.showingPage", {
                    current: pagination.currentPage,
                    total: pagination.totalPages,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    {t("client.previous")}
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (
                          pagination.currentPage >=
                          pagination.totalPages - 2
                        ) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={i}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
                              pagination.currentPage === pageNum
                                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                                : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
                  >
                    {t("client.next")}
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
              <span className="text-4xl text-gray-400">🏠</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {t("client.noPropertiesFound")}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {t("client.adjustSearchCriteria")}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={clearFilters}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
              >
                {t("client.clearAllFilters")}
              </button>
              <button
                onClick={() => setShowFilters(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
              >
                {t("client.adjustFilters")}
              </button>
            </div>
          </div>
        )}

        {/* Add Property CTA for Authenticated Users */}
        {isAuthenticated && (
          <div className="mt-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">
                {t("client.listYourProperty")}
              </h3>
              <p className="text-emerald-100 mb-6">
                {t("client.reachThousandsBuyers")}
              </p>
              <Link
                to="/client/create-property"
                className="inline-flex items-center gap-2 bg-white text-emerald-600 hover:bg-emerald-50 px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
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
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                {t("client.addNewProperty")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;
