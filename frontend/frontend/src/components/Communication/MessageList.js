import React, { useEffect, useRef } from "react";
import { useCommunication } from "../../hooks/useCommunication";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "react-i18next";
import Message from "./Message";

const MessageList = ({ userId }) => {
  const { activeConversation, loading, loadConversation } = useCommunication();
  const { user } = useAuth();
  const { t } = useTranslation();
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (userId) {
      loadConversation(userId);
    }
  }, [userId, loadConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    // Implement infinite scroll if needed
    // const container = containerRef.current;
    // if (container.scrollTop === 0 && activeConversation?.hasMore) {
    //   loadConversation(userId, activeConversation.page + 1);
    // }
  };

  if (loading && !activeConversation) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">
          {t("communication.loadingMessages")}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-gray-50 flex flex-col overflow-y-auto"
      onScroll={handleScroll}
    >
      {!activeConversation?.messages ||
      activeConversation.messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
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
            <p className="font-medium mb-2">{t("communication.noMessages")}</p>
            <p className="text-sm">
              {t("communication.startConversationHint")}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-4 space-y-4">
          {activeConversation.messages.map((message) => (
            <Message key={message._id} message={message} currentUser={user} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default MessageList;
