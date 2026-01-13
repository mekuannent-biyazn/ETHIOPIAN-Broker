import React, { useState, useEffect } from "react";
import { useCommunication } from "../../hooks/useCommunication";
import axios from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "react-i18next";

const NewChatButton = ({ onUserSelect }) => {
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { sendMessage } = useCommunication();
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("/api/users/available");
      console.log("Available users response:", response.data);
      const availableUsers = response.data.users || [];
      setUsers(availableUsers);

      if (availableUsers.length === 0) {
        setError(t("communication.noUsersAvailable"));
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setError(t("communication.failedToLoadUsers"));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (selectedUser) => {
    try {
      console.log("Starting chat with:", selectedUser);

      // Send an initial message to start the conversation
      const result = await sendMessage({
        receiverId: selectedUser._id,
        content: t("communication.helloMessage"),
        messageType: "text",
      });

      console.log("Message sent successfully:", result);

      // Select the user to open chat
      onUserSelect(selectedUser);
      setShowUserList(false);
    } catch (error) {
      console.error("Failed to start chat:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        t("common.unknownError");
      alert(`${t("communication.failedToStartChat")}: ${errorMessage}`);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "broker":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "client":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleToggleUserList = () => {
    const newState = !showUserList;
    setShowUserList(newState);
    if (newState) {
      fetchUsers();
    }
  };

  const getCommunicationRules = () => {
    if (!currentUser) return [];

    switch (currentUser.role) {
      case "client":
        return [
          t("communication.clientCanMessage1"),
          t("communication.clientCanMessage2"),
        ];
      case "broker":
        return [
          t("communication.brokerCanMessage1"),
          t("communication.brokerCanMessage3"),
          t("communication.brokerCanMessage2"),
        ];
      case "admin":
        return [t("communication.adminCanMessage")];
      default:
        return [];
    }
  };

  return (
    <div className="relative">
      {/* New Chat Button */}
      <button
        onClick={handleToggleUserList}
        className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors w-full justify-center shadow-sm"
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
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <span>{t("communication.newChat")}</span>
      </button>

      {/* User List Dropdown */}
      {showUserList && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-80 overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">
                {t("communication.startNewChat")}
              </h4>
              <button
                onClick={() => setShowUserList(false)}
                className="text-gray-400 hover:text-gray-600"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {t("communication.selectUserToStart")} {t("navigation.role")}:{" "}
              <span className="font-medium capitalize">
                {currentUser?.role}
              </span>
            </p>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm">
                  {t("communication.loadingUsers")}
                </p>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-gray-500">
                <svg
                  className="w-8 h-8 mx-auto text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <p className="text-sm text-gray-600">{error}</p>
                <div className="mt-2 text-xs text-gray-500">
                  <p>
                    {t("communication.communicationRules")} {currentUser?.role}:
                  </p>
                  <ul className="list-disc list-inside mt-1 text-left">
                    {getCommunicationRules().map((rule, index) => (
                      <li key={index}>{rule}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  <p>{t("communication.checkConsole")}</p>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <svg
                  className="w-8 h-8 mx-auto text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
                <p className="font-medium mb-1">
                  {t("communication.noUsersAvailable")}
                </p>
                <p className="text-sm mb-2">{t("communication.basedOnRole")}</p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>
                    {t("navigation.role")}: {currentUser?.role}
                  </p>
                  <p>{t("communication.checkUsersSystem")}</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="p-2 bg-blue-50 border-b border-blue-100">
                  <p className="text-xs text-blue-700">
                    {users.length} {t("communication.user")}
                    {users.length !== 1 ? "s" : ""}{" "}
                    {t("communication.availableForMessaging")}
                  </p>
                </div>
                {users.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleStartChat(user)}
                    className="flex items-center space-x-3 p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.fname?.charAt(0)}
                        {user.lname?.charAt(0)}
                      </div>
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {user.fname} {user.lname}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border capitalize ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {t(`navigation.${user.role}`)}
                        </span>
                        {user.role === "broker" && !user.isApproved && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                            {t("common.pending")}
                          </span>
                        )}
                        {user.isOnline ? (
                          <span className="text-xs text-green-600">
                            {t("communication.online")}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {t("communication.offline")}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-1">
                        {user.email}
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              <p>
                {t("navigation.role")}:{" "}
                <span className="font-medium capitalize">
                  {currentUser?.role}
                </span>
              </p>
              <p>
                {t("communication.totalAvailable")}: {users.length}{" "}
                {t("communication.users")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {showUserList && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowUserList(false)}
        ></div>
      )}
    </div>
  );
};

export default NewChatButton;
