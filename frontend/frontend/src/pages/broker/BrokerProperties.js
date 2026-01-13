import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../../api/axios";
import { useTranslation } from "react-i18next";

const BrokerProperties = () => {
  const { t } = useTranslation();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    ordered: 0,
    sold: 0,
    rented: 0,
    pending: 0,
  });
  const [filters, setFilters] = useState({
    status: "all",
    propertyType: "all",
    purpose: "all",
    search: "",
  });
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    filterAndSortProperties();
  }, [properties, filters, sortBy]);

  const fetchProperties = async () => {
    try {
      const response = await axios.get(
        "/api/property/broker/assigned?limit=1000"
      );
      const propertiesData = response.data.properties || response.data;
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
      calculateStats(propertiesData);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (propertiesData) => {
    if (!Array.isArray(propertiesData)) return;

    const stats = {
      total: propertiesData.length,
      available: propertiesData.filter((p) => p.status === "Available").length,
      ordered: propertiesData.filter((p) => p.status === "Ordered").length,
      sold: propertiesData.filter((p) => p.status === "Sold").length,
      rented: propertiesData.filter((p) => p.status === "Rented").length,
      pending: propertiesData.filter((p) => p.status === "Pending").length,
    };

    setStats(stats);
  };

  const filterAndSortProperties = () => {
    let filtered = [...properties];

    if (filters.status !== "all") {
      filtered = filtered.filter(
        (property) => property.status === filters.status
      );
    }

    if (filters.propertyType !== "all") {
      filtered = filtered.filter(
        (property) => property.propertyType === filters.propertyType
      );
    }

    if (filters.purpose !== "all") {
      filtered = filtered.filter(
        (property) => property.purpose === filters.purpose
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (property) =>
          property.title?.toLowerCase().includes(searchTerm) ||
          property.description?.toLowerCase().includes(searchTerm) ||
          property.city?.toLowerCase().includes(searchTerm) ||
          property.owner?.fname?.toLowerCase().includes(searchTerm) ||
          property.owner?.lname?.toLowerCase().includes(searchTerm)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        default:
          return 0;
      }
    });

    setFilteredProperties(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return t("broker.priceNotSet");

    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Available: {
        color: "bg-green-100 text-green-800",
        text: t("properties.status.available"),
      },
      Ordered: {
        color: "bg-blue-100 text-blue-800",
        text: t("properties.status.ordered"),
      },
      Sold: {
        color: "bg-purple-100 text-purple-800",
        text: t("properties.status.sold"),
      },
      Rented: {
        color: "bg-purple-100 text-purple-800",
        text: t("properties.status.rented"),
      },
      Pending: {
        color: "bg-yellow-100 text-yellow-800",
        text: t("properties.status.pending"),
      },
      Payment_Pending: {
        color: "bg-orange-100 text-orange-800",
        text: t("dashboard.paymentPending"),
      },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800",
      text: status,
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  const calculateCommission = (price, commissionRate = 0.02) => {
    if (!price || price === 0) return 0;
    return price * commissionRate;
  };

  const calculateTotalCommission = (property) => {
    if (property.status === "Sold" || property.status === "Rented") {
      const finalPrice =
        property.finalPrice || property.price || property.rentPrice || 0;

      const sellerCommission = calculateCommission(finalPrice, 0.02);
      const buyerCommission = calculateCommission(finalPrice, 0.02);
      const totalCommission = sellerCommission + buyerCommission;

      return {
        sellerCommission,
        buyerCommission,
        totalCommission,
        finalPrice,
      };
    }

    return {
      sellerCommission: 0,
      buyerCommission: 0,
      totalCommission: 0,
      finalPrice: 0,
    };
  };

  const getCommissionInfo = (property) => {
    if (property.status === "Sold" || property.status === "Rented") {
      const commissionData = calculateTotalCommission(property);

      if (commissionData.totalCommission > 0) {
        return (
          <div className="text-sm text-green-600 font-semibold">
            {t("broker.totalCommission")}:{" "}
            {formatPrice(commissionData.totalCommission)}
          </div>
        );
      } else {
        return (
          <div className="text-sm text-orange-600 font-medium">
            {t("broker.commissionPending")}
          </div>
        );
      }
    }

    if (
      property.status === "Ordered" ||
      property.status === "Payment_Pending"
    ) {
      const price = property.price || 0;
      const potentialCommission = calculateCommission(price, 0.02) * 2;

      if (potentialCommission > 0) {
        return (
          <div className="text-sm text-blue-600 font-medium">
            {t("broker.potential")}: {formatPrice(potentialCommission)}
          </div>
        );
      }
    }

    return null;
  };

  const getCommissionBreakdown = (property) => {
    if (property.status === "Sold" || property.status === "Rented") {
      const commissionData = calculateTotalCommission(property);

      if (commissionData.totalCommission > 0) {
        return (
          <div className="text-xs text-gray-600 mt-1 space-y-1">
            <div className="flex justify-between">
              <span>{t("broker.fromSeller")} (2%):</span>
              <span className="font-medium">
                {formatPrice(commissionData.sellerCommission)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t("broker.fromBuyer")} (2%):</span>
              <span className="font-medium">
                {formatPrice(commissionData.buyerCommission)}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
              <span className="font-semibold">{t("broker.total")} (4%):</span>
              <span className="font-semibold text-green-600">
                {formatPrice(commissionData.totalCommission)}
              </span>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  const getDaysOnMarket = (createdAt) => {
    if (!createdAt) return "N/A";

    const created = new Date(createdAt);
    const today = new Date();
    const diffTime = Math.abs(today - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTotalEarnings = () => {
    const soldOrRentedProperties = properties.filter(
      (p) => p.status === "Sold" || p.status === "Rented"
    );

    const totalEarnings = soldOrRentedProperties.reduce((total, property) => {
      const commissionData = calculateTotalCommission(property);
      return total + commissionData.totalCommission;
    }, 0);

    return totalEarnings;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const totalEarnings = calculateTotalEarnings();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t("broker.assignedProperties")}
              </h1>
              <p className="text-gray-600 mt-2">
                {t("broker.managePropertiesForBrokerage")}
              </p>
            </div>
            <Link
              to="/broker/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
            >
              {t("broker.backToDashboard")}
            </Link>
          </div>
        </div>

        {/* Property Stats with Earnings */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">{t("properties.total")}</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {stats.available}
            </div>
            <div className="text-sm text-gray-600">
              {t("properties.status.available")}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">
              {stats.ordered}
            </div>
            <div className="text-sm text-gray-600">
              {t("properties.status.ordered")}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {stats.sold}
            </div>
            <div className="text-sm text-gray-600">
              {t("properties.status.sold")}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {stats.rented}
            </div>
            <div className="text-sm text-gray-600">
              {t("properties.status.rented")}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <div className="text-sm text-gray-600">
              {t("properties.status.pending")}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-green-200 bg-green-50">
            <div className="text-2xl font-bold text-green-700">
              {formatPrice(totalEarnings)}
            </div>
            <div className="text-sm text-green-600 font-semibold">
              {t("broker.totalEarnings")}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("common.search")}
              </label>
              <input
                type="text"
                placeholder={t("broker.searchProperties")}
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("properties.status")}
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t("broker.allStatus")}</option>
                <option value="Available">
                  {t("properties.status.available")}
                </option>
                <option value="Ordered">
                  {t("properties.status.ordered")}
                </option>
                <option value="Sold">{t("properties.status.sold")}</option>
                <option value="Rented">{t("properties.status.rented")}</option>
                <option value="Pending">
                  {t("properties.status.pending")}
                </option>
                <option value="Payment_Pending">
                  {t("dashboard.paymentPending")}
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("dashboard.propertyType")}
              </label>
              <select
                value={filters.propertyType}
                onChange={(e) =>
                  handleFilterChange("propertyType", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t("broker.allTypes")}</option>
                <option value="Home">
                  {t("properties.propertyTypes.home")}
                </option>
                <option value="Car">{t("properties.propertyTypes.car")}</option>
                <option value="Electronics">
                  {t("properties.propertyTypes.electronics")}
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("properties.purpose")}
              </label>
              <select
                value={filters.purpose}
                onChange={(e) => handleFilterChange("purpose", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t("broker.allPurposes")}</option>
                <option value="Sell">{t("properties.purposes.sell")}</option>
                <option value="Rent">{t("properties.purposes.rent")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("broker.sortBy")}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">{t("broker.newestFirst")}</option>
                <option value="oldest">{t("broker.oldestFirst")}</option>
                <option value="price-high">{t("broker.priceHighToLow")}</option>
                <option value="price-low">{t("broker.priceLowToHigh")}</option>
                <option value="title">{t("broker.titleAZ")}</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setFilters({
                  status: "all",
                  propertyType: "all",
                  purpose: "all",
                  search: "",
                });
                setSortBy("newest");
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-semibold transition duration-200"
            >
              {t("broker.resetFilters")}
            </button>
          </div>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <div
                key={property._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition duration-300 overflow-hidden"
              >
                {/* Property Image */}
                <div className="h-48 bg-gray-200 relative">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <span className="text-4xl">
                        {property.propertyType === "Home"
                          ? "🏠"
                          : property.propertyType === "Car"
                          ? "🚗"
                          : "💻"}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(property.status)}
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      {t(
                        `properties.propertyTypes.${property.propertyType?.toLowerCase()}`
                      )}
                    </span>
                  </div>
                  {property.purpose && (
                    <div className="absolute bottom-3 left-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          property.purpose === "Sell"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {t("broker.for")}{" "}
                        {t(
                          `properties.purposes.${property.purpose?.toLowerCase()}`
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                    {property.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {property.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {t("users.location")}:
                      </span>
                      <span className="font-medium">
                        {property.city || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {t("broker.owner")}:
                      </span>
                      <span className="font-medium">
                        {property.owner?.fname} {property.owner?.lname}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {t("broker.daysOnMarket")}:
                      </span>
                      <span className="font-medium">
                        {getDaysOnMarket(property.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xl font-bold text-gray-900">
                        {formatPrice(property.price)}
                      </span>
                      {getCommissionInfo(property)}
                    </div>
                    {getCommissionBreakdown(property)}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    <Link
                      to={`/property/${property._id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md text-sm font-medium transition duration-300"
                    >
                      {t("common.view")} {t("common.details")}
                    </Link>
                    <Link
                      to={`/communication/:userId`}
                      className="bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded-md text-sm font-medium transition duration-300"
                    >
                      {t("broker.contactOwner")}
                    </Link>
                  </div>

                  {/* Quick Actions */}
                  {property.status === "Available" && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm font-medium transition duration-300">
                        {t("broker.markAsFeatured")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🏠</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {properties.length === 0
                ? t("broker.noPropertiesAssigned")
                : t("broker.noPropertiesMatch")}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {properties.length === 0
                ? t("broker.noPropertiesAssignedYet")
                : t("broker.adjustSearchTerms")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerProperties;
