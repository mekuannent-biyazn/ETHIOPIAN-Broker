import React, { useState, useEffect, useRef } from "react";
import { useCommunication } from "../../hooks/useCommunication";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "react-i18next";
import Message from "./Message";

const MessageList = ({ userId }) => {
  const { activeConversation, loading, loadConversation } = useCommunication();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [language, setLanguage] = useState(i18n.language || "en");

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setLanguage(lng);
    };
    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

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
    // Implement lazy loading if needed
  };

  if (loading && !activeConversation) {
    return (
      <div className="flex-1 bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">
          {t("communication.loadingMessages")}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-gray-900 flex flex-col overflow-y-auto"
      onScroll={handleScroll}
      dir={language === "am" ? "rtl" : "ltr"}
    >
      {!activeConversation?.messages ||
      activeConversation.messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400 p-6">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-500"
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
            <p className="font-medium mb-2 text-gray-300">
              {t("communication.noMessages")}
            </p>
            <p className="text-sm text-gray-500">
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
