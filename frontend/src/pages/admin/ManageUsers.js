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
  const [selectedImage, setSelectedImage] = useState(null);
  const location = useLocation();

  useEffect(() => {
    fetchUsers();

    const propertyData = localStorage.getItem("selectedPropertyForAssignment");
    if (propertyData) {
      setSelectedProperty(JSON.parse(propertyData));
      localStorage.removeItem("selectedPropertyForAssignment");
    }
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && selectedImage) {
        setSelectedImage(null);
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [selectedImage]);

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
            user._id === userId ? { ...user, role: newRole } : user,
          ),
        );
        setMessage(t("success.roleUpdated"));
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      if (error.response?.data?.message) {
        setMessage(
          `${t("errors.updateError")}: ${error.response.data.message}`,
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
        { brokerId: brokerId },
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

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const action = currentStatus ? "deactivate" : "activate";
    if (
      !window.confirm(
        t(`common.confirm${action.charAt(0).toUpperCase() + action.slice(1)}`),
      )
    ) {
      return;
    }

    try {
      const response = await axios.patch(`/api/admin/${userId}/toggle-status`);
      if (response.data.success) {
        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, isActive: !currentStatus } : user,
          ),
        );
        setMessage(response.data.message);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      if (error.response?.data?.message) {
        setMessage(
          `${t("errors.updateError")}: ${error.response.data.message}`,
        );
      } else {
        setMessage(t("errors.updateError"));
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
                    `properties.propertyTypes.${selectedProperty.propertyType?.toLowerCase()}`,
                  )}{" "}
                  •{" "}
                  {t(
                    `properties.purposes.${selectedProperty.purpose?.toLowerCase()}`,
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
                      {t("users.idPhotos")}
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
                        <div className="flex flex-col space-y-2">
                          {/* ID Front Photo */}
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-600 w-16">
                              ID Front:
                            </span>
                            {user.idPhotoFront ? (
                              <div className="flex items-center space-x-1">
                                <img
                                  src={`http://localhost:9000/${user.idPhotoFront}`}
                                  alt="ID Front"
                                  className="h-8 w-8 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() =>
                                    setSelectedImage({
                                      src: `http://localhost:9000/${user.idPhotoFront}`,
                                      alt: `${user.fname} ${user.lname} - ID Front`,
                                      userName: `${user.fname} ${user.lname}`,
                                      photoType: "ID Front",
                                    })
                                  }
                                  title="Click to view full size"
                                />
                                <button
                                  onClick={() =>
                                    setSelectedImage({
                                      src: `http://localhost:9000/${user.idPhotoFront}`,
                                      alt: `${user.fname} ${user.lname} - ID Front`,
                                      userName: `${user.fname} ${user.lname}`,
                                      photoType: "ID Front",
                                    })
                                  }
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  View
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                No photo
                              </span>
                            )}
                          </div>

                          {/* ID Back Photo */}
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-600 w-16">
                              ID Back:
                            </span>
                            {user.idPhotoBack ? (
                              <div className="flex items-center space-x-1">
                                <img
                                  src={`http://localhost:9000/${user.idPhotoBack}`}
                                  alt="ID Back"
                                  className="h-8 w-8 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() =>
                                    setSelectedImage({
                                      src: `http://localhost:9000/${user.idPhotoBack}`,
                                      alt: `${user.fname} ${user.lname} - ID Back`,
                                      userName: `${user.fname} ${user.lname}`,
                                      photoType: "ID Back",
                                    })
                                  }
                                  title="Click to view full size"
                                />
                                <button
                                  onClick={() =>
                                    setSelectedImage({
                                      src: `http://localhost:9000/${user.idPhotoBack}`,
                                      alt: `${user.fname} ${user.lname} - ID Back`,
                                      userName: `${user.fname} ${user.lname}`,
                                      photoType: "ID Back",
                                    })
                                  }
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  View
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                No photo
                              </span>
                            )}
                          </div>

                          {/* Selfie Photo */}
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-600 w-16">
                              Selfie:
                            </span>
                            {user.selfiePhoto ? (
                              <div className="flex items-center space-x-1">
                                <img
                                  src={`http://localhost:9000/${user.selfiePhoto}`}
                                  alt="Selfie"
                                  className="h-8 w-8 object-cover rounded-full border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() =>
                                    setSelectedImage({
                                      src: `http://localhost:9000/${user.selfiePhoto}`,
                                      alt: `${user.fname} ${user.lname} - Selfie`,
                                      userName: `${user.fname} ${user.lname}`,
                                      photoType: "Selfie",
                                    })
                                  }
                                  title="Click to view full size"
                                />
                                <button
                                  onClick={() =>
                                    setSelectedImage({
                                      src: `http://localhost:9000/${user.selfiePhoto}`,
                                      alt: `${user.fname} ${user.lname} - Selfie`,
                                      userName: `${user.fname} ${user.lname}`,
                                      photoType: "Selfie",
                                    })
                                  }
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  View
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                No photo
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user._id, e.target.value)
                          }
                          className={`text-xs font-medium px-3 py-1 rounded-full border ${getRoleBadgeColor(
                            user.role,
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
                        <div className="flex flex-col space-y-1">
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
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive !== false
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.isActive !== false ? (
                              <>
                                <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                                Active
                              </>
                            ) : (
                              <>
                                <span className="w-2 h-2 bg-red-400 rounded-full mr-1"></span>
                                Inactive
                              </>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() =>
                            handleToggleUserStatus(
                              user._id,
                              user.isActive !== false,
                            )
                          }
                          className={`px-3 py-1 rounded border transition duration-200 ${
                            user.isActive !== false
                              ? "text-red-600 hover:text-red-900 border-red-200 hover:bg-red-50"
                              : "text-green-600 hover:text-green-900 border-green-200 hover:bg-green-50"
                          }`}
                          title={
                            user.isActive !== false
                              ? t("users.deactivate")
                              : t("users.activate")
                          }
                        >
                          {user.isActive !== false
                            ? t("users.deactivate")
                            : t("users.activate")}
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

      {/* ID Photo Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedImage(null);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedImage.userName} -{" "}
                {selectedImage.photoType || t("users.idPhoto")}
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Close (ESC)"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="max-w-full max-h-96 object-contain mx-auto rounded-lg shadow-lg"
              />
            </div>
            <div className="flex justify-end space-x-2 p-4 border-t bg-gray-50">
              <button
                onClick={() => window.open(selectedImage.src, "_blank")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center space-x-2"
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
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                <span>{t("users.openInNewTab")}</span>
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
