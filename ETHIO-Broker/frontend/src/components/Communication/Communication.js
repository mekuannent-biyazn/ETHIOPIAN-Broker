import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCommunication } from "../../context/CommunicationContext";
import { useTranslation } from "react-i18next";
import ConversationList from "./ConversationList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import UserSearch from "./UserSearch";

const Communication = () => {
  const { userId } = useParams();
  const {
    conversations,
    activeConversation,
    loadConversation,
    loadConversations,
    clearActiveConversation,
  } = useCommunication();
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || "en");

  const [currentUserId, setCurrentUserId] = useState(userId);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserSearch, setShowUserSearch] = useState(false);

  // Listen for language changes
  useEffect(() => {
    i18n.on("languageChanged", (lng) => {
      setCurrentLanguage(lng);
    });
    return () => {
      i18n.off("languageChanged");
    };
  }, [i18n]);

  // Update currentUserId when URL params change
  useEffect(() => {
    if (userId) {
      setCurrentUserId(userId);
      loadConversation(userId);
    } else {
      setCurrentUserId(null);
      clearActiveConversation();
    }
  }, [userId, loadConversation, clearActiveConversation]);

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleSelectConversation = (user) => {
    console.log("Selected conversation with:", user);
    setSelectedUser(user);
    setCurrentUserId(user._id);
    setShowUserSearch(false);

    // Load the conversation in the context
    loadConversation(user._id);

    // Update URL without page reload
    window.history.pushState({}, "", `/communication/${user._id}`);
  };

  const handleUserSelect = (user) => {
    console.log("User selected:", user);
    setSelectedUser(user);
    setCurrentUserId(user._id);

    // Load the conversation in the context
    loadConversation(user._id);

    // Update URL without page reload
    window.history.pushState({}, "", `/communication/${user._id}`);
  };

  const handleNewChat = () => {
    setShowUserSearch(true);
    setSelectedUser(null);
    setCurrentUserId(null);
    clearActiveConversation();
  };

  const handleBackToConversations = () => {
    setShowUserSearch(false);
    setSelectedUser(null);
    setCurrentUserId(null);
    clearActiveConversation();
    window.history.pushState({}, "", `/communication`);
  };

  const toggleLanguage = () => {
    const newLang = currentLanguage === "en" ? "am" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <div
      className="communication-container flex h-screen bg-gray-900"
      dir={currentLanguage === "am" ? "rtl" : "ltr"}
    >
      {/* Sidebar - User List */}
      <div className="sidebar w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header with Language Toggle */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-white">
              {t("communication.messages")}
            </h3>
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 px-2 py-1 border border-gray-600 rounded text-xs text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <span
                className={
                  currentLanguage === "am" ? "font-bold text-white" : ""
                }
              >
                አማ
              </span>
              <span>/</span>
              <span
                className={
                  currentLanguage === "en" ? "font-bold text-white" : ""
                }
              >
                EN
              </span>
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder={t("communication.searchUsers")}
              className="w-full bg-gray-700 text-white placeholder-gray-400 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute right-3 top-2.5 w-4 h-4 text-gray-400"
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
          </div>
        </div>

        {/* User Search */}
        {showUserSearch && (
          <div className="p-4 border-b border-gray-700">
            <UserSearch onUserSelect={handleUserSelect} />
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {!conversations || conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
              <svg
                className="w-16 h-16 mb-4 text-gray-600"
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
              <p className="text-center text-sm">
                {t("communication.noConversations")}
              </p>
              <button
                onClick={handleNewChat}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {t("communication.startNewChat")}
              </button>
            </div>
          ) : (
            <div>
              {conversations.map((conv) => (
                <div
                  key={conv.user?._id || conv._id}
                  className={`p-4 cursor-pointer hover:bg-gray-700 transition-colors border-b border-gray-700 ${
                    currentUserId === conv.user?._id ? "bg-gray-700" : ""
                  }`}
                  onClick={() => handleUserSelect(conv.user)}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {conv.user?.fname?.charAt(0)}
                        {conv.user?.lname?.charAt(0)}
                      </div>
                      {/* Online Status */}
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-gray-800 rounded-full ${
                          conv.user?.isOnline ? "bg-green-500" : "bg-gray-500"
                        }`}
                      ></div>
                    </div>

                    {/* User Info */}
                    <div
                      className={`flex-1 min-w-0 ${currentLanguage === "am" ? "text-right" : "text-left"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium truncate">
                          {conv.user?.fname} {conv.user?.lname}
                        </span>
                        <span className="text-xs text-gray-400">
                          12/11/2025
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-400 truncate">
                          {conv.user?.role === "admin"
                            ? "👑 " + t("navigation.admin")
                            : conv.user?.role === "broker"
                              ? "🏢 " + t("navigation.broker")
                              : "👤 " + t("navigation.client")}
                        </p>
                        {conv.user?.isOnline && (
                          <span className="text-xs text-green-400">
                            {t("communication.online")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>{t("communication.newChat")}</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main flex-1 flex flex-col bg-gray-900">
        {currentUserId ? (
          <>
            {/* Chat Header */}
            <div className="chat-header bg-gray-800 border-b border-gray-700 p-4">
              <div className="flex items-center space-x-3">
                <button
                  className="lg:hidden text-gray-400 hover:text-white"
                  onClick={() => {
                    setCurrentUserId(null);
                    setSelectedUser(null);
                    clearActiveConversation();
                    window.history.pushState({}, "", `/communication`);
                  }}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>

                {selectedUser && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {selectedUser.fname?.charAt(0)}
                      {selectedUser.lname?.charAt(0)}
                    </div>
                    <div
                      className={
                        currentLanguage === "am" ? "text-right" : "text-left"
                      }
                    >
                      <h4 className="text-white font-semibold">
                        {selectedUser.fname} {selectedUser.lname}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {selectedUser.isOnline
                          ? t("communication.online")
                          : t("communication.recently")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <MessageList currentUserId={currentUserId} />
            <MessageInput currentUserId={currentUserId} />
          </>
        ) : showUserSearch ? (
          <div className="flex-1 flex flex-col">
            {/* Search Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <div className="flex items-center space-x-3">
                <button
                  className="text-gray-400 hover:text-white"
                  onClick={handleBackToConversations}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
                <h4 className="text-white font-semibold">
                  {t("communication.newMessage")}
                </h4>
              </div>
            </div>

            {/* User Search */}
            <div className="flex-1 p-6 bg-gray-900">
              <UserSearch onUserSelect={handleUserSelect} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div
              className={`text-center text-gray-400 max-w-md ${currentLanguage === "am" ? "text-right" : "text-left"}`}
            >
              <svg
                className="w-20 h-20 mx-auto mb-4 text-gray-600"
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
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                {t("communication.selectConversation")}
              </h3>
              <p className="text-gray-500">
                {t("communication.whoYouCanMessage")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Communication;
