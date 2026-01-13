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
    activeConversation,
    loadConversation,
    loadConversations,
    clearActiveConversation,
  } = useCommunication();
  const { t } = useTranslation();

  const [currentUserId, setCurrentUserId] = useState(userId);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserSearch, setShowUserSearch] = useState(false);

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
    console.log("User selected from search:", user);
    setSelectedUser(user);
    setCurrentUserId(user._id);
    setShowUserSearch(false);

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

  return (
    <div className="communication-container flex h-screen bg-gray-50">
      {/* Conversation Sidebar */}
      <div className="conversation-sidebar w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <ConversationList
          onSelectConversation={handleSelectConversation}
          selectedUserId={selectedUser?._id || currentUserId}
        />
      </div>

      {/* Main Chat Area */}
      <div className="chat-main flex-1 flex flex-col">
        {showUserSearch ? (
          <div className="user-search-container flex-1 flex flex-col">
            {/* Search Header */}
            <div className="search-header bg-white border-b border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <button
                  className="back-btn flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors"
                  onClick={handleBackToConversations}
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
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  <span>{t("communication.back")}</span>
                </button>
                <h4 className="text-lg font-semibold text-gray-800">
                  {t("communication.newMessage")}
                </h4>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {t("communication.searchForUsers")}
              </p>
            </div>

            {/* User Search Component */}
            <div className="flex-1 p-4 bg-gray-50">
              <div className="max-w-2xl mx-auto">
                <UserSearch onUserSelect={handleUserSelect} />

                {/* Additional Help Text */}
                <div className="mt-6 text-center text-gray-500">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <svg
                      className="w-12 h-12 mx-auto text-blue-400 mb-3"
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
                    <h5 className="font-semibold text-gray-700 mb-2">
                      {t("communication.findUsers")}
                    </h5>
                    <p className="text-sm mb-3">
                      {t("communication.searchHint")}
                    </p>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>• {t("communication.searchTip1")}</p>
                      <p>• {t("communication.searchTip2")}</p>
                      <p>• {t("communication.searchTip3")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : currentUserId ? (
          <>
            <MessageList currentUserId={currentUserId} />
            <MessageInput currentUserId={currentUserId} />
          </>
        ) : (
          <div className="no-conversation-selected flex-1 flex items-center justify-center bg-gray-50">
            <div className="welcome-message text-center max-w-md mx-auto p-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
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
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {t("communication.welcomeToMessages")}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t("communication.selectConversation")}
                </p>
                <button
                  className="start-chat-btn bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
                  onClick={handleNewChat}
                >
                  {t("communication.startNewChat")}
                </button>

                {/* Quick Tips */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {t("communication.quickTips")}
                  </h4>
                  <div className="grid grid-cols-1 gap-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{t("communication.tip1")}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{t("communication.tip2")}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>{t("communication.tip3")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Communication;
