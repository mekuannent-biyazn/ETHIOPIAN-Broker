import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../../api/axios";

const BrokerCommissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
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

        // Create a single commission record showing both sides
        commissions.push({
          _id: `${property._id}_combined`,
          property: property,
          buyerCommission: commissionAmount,
          sellerCommission: commissionAmount,
          totalCommission: commissionAmount * 2,
          paymentStatus: "Completed",
          paymentDate: property.updatedAt || property.createdAt,
          metadata: {
            role: "both_sides",
            assignmentType: "admin_assigned",
            source: "property_sale",
          },
          owner: property.owner || {
            fname: "Property",
            lname: "Owner",
          },
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
          buyerCommission: potentialCommission,
          sellerCommission: potentialCommission,
          totalCommission: potentialCommission * 2,
          paymentStatus: "Pending",
          paymentDate: null,
          metadata: {
            role: "both_sides",
            assignmentType: "admin_assigned",
            source: "property_sale",
          },
          owner: property.owner || {
            fname: "Pending",
            lname: "Transaction",
          },
          title: property.title,
          createdAt: property.createdAt,
        });
      }
    });

    return commissions;
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return "ETB 0";
    // Round to integer to avoid decimals
    const roundedPrice = Math.round(price);
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(roundedPrice);
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
        {config.icon} {status}
      </span>
    );
  };

  const getPropertyTitle = (commission) => {
    const title = commission.property?.title ||
      commission.title ||
      commission.metadata?.propertyTitle ||
      "Unknown Property";

    // Add indicator for deleted properties
    if (commission.metadata?.isDeleted) {
      return `${title} (Deleted)`;
    }

    return title;
  };

  const getCommissionBreakdown = (commission) => {
    const isRental = commission.property?.purpose === "Rent";
    const buyerLabel = isRental ? "Renter" : "Buyer";
    const sellerLabel = isRental ? "Owner" : "Seller";

    return {
      buyerLabel,
      sellerLabel,
      breakdown: `${buyerLabel}: ${formatPrice(commission.buyerCommission)} + ${sellerLabel}: ${formatPrice(commission.sellerCommission)}`
    };
  };

  const filteredCommissions = commissions.filter((commission) => {
    if (
      filters.status !== "all" &&
      commission.paymentStatus !== filters.status
    ) {
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
                Commission History
              </h1>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/broker/dashboard"
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 flex items-center space-x-2"
              >
                <span>←</span>
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              >
                <option value="all">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() =>
                  setFilters({ status: "all" })
                }
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-semibold transition duration-200"
              >
                Reset Filters
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
                Loading commissions...
              </span>
            </div>
          ) : filteredCommissions.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission (Both Side)
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCommissions.map((commission) => {
                      const commissionBreakdown = getCommissionBreakdown(commission);
                      return (
                        <tr
                          key={commission._id}
                          className="hover:bg-gray-50 transition duration-150"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {getPropertyTitle(commission)}
                              </div>
                              <div className="text-xs text-gray-400 capitalize">
                                {commission.property?.propertyType || "N/A"} •{" "}
                                {commission.property?.purpose || "N/A"}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {commission.owner?.fname} {commission.owner?.lname}
                            </div>
                            <div className="text-xs text-gray-500">
                              {commission.owner?.email || "No email"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-green-600">
                              {formatPrice(commission.totalCommission)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {commissionBreakdown.breakdown}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(commission.paymentStatus)}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium space-x-3">
                            {commission.property?._id && (
                              <Link
                                to={`/property/${commission.property._id}`}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                View Property
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">💰</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Commissions Found
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {commissions.length === 0
                  ? "You don't have any commission records yet. Commissions will appear here when properties you're assigned to are sold or rented."
                  : "No commissions found matching your current filters. Try adjusting your search criteria."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrokerCommissions;