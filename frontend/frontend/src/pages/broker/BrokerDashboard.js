import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import axios from "../../api/axios";

const BrokerDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  const refreshDashboard = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching broker dashboard data...");

      const response = await axios.get(
        "/api/property/broker/assigned?limit=1000"
      );

      let propertiesData = response.data.properties || response.data;

      if (
        propertiesData &&
        typeof propertiesData === "object" &&
        !Array.isArray(propertiesData)
      ) {
        if (Array.isArray(propertiesData.data)) {
          propertiesData = propertiesData.data;
        } else if (Array.isArray(propertiesData.properties)) {
          propertiesData = propertiesData.properties;
        } else if (Array.isArray(propertiesData.items)) {
          propertiesData = propertiesData.items;
        } else {
          propertiesData =
            Object.values(propertiesData).find((val) => Array.isArray(val)) ||
            [];
        }
      }

      console.log("🏠 Fetched properties:", propertiesData);
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
    } catch (error) {
      console.error("❌ Error fetching broker dashboard data:", error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (propertiesData) => {
    if (!Array.isArray(propertiesData)) {
      return {
        total: 0,
        available: 0,
        ordered: 0,
        sold: 0,
        rented: 0,
        pending: 0,
      };
    }

    return {
      total: propertiesData.length,
      available: propertiesData.filter((p) => p.status === "Available").length,
      ordered: propertiesData.filter((p) => p.status === "Ordered").length,
      sold: propertiesData.filter((p) => p.status === "Sold").length,
      rented: propertiesData.filter((p) => p.status === "Rented").length,
      pending: propertiesData.filter((p) => p.status === "Pending").length,
    };
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

  const calculatePendingEarnings = () => {
    const orderedProperties = properties.filter(
      (p) => p.status === "Ordered" || p.status === "Payment_Pending"
    );

    const pendingEarnings = orderedProperties.reduce((total, property) => {
      const price = property.price || 0;
      const potentialCommission = calculateCommission(price, 0.02) * 2;
      return total + potentialCommission;
    }, 0);

    return pendingEarnings;
  };

  const calculateCommissionTransactions = () => {
    const soldOrRentedProperties = properties.filter(
      (p) => p.status === "Sold" || p.status === "Rented"
    );

    return soldOrRentedProperties.length * 2;
  };

  const calculateRoleBreakdown = () => {
    const soldOrRentedProperties = properties.filter(
      (p) => p.status === "Sold" || p.status === "Rented"
    );

    let buyerTotal = 0;
    let sellerTotal = 0;

    soldOrRentedProperties.forEach((property) => {
      const commissionData = calculateTotalCommission(property);
      buyerTotal += commissionData.buyerCommission;
      sellerTotal += commissionData.sellerCommission;
    });

    return [
      {
        _id: "buyer_renter",
        totalAmount: buyerTotal,
        count: soldOrRentedProperties.length,
      },
      {
        _id: "property_owner",
        totalAmount: sellerTotal,
        count: soldOrRentedProperties.length,
      },
    ];
  };

  const calculateTopProperties = () => {
    const soldOrRentedProperties = properties.filter(
      (p) => p.status === "Sold" || p.status === "Rented"
    );

    const propertiesWithCommission = soldOrRentedProperties.map((property) => {
      const commissionData = calculateTotalCommission(property);
      return {
        ...property,
        totalCommission: commissionData.totalCommission,
        transactionCount: 2,
      };
    });

    return propertiesWithCommission
      .sort((a, b) => b.totalCommission - a.totalCommission)
      .slice(0, 5);
  };

  const getRecentCommissions = () => {
    const soldOrRentedProperties = properties.filter(
      (p) => p.status === "Sold" || p.status === "Rented"
    );

    return soldOrRentedProperties
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt)
      )
      .slice(0, 5)
      .map((property) => {
        const commissionData = calculateTotalCommission(property);
        return {
          _id: property._id,
          property: property,
          title: property.title,
          paymentStatus: "Completed",
          amount: commissionData.totalCommission,
          paymentDate: property.updatedAt || property.createdAt,
          metadata: {
            role: "both",
            assignmentType: "admin_assigned",
            source: "property_sale",
          },
        };
      });
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return t("broker.currencyFormat", "ETB 0");

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
    });
  };

  const stats = calculateStats(properties);
  const totalEarnings = calculateTotalEarnings();
  const pendingEarnings = calculatePendingEarnings();
  const commissionTransactions = calculateCommissionTransactions();
  const roleBreakdown = calculateRoleBreakdown();
  const topProperties = calculateTopProperties();
  const recentCommissions = getRecentCommissions();
  const assignedProperties = properties.slice(0, 5);

  const successRate =
    stats.total > 0
      ? Math.round(((stats.sold + stats.rented) / stats.total) * 100)
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">
              {t("broker.loadingDashboard")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-4xl md:text-5xl font-bold">
                {t("broker.welcomeMessage", { name: user?.fname })}
              </h1>
              <button
                onClick={refreshDashboard}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition duration-200"
              >
                🔄 {t("broker.refresh")}
              </button>
            </div>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              {t("broker.subtitle")}
            </p>
            <div className="mt-4 text-sm opacity-75">
              <p>{t("broker.commissionStructure")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 -mt-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Earnings Card */}
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
                  {formatPrice(totalEarnings)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +{formatPrice(pendingEarnings)} {t("broker.pending")}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("broker.fromCompletedDeals", {
                    count: stats.sold + stats.rented,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Commission Transactions Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl mr-4">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("broker.commissionTransactions")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {commissionTransactions}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("broker.transactionBreakdown", {
                    properties: stats.sold + stats.rented,
                    sold: stats.sold,
                    rented: stats.rented,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Success Rate Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl mr-4">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("broker.dealSuccessRate")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {successRate}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("broker.successfulDeals", {
                    count: stats.sold + stats.rented,
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("broker.ofAssignedProperties", { count: stats.total })}
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Properties Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-xl mr-4">
                <span className="text-2xl">🏠</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("broker.assignedProperties")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.available} {t("broker.available")} • {stats.ordered}{" "}
                  {t("broker.ordered")}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.pending} {t("broker.pendingApproval")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Property Status Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center shadow-lg border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">{t("broker.total")}</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg border border-gray-100">
            <div className="text-2xl font-bold text-green-600">
              {stats.available}
            </div>
            <div className="text-sm text-gray-600">{t("broker.available")}</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg border border-gray-100">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.ordered}
            </div>
            <div className="text-sm text-gray-600">{t("broker.ordered")}</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg border border-gray-100">
            <div className="text-2xl font-bold text-purple-600">
              {stats.sold + stats.rented}
            </div>
            <div className="text-sm text-gray-600">
              {t("broker.soldRented")}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg border border-gray-100">
            <div className="text-2xl font-bold text-red-600">
              {stats.pending}
            </div>
            <div className="text-sm text-gray-600">{t("broker.pending")}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "overview", name: t("broker.tabOverview"), icon: "📊" },
                {
                  id: "commissions",
                  name: t("broker.tabCommissions"),
                  icon: "💰",
                },
                {
                  id: "properties",
                  name: t("broker.tabProperties"),
                  icon: "🏠",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-semibold text-sm transition duration-200 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Commission Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {t("broker.commissionByRole")}
                    </h3>
                    <div className="space-y-3">
                      {roleBreakdown.length > 0 ? (
                        roleBreakdown.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {item._id === "buyer_renter"
                                ? t("broker.buyerRenter")
                                : item._id === "property_owner"
                                ? t("broker.propertyOwner")
                                : item._id.replace("_", " ")}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {formatPrice(item.totalAmount)}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({item.count} {t("broker.transactions")})
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">
                          {t("broker.noCommissionData")}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center font-semibold">
                        <span className="text-sm text-gray-900">
                          {t("broker.total")}:
                        </span>
                        <span className="text-sm text-green-600">
                          {formatPrice(totalEarnings)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {t("broker.topEarningProperties")}
                    </h3>
                    <div className="space-y-3">
                      {topProperties.length > 0 ? (
                        topProperties.map((property, index) => (
                          <div
                            key={property._id}
                            className="flex justify-between items-center"
                          >
                            <span
                              className="text-sm font-medium text-gray-700 truncate flex-1 mr-2"
                              title={property.title}
                            >
                              {property.title}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold text-green-600 whitespace-nowrap">
                                {formatPrice(property.totalCommission)}
                              </span>
                              <span className="text-xs text-gray-500">
                                (4%)
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">
                          {t("broker.noCompletedSales")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Commissions */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t("broker.recentCompletedDeals")}
                    </h3>
                    <button
                      onClick={refreshDashboard}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {t("broker.refreshData")}
                    </button>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {recentCommissions.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {recentCommissions.map((commission) => (
                          <div
                            key={commission._id}
                            className="p-4 hover:bg-gray-50"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {t("broker.completed")}
                                  </span>
                                  <span className="text-sm text-gray-500 capitalize">
                                    {t("broker.saleCompleted")}
                                  </span>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {t("broker.adminAssigned")}
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 mt-1">
                                  {commission.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(commission.paymentDate)}
                                  <span> • {t("broker.totalCommission")}</span>
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-green-600">
                                  {formatPrice(commission.amount)}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {t("broker.commissionEarned")}
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                  {t("broker.autoCalculated")}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-4xl mb-2">💰</div>
                        <p className="text-gray-600">
                          {t("broker.noCompletedDeals")}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          {t("broker.commissionsWillAppear")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "commissions" && (
              <div>
                <CommissionsList
                  properties={properties}
                  onRefresh={refreshDashboard}
                />
              </div>
            )}

            {activeTab === "properties" && (
              <div>
                <AssignedPropertiesList properties={assignedProperties} />
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/broker/properties"
            className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition duration-300 text-center group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition duration-200">
              🏠
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {t("broker.allProperties")}
            </h3>
            <p className="text-gray-600 text-sm">
              {t("broker.viewManageProperties")}
            </p>
          </Link>

          <Link
            to="/broker/commissions"
            className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition duration-300 text-center group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition duration-200">
              💰
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {t("broker.commissionDetails")}
            </h3>
            <p className="text-gray-600 text-sm">
              {t("broker.viewCommissionBreakdown")}
            </p>
          </Link>

          <Link
            to="/broker/profile"
            className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition duration-300 text-center group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition duration-200">
              👤
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {t("broker.brokerProfile")}
            </h3>
            <p className="text-gray-600 text-sm">
              {t("broker.updateBrokerInfo")}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Commissions List Component
const CommissionsList = ({ properties, onRefresh }) => {
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [filters, setFilters] = useState({
    status: "completed",
  });
  const { t } = useTranslation();

  useEffect(() => {
    filterProperties();
  }, [properties, filters]);

  const filterProperties = () => {
    let filtered = [...properties];

    if (filters.status === "completed") {
      filtered = filtered.filter(
        (p) => p.status === "Sold" || p.status === "Rented"
      );
    } else if (filters.status === "pending") {
      filtered = filtered.filter(
        (p) => p.status === "Ordered" || p.status === "Payment_Pending"
      );
    }

    setFilteredProperties(filtered);
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

    if (
      property.status === "Ordered" ||
      property.status === "Payment_Pending"
    ) {
      const price = property.price || 0;
      const potentialCommission = calculateCommission(price, 0.02) * 2;

      return {
        sellerCommission: calculateCommission(price, 0.02),
        buyerCommission: calculateCommission(price, 0.02),
        totalCommission: potentialCommission,
        finalPrice: price,
        isPotential: true,
      };
    }

    return {
      sellerCommission: 0,
      buyerCommission: 0,
      totalCommission: 0,
      finalPrice: 0,
    };
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return t("broker.currencyFormat", "ETB 0");

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
    });
  };

  const getStatusBadge = (status, isPotential = false) => {
    if (isPotential) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          {t("broker.potential")}
        </span>
      );
    }

    const statusConfig = {
      Sold: { color: "bg-purple-100 text-purple-800", text: t("broker.sold") },
      Rented: {
        color: "bg-purple-100 text-purple-800",
        text: t("broker.rented"),
      },
      Ordered: {
        color: "bg-blue-100 text-blue-800",
        text: t("broker.ordered"),
      },
      Payment_Pending: {
        color: "bg-orange-100 text-orange-800",
        text: t("broker.paymentPending"),
      },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800",
      text: status,
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {t("broker.commissionDetails")}
        </h3>
        <div className="flex space-x-4">
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="completed">{t("broker.completed")}</option>
            <option value="pending">{t("broker.pending")}</option>
            <option value="all">{t("broker.all")}</option>
          </select>
          <button
            onClick={onRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-200"
          >
            {t("broker.refresh")}
          </button>
        </div>
      </div>

      {filteredProperties.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredProperties.map((property) => {
              const commissionData = calculateTotalCommission(property);
              const isPotential = commissionData.isPotential;

              return (
                <div key={property._id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusBadge(property.status, isPotential)}
                        <span className="text-sm text-gray-500 capitalize">
                          {property.propertyType} • {t("broker.for")}{" "}
                          {property.purpose}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {t("broker.adminAssigned")}
                        </span>
                      </div>

                      <h4 className="text-lg font-semibold text-gray-900">
                        {property.title}
                      </h4>

                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">
                            {t("broker.finalPrice")}:
                          </span>{" "}
                          {formatPrice(commissionData.finalPrice)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">
                            {t("broker.owner")}:
                          </span>{" "}
                          {property.owner?.fname}{" "}
                          {property.owner?.lname || t("broker.unknown")}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">
                            {t("broker.date")}:
                          </span>{" "}
                          {formatDate(property.updatedAt || property.createdAt)}
                        </p>
                      </div>

                      {/* Commission Breakdown */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">
                              {t("broker.fromSeller")} (2%):
                            </div>
                            <div className="font-semibold text-green-600">
                              {formatPrice(commissionData.sellerCommission)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">
                              {t("broker.fromBuyer")} (2%):
                            </div>
                            <div className="font-semibold text-green-600">
                              {formatPrice(commissionData.buyerCommission)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-2xl font-bold ${
                          isPotential ? "text-yellow-600" : "text-green-600"
                        }`}
                      >
                        {formatPrice(commissionData.totalCommission)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {isPotential
                          ? t("broker.potentialCommission")
                          : t("broker.totalCommission")}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        (4% {t("broker.of")}{" "}
                        {formatPrice(commissionData.finalPrice)})
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t("broker.noCommissionsFound")}
          </h3>
          <p className="text-gray-600">
            {filters.status !== "all"
              ? t("broker.noCommissionsForFilter", { status: filters.status })
              : t("broker.noCommissionsYet")}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {t("broker.commissionsCalculatedWhen")}
          </p>
        </div>
      )}
    </div>
  );
};

// Assigned Properties Component
const AssignedPropertiesList = ({ properties }) => {
  const { t } = useTranslation();

  const formatPrice = (price) => {
    if (!price && price !== 0) return t("broker.priceNotSet");
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800";
      case "Ordered":
        return "bg-yellow-100 text-yellow-800";
      case "Sold":
        return "bg-purple-100 text-purple-800";
      case "Rented":
        return "bg-purple-100 text-purple-800";
      case "Pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {t("broker.recentlyAssignedProperties")}
        </h3>
        <Link
          to="/broker/properties"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-200"
        >
          {t("broker.viewAll")}
        </Link>
      </div>

      {properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {properties.map((property) => (
            <div
              key={property._id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {property.title}
                </h4>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    property.status
                  )}`}
                >
                  {property.status}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {property.description || t("broker.noDescriptionAvailable")}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("broker.price")}:</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(property.price)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("broker.type")}:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {property.propertyType || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("broker.purpose")}:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {property.purpose || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("broker.location")}:</span>
                  <span className="font-medium text-gray-900">
                    {property.city || property.location || "N/A"}
                  </span>
                </div>
              </div>

              <Link
                to={`/property/${property._id}`}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg font-semibold transition duration-200 block"
              >
                {t("broker.viewDetails")}
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t("broker.noAssignedProperties")}
          </h3>
          <p className="text-gray-600">
            {t("broker.noAssignedPropertiesDesc")}
          </p>
        </div>
      )}
    </div>
  );
};

export default BrokerDashboard;
