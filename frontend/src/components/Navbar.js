import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCommunication } from "../context/CommunicationContext";
import { useNotificationSystem } from "../context/NotificationSystemContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount, conversations, loadConversations, loadUnreadCount } =
    useCommunication();
  const {
    notifications,
    unreadCount: notificationCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getTimeAgo,
    loading: notificationsLoading,
  } = useNotificationSystem();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || "en");

  const messagesRef = useRef(null);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setLanguage(lng);
    };
    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (messagesRef.current && !messagesRef.current.contains(event.target)) {
        setShowMessages(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load conversations when messages dropdown is opened
  useEffect(() => {
    if (showMessages && isAuthenticated) {
      loadConversations();
      loadUnreadCount();
    }
  }, [showMessages, isAuthenticated, loadConversations, loadUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "admin":
        return "/admin";
      case "broker":
        return "/broker/dashboard";
      case "client":
        return "/client";
      default:
        return "/";
    }
  };

  const getCommunicationLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "admin":
        return "/admin/communication";
      case "broker":
        return "/broker/communication";
      case "client":
        return "/client/communication";
      default:
        return "/communication";
    }
  };

  const toggleMessages = () => {
    setShowMessages(!showMessages);
    setShowNotifications(false);
    setShowUserMenu(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowMessages(false);
    setShowUserMenu(false);
  };

  const handleNotificationClick = (notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Navigate to the action URL if provided
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }

    // Close dropdown
    setShowNotifications(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleDeleteNotification = (e, notificationId) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    setShowMessages(false);
    setShowNotifications(false);
  };

  const handleMessageClick = (conversation) => {
    setShowMessages(false);
    if (conversation?.user?._id) {
      navigate(`${getCommunicationLink()}/${conversation.user._id}`);
    }
  };

  const handleViewAllMessages = () => {
    setShowMessages(false);
    navigate(getCommunicationLink());
  };

  // Safe user name display
  const getUserDisplayName = () => {
    if (!user) return t("common.user");

    // Try multiple possible field names
    const firstName = user.fname || user.firstName || user.first_name || "";
    const lastName = user.lname || user.lastName || user.last_name || "";
    const fullName = user.name || user.fullName || user.full_name || "";

    // If we have both first and last name
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }

    // If we have a full name field
    if (fullName) {
      return fullName;
    }

    // If we only have first name
    if (firstName) {
      return firstName;
    }

    // If we only have last name
    if (lastName) {
      return lastName;
    }

    // Fallback to email username
    if (user.email) {
      return user.email.split("@")[0];
    }

    return t("common.user");
  };

  // Safe conversation user display
  const getConversationUserName = (conversation) => {
    if (!conversation?.user) return t("common.unknown");
    const { user } = conversation;
    return (
      `${user.fname || ""} ${user.lname || ""}`.trim() || t("common.unknown")
    );
  };

  // Safe conversation user initials
  const getConversationUserInitials = (conversation) => {
    if (!conversation?.user) return "UU";
    const { user } = conversation;
    const firstInitial = user.fname ? user.fname.charAt(0) : "U";
    const lastInitial = user.lname ? user.lname.charAt(0) : "U";
    return `${firstInitial}${lastInitial}`;
  };

  // Get user avatar initials
  const getUserInitials = () => {
    if (!user) return "U";

    // Try multiple possible field names for first and last name
    const firstName = user.fname || user.firstName || user.first_name || "";
    const lastName = user.lname || user.lastName || user.last_name || "";
    const fullName = user.name || user.fullName || user.full_name || "";

    // If we have both first and last name
    if (firstName && lastName) {
      return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
    }

    // If we have a full name field, try to split it
    if (fullName) {
      const nameParts = fullName
        .trim()
        .split(" ")
        .filter((part) => part.length > 0);
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0).toUpperCase()}${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}`;
      }
      if (nameParts.length === 1) {
        return nameParts[0].charAt(0).toUpperCase();
      }
    }

    // If we only have first name, try to split it
    if (firstName) {
      const nameParts = firstName
        .trim()
        .split(" ")
        .filter((part) => part.length > 0);
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0).toUpperCase()}${nameParts[1].charAt(0).toUpperCase()}`;
      }
      return firstName.charAt(0).toUpperCase();
    }

    // If we only have last name
    if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }

    // Try email as fallback
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }

    return "U";
  };

  return (
    <nav
      className="facebook-navbar bg-white shadow-md sticky top-0 z-50 border-b border-gray-200"
      dir={language === "am" ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          {/* Left Section - Logo */}
          <div className="flex items-center space-x-4 flex-1">
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/m4s-icon.png"
                alt="M4S Brokerage"
                className="w-10 h-10 object-contain"
              />
              <span className="font-bold text-xl text-gray-800 hidden sm:block">
                {t("navbar.companyName")}
              </span>
            </Link>
          </div>

          {/* Center Section - Navigation Icons (Facebook Style) */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex space-x-2">
              <Link
                to="/"
                className="flex items-center justify-center w-12 h-12 rounded-lg hover:bg-gray-100 transition duration-200 group"
                title={t("navigation.home")}
              >
                <svg
                  className="w-6 h-6 text-gray-600 group-hover:text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </Link>

              <Link
                to="/properties"
                className="flex items-center justify-center w-12 h-12 rounded-lg hover:bg-gray-100 transition duration-200 group"
                title={t("navigation.properties")}
              >
                <svg
                  className="w-6 h-6 text-gray-600 group-hover:text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </Link>

              {isAuthenticated && (
                <Link
                  to={getDashboardLink()}
                  className="flex items-center justify-center w-12 h-12 rounded-lg hover:bg-gray-100 transition duration-200 group"
                  title={t("navigation.dashboard")}
                >
                  <svg
                    className="w-6 h-6 text-gray-600 group-hover:text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </Link>
              )}
            </div>
          </div>

          {/* Right Section - User Actions */}
          <div className="flex items-center justify-end space-x-2 flex-1">
            <LanguageSwitcher />

            {isAuthenticated ? (
              <>
                {/* Messages */}
                <div className="relative" ref={messagesRef}>
                  <button
                    onClick={toggleMessages}
                    className="relative flex items-center justify-center w-10 h-10 bg-white hover:bg-gray-100 rounded-full transition duration-200 border border-gray-200"
                    title={t("communication.messages")}
                  >
                    <svg
                      className="w-5 h-5 text-black"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 15.5l-3.5-3.5 6.5-3.5-3.5 6.5 3.5-3.5-6.5 3.5z" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {showMessages && (
                    <div
                      className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                      dir={language === "am" ? "rtl" : "ltr"}
                    >
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-bold text-gray-900 text-lg">
                          {t("communication.messages")}
                        </h3>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {!conversations || conversations.length === 0 ? (
                          <div className="p-6 text-center text-gray-500">
                            <svg
                              className="w-12 h-12 mx-auto mb-3 text-gray-300"
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
                            <p className="text-sm">
                              {t("communication.noMessages")}
                            </p>
                          </div>
                        ) : (
                          conversations.slice(0, 5).map((conversation) => (
                            <div
                              key={conversation.user._id}
                              onClick={() => handleMessageClick(conversation)}
                              className="p-4 hover:bg-gray-50 cursor-pointer transition duration-150 border-b border-gray-100 last:border-b-0"
                              style={
                                language === "am" ? { textAlign: "right" } : {}
                              }
                            >
                              <div
                                className="flex items-center space-x-3"
                                style={
                                  language === "am"
                                    ? { flexDirection: "row-reverse" }
                                    : {}
                                }
                              >
                                <div className="relative">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    {getConversationUserInitials(conversation)}
                                  </div>
                                  {/* Show accurate online/offline status */}
                                  <div
                                    className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
                                      conversation.user?.isOnline
                                        ? "bg-green-500"
                                        : "bg-gray-400"
                                    }`}
                                  ></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div
                                    className="flex justify-between items-start"
                                    style={
                                      language === "am"
                                        ? { flexDirection: "row-reverse" }
                                        : {}
                                    }
                                  >
                                    <p className="font-semibold text-gray-900 truncate text-sm">
                                      {getConversationUserName(conversation)}
                                    </p>
                                    <div
                                      className="flex flex-col items-end space-y-1"
                                      style={
                                        language === "am"
                                          ? { alignItems: "flex-start" }
                                          : {}
                                      }
                                    >
                                      {conversation.unreadCount > 0 && (
                                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 font-medium">
                                          {conversation.unreadCount}
                                        </span>
                                      )}
                                      <span
                                        className={`text-xs ${
                                          conversation.user?.isOnline
                                            ? "text-green-600"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        {conversation.user?.isOnline
                                          ? t("communication.online")
                                          : t("communication.offline")}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-500 truncate mt-1">
                                    {conversation.lastMessage?.content ||
                                      t("communication.noMessages")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={toggleNotifications}
                    className="relative flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full transition duration-200"
                    title={t("notifications.title")}
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                    </svg>
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div
                      className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                      dir={language === "am" ? "rtl" : "ltr"}
                    >
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div
                          className="flex justify-between items-center"
                          style={
                            language === "am"
                              ? { flexDirection: "row-reverse" }
                              : {}
                          }
                        >
                          <h3 className="font-bold text-gray-900 text-lg">
                            {t("notifications.title")}
                          </h3>
                          {notificationCount > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-blue-600 text-sm hover:text-blue-800 font-medium"
                            >
                              {t("notifications.markAllRead")}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="p-6 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                            <p className="text-sm">
                              {t("notifications.loading")}
                            </p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-6 text-center text-gray-500">
                            <svg
                              className="w-12 h-12 mx-auto mb-3 text-gray-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 17h5l-5 5v-5zM11 19H6.5A2.5 2.5 0 014 16.5v-9A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v3.5"
                              />
                            </svg>
                            <p className="text-sm">
                              {t("notifications.empty")}
                            </p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification._id}
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                              className={`p-4 hover:bg-gray-50 cursor-pointer transition duration-150 border-b border-gray-100 last:border-b-0 ${
                                !notification.read ? "bg-blue-50" : ""
                              }`}
                              style={
                                language === "am" ? { textAlign: "right" } : {}
                              }
                            >
                              <div
                                className="flex items-start space-x-3"
                                style={
                                  language === "am"
                                    ? { flexDirection: "row-reverse" }
                                    : {}
                                }
                              >
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <div className="text-black">
                                      {notification.icon}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div
                                    className="flex justify-between items-start"
                                    style={
                                      language === "am"
                                        ? { flexDirection: "row-reverse" }
                                        : {}
                                    }
                                  >
                                    <div className="flex-1">
                                      <p
                                        className={`text-sm font-semibold ${!notification.read ? "text-gray-900" : "text-gray-700"}`}
                                      >
                                        {notification.title}
                                      </p>
                                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-2">
                                        {getTimeAgo(notification.createdAt)}
                                      </p>
                                    </div>
                                    <div
                                      className="flex items-center space-x-2 ml-2"
                                      style={
                                        language === "am"
                                          ? {
                                              flexDirection: "row-reverse",
                                              marginLeft: 0,
                                              marginRight: "0.5rem",
                                            }
                                          : {}
                                      }
                                    >
                                      {!notification.read && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      )}
                                      <button
                                        onClick={(e) =>
                                          handleDeleteNotification(
                                            e,
                                            notification._id,
                                          )
                                        }
                                        className="text-gray-400 hover:text-red-500 transition duration-150"
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
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full hover:shadow-lg transition duration-200"
                    title={t("navbar.profile")}
                  >
                    <span className="text-white font-semibold text-sm">
                      {getUserInitials()}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div
                      className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                      dir={language === "am" ? "rtl" : "ltr"}
                    >
                      <div className="p-4 border-b border-gray-200">
                        <div
                          className="flex items-center space-x-3"
                          style={
                            language === "am"
                              ? { flexDirection: "row-reverse" }
                              : {}
                          }
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {getUserInitials()}
                            </span>
                          </div>
                          <div
                            style={
                              language === "am" ? { textAlign: "right" } : {}
                            }
                          >
                            <p className="font-semibold text-gray-900">
                              {getUserDisplayName()}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              {t(`navigation.${user?.role}`)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        <Link
                          to={getDashboardLink()}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition duration-150"
                          style={
                            language === "am"
                              ? {
                                  flexDirection: "row-reverse",
                                  textAlign: "right",
                                }
                              : {}
                          }
                        >
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={
                              language === "am"
                                ? { marginRight: 0, marginLeft: "0.75rem" }
                                : { marginRight: "0.75rem" }
                            }
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          {t("navigation.dashboard")}
                        </Link>

                        <Link
                          to="/client/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition duration-150"
                          style={
                            language === "am"
                              ? {
                                  flexDirection: "row-reverse",
                                  textAlign: "right",
                                }
                              : {}
                          }
                        >
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={
                              language === "am"
                                ? { marginRight: 0, marginLeft: "0.75rem" }
                                : { marginRight: "0.75rem" }
                            }
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          {t("navigation.profile")}
                        </Link>

                        <div className="border-t border-gray-200 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition duration-150"
                            style={
                              language === "am"
                                ? {
                                    flexDirection: "row-reverse",
                                    textAlign: "right",
                                  }
                                : {}
                            }
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              style={
                                language === "am"
                                  ? { marginRight: 0, marginLeft: "0.75rem" }
                                  : { marginRight: "0.75rem" }
                              }
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            {t("auth.logout")}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-blue-600 font-medium transition duration-200"
                >
                  {t("auth.login")}
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 shadow-md hover:shadow-lg"
                >
                  {t("auth.register")}
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden ml-2">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full transition duration-200"
                title={t("navbar.menu")}
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
            className="md:hidden py-4 border-t border-gray-200 bg-white"
            dir={language === "am" ? "rtl" : "ltr"}
          >
            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition duration-150"
                onClick={() => setIsMenuOpen(false)}
                style={
                  language === "am"
                    ? { flexDirection: "row-reverse", textAlign: "right" }
                    : {}
                }
              >
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={
                    language === "am"
                      ? { marginRight: 0, marginLeft: "0.75rem" }
                      : { marginRight: "0.75rem" }
                  }
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                {t("navigation.home")}
              </Link>

              <Link
                to="/properties"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition duration-150"
                onClick={() => setIsMenuOpen(false)}
                style={
                  language === "am"
                    ? { flexDirection: "row-reverse", textAlign: "right" }
                    : {}
                }
              >
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={
                    language === "am"
                      ? { marginRight: 0, marginLeft: "0.75rem" }
                      : { marginRight: "0.75rem" }
                  }
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                {t("navigation.properties")}
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to={getCommunicationLink()}
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition duration-150"
                    onClick={() => setIsMenuOpen(false)}
                    style={
                      language === "am"
                        ? { flexDirection: "row-reverse", textAlign: "right" }
                        : {}
                    }
                  >
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={
                        language === "am"
                          ? { marginRight: 0, marginLeft: "0.75rem" }
                          : { marginRight: "0.75rem" }
                      }
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    {t("communication.messages")}
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to={getDashboardLink()}
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition duration-150"
                    onClick={() => setIsMenuOpen(false)}
                    style={
                      language === "am"
                        ? { flexDirection: "row-reverse", textAlign: "right" }
                        : {}
                    }
                  >
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={
                        language === "am"
                          ? { marginRight: 0, marginLeft: "0.75rem" }
                          : { marginRight: "0.75rem" }
                      }
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    {t("navigation.dashboard")}
                  </Link>

                  <div className="px-4 py-2 border-t border-gray-200 mt-2 pt-4">
                    <div
                      className="flex items-center space-x-3 mb-3"
                      style={
                        language === "am"
                          ? { flexDirection: "row-reverse" }
                          : {}
                      }
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {getUserInitials()}
                        </span>
                      </div>
                      <div
                        style={language === "am" ? { textAlign: "right" } : {}}
                      >
                        <p className="font-semibold text-gray-900">
                          {getUserDisplayName()}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {t(`navigation.${user?.role}`)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition duration-150"
                      style={
                        language === "am"
                          ? { flexDirection: "row-reverse", textAlign: "right" }
                          : {}
                      }
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={
                          language === "am"
                            ? { marginRight: 0, marginLeft: "0.75rem" }
                            : { marginRight: "0.75rem" }
                        }
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      {t("auth.logout")}
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-4 py-2 border-t border-gray-200 mt-2 pt-4 space-y-2">
                  <Link
                    to="/login"
                    className="block w-full text-center py-2 text-gray-600 hover:text-blue-600 font-medium transition duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("auth.login")}
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("auth.register")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
