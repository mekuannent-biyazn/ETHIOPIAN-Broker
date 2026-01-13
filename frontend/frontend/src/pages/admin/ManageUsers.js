import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

const ManageUsers = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [assigningBroker, setAssigningBroker] = useState(null);
  const location = useLocation();

  useEffect(() => {
    fetchUsers();

    const propertyData = localStorage.getItem("selectedPropertyForAssignment");
    if (propertyData) {
      setSelectedProperty(JSON.parse(propertyData));
      localStorage.removeItem("selectedPropertyForAssignment");
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/admin");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage(t("errors.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      console.log("Changing role for user:", userId, "to:", newRole);

      const response = await axios.patch(`/api/admin/${userId}/role`, {
        role: newRole,
      });

      if (response.data.success) {
        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, role: newRole } : user
          )
        );
        setMessage(t("success.roleUpdated"));
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      if (error.response?.data?.message) {
        setMessage(
          `${t("errors.updateError")}: ${error.response.data.message}`
        );
      } else if (error.code === "NETWORK_ERROR") {
        setMessage(t("errors.networkError"));
      } else {
        setMessage(t("errors.updateError"));
      }
      fetchUsers();
    }
  };

  const handleAssignBroker = async (brokerId) => {
    if (!selectedProperty) {
      setMessage(t("errors.noPropertySelected"));
      return;
    }

    setAssigningBroker(brokerId);

    try {
      const response = await axios.patch(
        `/api/property/${selectedProperty._id}/assign-broker`,
        { brokerId: brokerId }
      );

      if (response.data.message === "Broker assigned successfully") {
        setMessage(t("success.brokerAssigned"));
        setSelectedProperty(null);
        setAssigningBroker(null);

        localStorage.removeItem("selectedPropertyForAssignment");

        setTimeout(() => setMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error assigning broker:", error);
      const errorMessage =
        error.response?.data?.message || t("errors.updateError");
      setMessage(errorMessage);
      setAssigningBroker(null);
    }
  };

  const handleRemoveAssignment = () => {
    setSelectedProperty(null);
    localStorage.removeItem("selectedPropertyForAssignment");
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(t("common.confirmDelete"))) {
      return;
    }

    try {
      await axios.delete(`/api/admin/${userId}`);
      setUsers(users.filter((user) => user._id !== userId));
      setMessage(t("success.userDeleted"));
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting user:", error);
      if (error.response?.data?.message) {
        setMessage(
          `${t("errors.deleteError")}: ${error.response.data.message}`
        );
      } else {
        setMessage(t("errors.deleteError"));
      }
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "broker":
        return "bg-green-100 text-green-800 border-green-200";
      case "client":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "admin":
        return t("users.admin");
      case "broker":
        return t("users.broker");
      case "client":
        return t("users.client");
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-2">{t("common.loading")}</span>
      </div>
    );
  }

  const brokers = users.filter((user) => user.role === "broker");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("users.manageUsers")}
          </h1>
          <p className="text-gray-600 text-sm">
            {t("users.manageDescription")}
          </p>
        </div>
        <span className="text-sm text-gray-600">
          {t("users.totalUsers")}: {users.length} • {t("users.brokers")}:{" "}
          {brokers.length}
        </span>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.includes("successful") ||
            message.includes("updated") ||
            message.includes("deleted") ||
            message.includes("assigned")
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-100 text-red-700 border border-red-200"
          }`}
        >
          <div className="flex justify-between items-center">
            <span>{message}</span>
            <button
              onClick={() => setMessage("")}
              className="text-sm hover:opacity-70"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Property Assignment Banner */}
      {selectedProperty && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <span className="text-blue-600 text-lg mr-2">🏠</span>
                <h3 className="font-semibold text-blue-900">
                  {t("users.assigningBroker")}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">
                    {t("properties.propertyDetails")}:
                  </span>{" "}
                  {selectedProperty.title}
                </div>
                <div>
                  <span className="font-medium">
                    {t("dashboard.propertyType")}:
                  </span>{" "}
                  {t(
                    `properties.propertyTypes.${selectedProperty.propertyType?.toLowerCase()}`
                  )}{" "}
                  •{" "}
                  {t(
                    `properties.purposes.${selectedProperty.purpose?.toLowerCase()}`
                  )}
                </div>
                <div>
                  <span className="font-medium">{t("properties.price")}:</span>{" "}
                  {new Intl.NumberFormat("en-ET", {
                    style: "currency",
                    currency: "ETB",
                  }).format(selectedProperty.price)}
                </div>
                <div>
                  <span className="font-medium">
                    {t("properties.ownerInfo")}:
                  </span>{" "}
                  {selectedProperty.owner?.fname}{" "}
                  {selectedProperty.owner?.lname}
                </div>
              </div>
              <p className="text-blue-600 text-xs mt-2">
                {t("properties.navigateToUsers")}
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <Link
                to="/admin/properties"
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300 text-sm font-medium"
              >
                {t("users.backToProperties")}
              </Link>
              <button
                onClick={handleRemoveAssignment}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300 text-sm font-medium"
              >
                {t("properties.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Brokers Section */}
      {selectedProperty && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-green-50 px-6 py-4 border-b border-green-200">
            <h2 className="text-lg font-semibold text-green-900 flex items-center">
              <span className="mr-2">👥</span>
              {t("users.availableBrokers")} ({brokers.length})
            </h2>
            <p className="text-green-700 text-sm">
              {t("users.assignToProperty")} "{selectedProperty.title}"
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("users.broker")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("users.contact")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("users.location")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("users.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("users.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {brokers.map((broker) => (
                  <tr
                    key={broker._id}
                    className="hover:bg-green-50 transition duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                          {broker.fname?.charAt(0)}
                          {broker.lname?.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {broker.fname} {broker.lname}
                          </div>
                          <div className="text-xs text-gray-500">
                            {t("users.broker")} ID: {broker._id.substring(0, 8)}
                            ...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {broker.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {broker.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {broker.city || t("common.unknown")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          broker.isVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {broker.isVerified ? (
                          <>
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                            {t("users.verified")}
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
                            {t("users.pending")}
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleAssignBroker(broker._id)}
                        disabled={assigningBroker === broker._id}
                        className={`px-4 py-2 rounded-lg transition duration-300 font-medium flex items-center ${
                          assigningBroker === broker._id
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {assigningBroker === broker._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {t("users.assigning")}
                          </>
                        ) : (
                          <>
                            <span className="mr-2">✅</span>
                            {t("users.assignToProperty")}
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {brokers.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("users.noBrokersAvailable")}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t("users.noBrokersDescription")}
                </p>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
                >
                  {t("users.backToProperties")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Users Table (shown when no property is selected) */}
      {!selectedProperty && (
        <>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("users.user")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("users.contact")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("users.location")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("users.role")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("users.status")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("users.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                            {user.fname?.charAt(0)}
                            {user.lname?.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.fname} {user.lname}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {user._id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.city || t("common.unknown")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user._id, e.target.value)
                          }
                          className={`text-xs font-medium px-3 py-1 rounded-full border ${getRoleBadgeColor(
                            user.role
                          )} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200`}
                        >
                          {["client", "broker", "admin"].map((role) => (
                            <option key={role} value={role}>
                              {getRoleDisplayName(role)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isVerified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {user.isVerified ? (
                            <>
                              <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                              {t("users.verified")}
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
                              {t("users.pending")}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-900 px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition duration-200"
                          title={t("users.delete")}
                        >
                          {t("users.delete")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("users.noUsersFound")}
                </h3>
                <p className="text-gray-600">{t("users.noUsersDescription")}</p>
              </div>
            )}
          </div>

          {/* Users Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {users.length}
              </div>
              <div className="text-sm text-gray-600">
                {t("users.totalUsers")}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="text-2xl font-bold text-green-600">
                {users.filter((u) => u.role === "broker").length}
              </div>
              <div className="text-sm text-gray-600">{t("users.brokers")}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {users.filter((u) => u.role === "client").length}
              </div>
              <div className="text-sm text-gray-600">{t("users.clients")}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="text-2xl font-bold text-red-600">
                {users.filter((u) => u.role === "admin").length}
              </div>
              <div className="text-sm text-gray-600">{t("users.admins")}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManageUsers;
