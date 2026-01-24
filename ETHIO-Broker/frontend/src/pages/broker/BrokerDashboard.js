import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "../../api/axios";

const BrokerDashboard = () => {
  const [stats, setStats] = useState({
    totalAssigned: 0,
    availableProperties: 0,
    orderedProperties: 0,
    completedProperties: 0,
  });
  const [commissionStats, setCommissionStats] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    totalTransactions: 0,
  });
  const [recentProperties, setRecentProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      await fetchCommissionData();
    };
    loadData();
  }, []);

  useEffect(() => {
    // Fetch broker data after commission stats are loaded
    if (commissionStats.totalTransactions !== undefined) {
      fetchBrokerData();
    }
  }, [commissionStats]);

  const fetchBrokerData = async () => {
    try {
      // Get existing properties
      const response = await axios.get("/api/property/broker/assigned");
      const properties = response.data.properties || response.data;

      // Calculate stats from properties (will be consistent with commission data)
      const existingCompleted = properties.filter(
        (p) => p.status === "Sold" || p.status === "Rented"
      ).length;

      // Use commission stats for completed count (calculated from same property data)
      const totalCompleted = Math.max(
        Math.floor(commissionStats.totalTransactions - (commissionStats.pendingEarnings > 0 ? 1 : 0)),
        existingCompleted
      );

      // Total assigned properties = existing properties + deleted completed properties
      const deletedCompleted = Math.max(0, totalCompleted - existingCompleted);
      const totalAssigned = properties.length + deletedCompleted;

      setStats({
        totalAssigned: totalAssigned,
        availableProperties: properties.filter((p) => p.status === "Available").length,
        orderedProperties: properties.filter((p) => p.status === "Ordered").length,
        completedProperties: totalCompleted,
      });

      setRecentProperties(
        Array.isArray(properties) ? properties.slice(0, 5) : []
      );
    } catch (error) {
      console.error("Error fetching broker data:", error);
      // Set default values on error
      setStats({
        totalAssigned: 0,
        availableProperties: 0,
        orderedProperties: 0,
        completedProperties: 0,
      });
    }
  };

  const fetchCommissionData = async () => {
    try {
      // Use the same method as commission history to ensure consistency
      const propertiesResponse = await axios.get("/api/property/broker/assigned?limit=1000");
      const propertiesData = propertiesResponse.data.properties || propertiesResponse.data;
      const properties = Array.isArray(propertiesData) ? propertiesData : [];

      // Calculate commission stats from existing properties
      let totalEarnings = 0;
      let pendingEarnings = 0;
      let totalTransactions = 0;

      properties.forEach((property) => {
        if (property.status === "Sold" || property.status === "Rented") {
          const finalPrice = property.finalPrice || property.price || property.rentPrice || 0;
          const commissionAmount = finalPrice * 0.02 * 2; // Both buyer and seller sides
          totalEarnings += commissionAmount;
          totalTransactions += 1;
        }

        if (property.status === "Ordered" || property.status === "Payment_Pending") {
          const price = property.price || 0;
          const potentialCommission = price * 0.02 * 2; // Both buyer and seller sides
          pendingEarnings += potentialCommission;
          totalTransactions += 1;
        }
      });

      // IMPORTANT: Add commissions from deleted properties by checking payment records
      try {
        const paymentResponse = await axios.get("/api/payments/commission/summary");
        const paymentData = paymentResponse.data.data;

        // If payment-based total earnings is higher, it means there are deleted properties
        // Add the difference to account for deleted properties with completed payments
        const paymentBasedEarnings = paymentData.summary.totalEarnings || 0;
        const paymentBasedPending = paymentData.summary.pendingEarnings || 0;
        const paymentBasedTransactions = paymentData.summary.totalTransactions || 0;

        if (paymentBasedEarnings > totalEarnings) {
          console.log("Found deleted properties with completed payments:", {
            propertyBasedEarnings: totalEarnings,
            paymentBasedEarnings: paymentBasedEarnings,
            deletedPropertyEarnings: paymentBasedEarnings - totalEarnings
          });
          totalEarnings = paymentBasedEarnings; // Use the higher amount (includes deleted)
        }

        if (paymentBasedPending > pendingEarnings) {
          pendingEarnings = paymentBasedPending; // Use the higher amount (includes deleted)
        }

        // For transactions, use the payment-based count if it's higher (includes deleted)
        if (paymentBasedTransactions > totalTransactions * 2) { // *2 because payment counts both sides
          totalTransactions = Math.floor(paymentBasedTransactions / 2); // Convert back to property count
        }

      } catch (paymentError) {
        console.log("Could not fetch payment data for deleted properties check:", paymentError);
        // Continue with property-based calculation only
      }

      setCommissionStats({
        totalEarnings: Math.round(totalEarnings),
        pendingEarnings: Math.round(pendingEarnings),
        totalTransactions: totalTransactions,
      });

    } catch (error) {
      console.error("Error fetching commission data:", error);
      setCommissionStats({
        totalEarnings: 0,
        pendingEarnings: 0,
        totalTransactions: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    // Round to integer to avoid decimals
    const roundedPrice = Math.round(price || 0);
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(roundedPrice);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading Broker Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Broker Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome, {user?.fname}! Manage your portfolio and track commissions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Assigned</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAssigned}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">{stats.availableProperties}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ordered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.orderedProperties}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedProperties}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(commissionStats.totalEarnings)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">💵</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Earnings</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(commissionStats.pendingEarnings)}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{commissionStats.totalTransactions}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          {/* Recent Properties */}
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Recent Properties</h2>
              <Link
                to="/broker/properties"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="p-6">
              {recentProperties.length > 0 ? (
                <div className="space-y-4">
                  {recentProperties.map((property) => (
                    <div key={property._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-lg">
                            {property.propertyType === "Home" ? "🏠" : property.propertyType === "Car" ? "🚗" : "💻"}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{property.title}</h3>
                          <p className="text-sm text-gray-500">{property.propertyType} • {property.purpose}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatPrice(property.price)}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${property.status === "Available" ? "bg-green-100 text-green-800" :
                          property.status === "Ordered" ? "bg-blue-100 text-blue-800" :
                            property.status === "Sold" || property.status === "Rented" ? "bg-purple-100 text-purple-800" :
                              "bg-gray-100 text-gray-800"
                          }`}>
                          {property.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🏠</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No properties assigned</h3>
                  <p className="text-gray-500">Properties will appear here once assigned to you</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/broker/properties"
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Manage Properties</h3>
                <p className="text-sm text-gray-500">View assigned properties</p>
              </div>
            </Link>

            <Link
              to="/broker/commissions"
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Commission Earnings</h3>
                <p className="text-sm text-gray-500">Track your earnings</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerDashboard;