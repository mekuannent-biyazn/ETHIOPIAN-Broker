import React, { useEffect, useState } from "react";
import { useCommunication } from "../../hooks/useCommunication";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "react-i18next";
import NewChatButton from "./NewChatButton";
import UserSearch from "./UserSearch";

const ConversationList = ({ onSelectConversation, selectedUserId }) => {
  const { conversations, loading, loadConversations, socketConnected } =
    useCommunication();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("conversations");
  const [notification, setNotification] = useState(null);

  // Debug prop on component mount
  useEffect(() => {
    console.log("ConversationList props:", {
      onSelectConversation,
      selectedUserId,
      isFunction: typeof onSelectConversation === "function",
    });
  }, [onSelectConversation, selectedUserId]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setError(null);
        await loadConversations();
      } catch (err) {
        setError(t("communication.failedToLoad"));
        console.error("Error loading conversations:", err);
      }
    };

    fetchConversations();
  }, [loadConversations, t]);

  const showNotification = (message, type = "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleUserSelect = (selectedUser) => {
    if (onSelectConversation && typeof onSelectConversation === "function") {
      onSelectConversation(selectedUser);
      setActiveTab("conversations");
    } else {
      console.error("onSelectConversation is not available or not a function");
      console.log("Selected user was:", selectedUser);
      showNotification(t("communication.chatUnavailable"));
    }
  };

  const handleConversationClick = (conversationUser) => {
    if (onSelectConversation && typeof onSelectConversation === "function") {
      onSelectConversation(conversationUser);
    } else {
      console.error("Cannot select conversation - handler not available");
      showNotification(t("communication.unableToOpen"));
    }
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getLastMessagePreview = (lastMessage) => {
    if (!lastMessage) return t("communication.noMessages");

    if (lastMessage.messageType === "image") {
      return "📷 " + t("communication.image");
    } else if (lastMessage.messageType === "document") {
      return "📄 " + t("communication.document");
    } else if (lastMessage.content) {
      return (
        lastMessage.content.substring(0, 60) +
        (lastMessage.content.length > 60 ? "..." : "")
      );
    }

    return t("communication.message");
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

  const getStatusIndicator = (conversationUser) => {
    if (conversationUser?.isOnline) {
      return (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-green-600">
            {t("communication.online")}
          </span>
        </div>
      );
    } else if (conversationUser?.lastSeen) {
      const lastSeen = new Date(conversationUser.lastSeen);
      const now = new Date();
      const diffInHours = (now - lastSeen) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        return (
          <span className="text-xs text-gray-500">
            {t("communication.recently")}
          </span>
        );
      } else if (diffInHours < 24) {
        return (
          <span className="text-xs text-gray-500">
            {Math.floor(diffInHours)}h {t("common.ago")}
          </span>
        );
      } else {
        return (
          <span className="text-xs text-gray-500">
            {Math.floor(diffInHours / 24)}d {t("common.ago")}
          </span>
        );
      }
    }

    return (
      <span className="text-xs text-gray-500">
        {t("communication.offline")}
      </span>
    );
  };

  const getCommunicationHint = () => {
    if (!user) return t("communication.searchUsers");

    switch (user.role) {
      case "client":
        return t("communication.clientHint");
      case "broker":
        return t("communication.brokerHint");
      case "admin":
        return t("communication.adminHint");
      default:
        return t("communication.searchUsers");
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              {t("communication.messages")}
            </h3>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-xs text-gray-500">
                {socketConnected
                  ? t("communication.connected")
                  : t("communication.disconnected")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-gray-500">
              {t("communication.loadingConversations")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            {t("communication.messages")}
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-500 p-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="font-medium mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              {t("communication.retry")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Notification */}
      {notification && (
        <div
          className={`p-3 ${
            notification.type === "error"
              ? "bg-red-100 border-red-200 text-red-800"
              : "bg-blue-100 border-blue-200 text-blue-800"
          } border-b`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="text-sm">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-500 hover:text-gray-700"
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
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            {t("communication.messages")}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {conversations?.length || 0}
            </span>
            <div
              className={`w-2 h-2 rounded-full ${
                socketConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-3">
          <button
            onClick={() => setActiveTab("conversations")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "conversations"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t("communication.conversations")}
          </button>
          <button
            onClick={() => setActiveTab("new-chat")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "new-chat"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t("communication.newChat")}
          </button>
        </div>

        {/* Search Bar - Always Visible */}
        <UserSearch onUserSelect={handleUserSelect} />

        {/* Communication Hint */}
        <div className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded-lg">
          <div className="flex items-center space-x-1">
            <svg
              className="w-3 h-3 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{getCommunicationHint()}</span>
          </div>
        </div>

        {/* New Chat Button */}
        {activeTab === "new-chat" && (
          <div className="mt-3">
            <NewChatButton onUserSelect={handleUserSelect} />
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "conversations" &&
          (!conversations || conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 p-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="font-medium mb-2">
                  {t("communication.noConversations")}
                </p>
                <p className="text-sm mb-4">
                  {t("communication.startConversationHint")}
                </p>
                <button
                  onClick={() => setActiveTab("new-chat")}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                >
                  {t("communication.startNewChat")}
                </button>
                <div className="mt-4 text-xs text-gray-400">
                  <p>
                    {t("communication.socket")}:{" "}
                    {socketConnected
                      ? t("communication.connected")
                      : t("communication.disconnected")}
                  </p>
                  <p>
                    {t("communication.user")}:{" "}
                    {user
                      ? t("communication.loggedIn")
                      : t("communication.notLoggedIn")}
                  </p>
                  <p>
                    {t("navigation.role")}: {user?.role || t("common.unknown")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((conv) => (
                <div
                  key={conv.user?._id || conv._id}
                  className={`p-4 cursor-pointer transition-colors duration-200 ${
                    selectedUserId === conv.user?._id
                      ? "bg-blue-50 border-r-2 border-blue-500"
                      : "hover:bg-gray-50"
                  } ${conv.unreadCount > 0 ? "bg-yellow-50" : ""}`}
                  onClick={() => handleConversationClick(conv.user)}
                >
                  <div className="flex items-start space-x-3">
                    {/* User Avatar */}
                    <div className="flex-shrink-0 relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {conv.user?.fname?.charAt(0)}
                        {conv.user?.lname?.charAt(0)}
                      </div>
                      {conv.user?.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                      )}
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                        </div>
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {conv.user?.fname} {conv.user?.lname}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                              conv.user?.role
                            )}`}
                          >
                            {t(`navigation.${conv.user?.role}`)}
                            {conv.user?.role === "broker" &&
                              !conv.user?.isApproved && (
                                <span className="ml-1 text-xs">
                                  ({t("common.pending")})
                                </span>
                              )}
                          </span>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className="text-xs text-gray-500">
                            {formatLastMessageTime(conv.lastMessage?.createdAt)}
                          </span>
                          {getStatusIndicator(conv.user)}
                        </div>
                      </div>

                      {/* Last Message Preview */}
                      <div className="flex items-center justify-between mb-1">
                        <p
                          className={`text-sm truncate ${
                            conv.unreadCount > 0
                              ? "text-gray-900 font-medium"
                              : "text-gray-600"
                          }`}
                        >
                          {getLastMessagePreview(conv.lastMessage)}
                        </p>
                        {conv.unreadCount > 0 && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          </div>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                            />
                          </svg>
                          <span>
                            {conv.totalMessages || 0}{" "}
                            {t("communication.messages")}
                          </span>
                        </span>
                        {conv.lastMessage?.messageType === "image" && (
                          <span className="flex items-center space-x-1">
                            <span>📷</span>
                            <span>{t("communication.photo")}</span>
                          </span>
                        )}
                        {conv.lastMessage?.messageType === "document" && (
                          <span className="flex items-center space-x-1">
                            <span>📄</span>
                            <span>{t("communication.document")}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

        {/* New Chat Interface */}
        {activeTab === "new-chat" && (
          <div className="p-6">
            <div className="text-center text-gray-500 mb-6">
              <svg
                className="w-16 h-16 mx-auto text-green-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {t("communication.startNewChat")}
              </h3>
              <p className="text-sm mb-4">
                {t("communication.newChatDescription")}
              </p>

              {/* Role-based Communication Guide */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4 text-left">
                <h4 className="font-semibold text-blue-800 mb-2 text-sm">
                  {t("communication.whoYouCanMessage")}
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  {user?.role === "client" && (
                    <>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>{t("communication.clientCanMessage1")}</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>{t("communication.clientCanMessage2")}</span>
                      </li>
                    </>
                  )}
                  {user?.role === "broker" && (
                    <>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{t("communication.brokerCanMessage1")}</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>{t("communication.brokerCanMessage2")}</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>{t("communication.brokerCanMessage3")}</span>
                      </li>
                    </>
                  )}
                  {user?.role === "admin" && (
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{t("communication.adminCanMessage")}</span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="text-xs text-gray-400 space-y-1">
                <p className="flex items-center justify-center space-x-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>{t("communication.searchTip1")}</span>
                </p>
                <p className="flex items-center justify-center space-x-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>{t("communication.searchTip2")}</span>
                </p>
                <p className="flex items-center justify-center space-x-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{t("communication.searchTip3")}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with Connection Status */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                socketConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span>
              {socketConnected
                ? t("communication.connected")
                : t("communication.disconnected")}
            </span>
          </div>
          <div className="text-right">
            <div className="font-medium">
              {user?.fname} {user?.lname}
            </div>
            <div className="capitalize">{t(`navigation.${user?.role}`)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add default props for safety
ConversationList.defaultProps = {
  onSelectConversation: (user) => {
    console.warn("onSelectConversation not provided, selected user:", user);
  },
  selectedUserId: null,
};

export default ConversationList;
