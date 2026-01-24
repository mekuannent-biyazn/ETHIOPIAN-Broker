import React, { useState, useEffect } from "react";
import axios from "../../api/axios";

const ManageProperties = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [brokers, setBrokers] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchProperties();
    fetchBrokers();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, statusFilter]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/property/admin/all-properties");
      const propertiesData = response.data.success
        ? response.data.data.properties || []
        : [];

      setProperties(propertiesData);
    } catch (error) {
      console.error("Error fetching properties:", error);
      setMessage({
        type: "error",
        text: "Failed to load properties. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBrokers = async () => {
    try {
      const response = await axios.get("/api/users/brokers");

      if (response.data.success && response.data.brokers) {
        setBrokers(response.data.brokers);
      } else {
        setBrokers([]);
      }
    } catch (error) {
      console.error("Error fetching brokers:", error);

      let errorMessage = "Failed to load brokers. Please try again.";

      if (error.response?.status === 403) {
        errorMessage = "Admin access required to view brokers.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please login again.";
      }

      setMessage({
        type: "error",
        text: errorMessage
      });
      setBrokers([]);
    }
  };

  const filterProperties = () => {
    let filtered = properties;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(property =>
        property.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Filter by search term (property name)
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProperties(filtered);
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm("Are you sure you want to delete this property?")) {
      return;
    }

    try {
      await axios.delete(`/api/property/${propertyId}`);
      setMessage({
        type: "success",
        text: "Property deleted successfully!"
      });
      fetchProperties();
    } catch (error) {
      console.error("Error deleting property:", error);
      setMessage({
        type: "error",
        text: "Failed to delete property. Please try again."
      });
    }
  };

  const handleChangeBroker = (property) => {
    setSelectedProperty(property);
    setShowConfirmDialog(true);
  };

  const confirmChangeBroker = () => {
    setShowConfirmDialog(false);
    setShowBrokerModal(true);
  };

  const cancelChangeBroker = () => {
    setShowConfirmDialog(false);
    setSelectedProperty(null);
  };

  const handleAssignBroker = async (brokerId) => {
    if (!selectedProperty) return;

    try {
      await axios.patch(`/api/property/${selectedProperty._id}/assign-broker`, {
        brokerId: brokerId
      });

      setMessage({
        type: "success",
        text: "Broker assigned successfully!"
      });

      setShowBrokerModal(false);
      setSelectedProperty(null);
      fetchProperties();
    } catch (error) {
      console.error("Error assigning broker:", error);
      setMessage({
        type: "error",
        text: "Failed to assign broker. Please try again."
      });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Available: { bg: "bg-green-100", text: "text-green-800", icon: "✅" },
      Pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: "⏳" },
      Ordered: { bg: "bg-blue-100", text: "text-blue-800", icon: "💰" },
      Sold: { bg: "bg-purple-100", text: "text-purple-800", icon: "� " },
      Rented: { bg: "bg-indigo-100", text: "text-indigo-800", icon: "🏘️" }
    };

    const config = statusConfig[status] || { bg: "bg-gray-100", text: "text-gray-800", icon: "📄" };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <span className="mr-1">{config.icon}</span>
        {status}
      </span>
    );
  };

  const getStatusCount = (status) => {
    if (status === "all") return properties.length;
    return properties.filter(p => p.status.toLowerCase() === status.toLowerCase()).length;
  };

  const canDelete = (status) => {
    return ["Available", "Sold", "Rented"].includes(status);
  };

  const canChangeBroker = (status) => {
    return status === "Available";
  };

  const canApprove = (status) => {
    return status === "Pending";
  };

  const handleApproveProperty = async (propertyId) => {
    if (!window.confirm("Are you sure you want to approve this property? A broker will be automatically assigned.")) {
      return;
    }

    try {
      const response = await axios.patch(`/api/property/${propertyId}/approve`);

      setMessage({
        type: "success",
        text: response.data.message || "Property approved successfully!"
      });

      fetchProperties();
    } catch (error) {
      console.error("Error approving property:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to approve property. Please try again."
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Properties</h1>
          <p className="text-gray-600">Browse and manage all properties in the system</p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${message.type === "success"
            ? "bg-green-50 border-green-400 text-green-700"
            : "bg-red-50 border-red-400 text-red-700"
            }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{message.text}</span>
              <button
                onClick={() => setMessage("")}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Property Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter property name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status ({getStatusCount("all")})</option>
                <option value="pending">Pending ({getStatusCount("pending")})</option>
                <option value="available">Available ({getStatusCount("available")})</option>
                <option value="ordered">Ordered ({getStatusCount("ordered")})</option>
                <option value="sold">Sold ({getStatusCount("sold")})</option>
                <option value="rented">Rented ({getStatusCount("rented")})</option>
              </select>
            </div>


          </div>
        </div>

        {/* Properties Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Properties ({filteredProperties.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Broker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProperties.map((property) => (
                  <tr key={property._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 flex-shrink-0">
                          {property.images && property.images.length > 0 ? (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-lg">
                                {property.propertyType === "Home" ? "🏠" :
                                  property.propertyType === "Car" ? "🚗" : "💻"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {property.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {property.city}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {property.propertyType}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatPrice(property.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(property.status)}
                    </td>
                    <td className="px-6 py-4">
                      {property.assignedBroker ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {property.assignedBroker.fname} {property.assignedBroker.lname}
                          </div>
                          <div className="text-sm text-gray-500">
                            {property.assignedBroker.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          No broker assigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {/* Approve - Only for Pending properties */}
                        {canApprove(property.status) && (
                          <button
                            onClick={() => handleApproveProperty(property._id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition duration-200 flex items-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Approve</span>
                          </button>
                        )}

                        {/* Change Broker - Only for Available properties */}
                        {canChangeBroker(property.status) && (
                          <button
                            onClick={() => handleChangeBroker(property)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition duration-200"
                          >
                            Change Broker
                          </button>
                        )}

                        {/* Delete - For Available, Sold, Rented properties */}
                        {canDelete(property.status) && (
                          <button
                            onClick={() => handleDeleteProperty(property._id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition duration-200"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProperties.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-300 text-6xl mb-4">🏠</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Properties Found
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "No properties have been added to the system yet."
                }
              </p>
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && selectedProperty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Change Broker Confirmation
              </h3>

              <p className="text-gray-600 mb-6">
                Are you sure you want to change the broker for "{selectedProperty.title}"?
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelChangeBroker}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmChangeBroker}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Yes, Change Broker
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Broker Assignment Modal */}
        {showBrokerModal && selectedProperty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select New Broker for "{selectedProperty.title}"
              </h3>

              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {brokers.length > 0 ? (
                  brokers.map((broker) => (
                    <button
                      key={broker._id}
                      onClick={() => handleAssignBroker(broker._id)}
                      className={`w-full text-left p-3 rounded-lg border transition duration-200 ${selectedProperty.assignedBroker?._id === broker._id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      <div className="font-medium text-gray-900">
                        {broker.fname} {broker.lname}
                        {selectedProperty.assignedBroker?._id === broker._id && (
                          <span className="ml-2 text-sm text-blue-600">(Current)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {broker.email}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-300 text-4xl mb-3">👥</div>
                    <h4 className="text-lg font-medium text-gray-600 mb-2">No Brokers Available</h4>
                    <p className="text-sm text-gray-500">
                      There are no brokers registered in the system yet.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowBrokerModal(false);
                    setSelectedProperty(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageProperties;