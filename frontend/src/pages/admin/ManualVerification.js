import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

const ManualVerification = () => {
  const { t } = useTranslation();
  const [unverifiedUsers, setUnverifiedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    fetchUnverifiedUsers();
  }, []);

  const fetchUnverifiedUsers = async () => {
    try {
      const response = await axios.get("/api/admin");
      const unverified = response.data.filter((user) => !user.isVerified);
      setUnverifiedUsers(unverified);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage(t("errors.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = async (userId) => {
    if (!window.confirm(t("common.confirmVerify"))) {
      return;
    }

    try {
      await axios.post("/api/admin/verify-manually", {
        userId,
      });
      setMessage(t("success.userVerified"));
      setUnverifiedUsers(unverifiedUsers.filter((user) => user._id !== userId));

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error verifying user:", error);
      setMessage(t("errors.verifyError"));
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">⛔</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {t("common.accessDenied")}
        </h2>
        <p className="text-gray-600">{t("common.adminPrivilegesRequired")}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-2">{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("verification.manualVerification")}
        </h1>
        <span className="text-sm text-gray-600">
          {t("verification.pendingVerifications")}: {unverifiedUsers.length}
        </span>
      </div>

      {message && (
        <div
          className={`p-3 rounded-md ${
            message.includes("successful")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {unverifiedUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("users.user")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("verification.email")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("verification.phone")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("verification.city")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("verification.registered")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("users.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unverifiedUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.fname?.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.fname} {user.lname}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {t(`users.${user.role}`)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.phone || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.city || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleManualVerify(user._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                      >
                        {t("verification.verifyUser")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("verification.allVerified")}
            </h3>
            <p className="text-gray-600">
              {t("verification.allVerifiedDescription")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualVerification;
