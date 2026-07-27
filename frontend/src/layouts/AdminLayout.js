import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCommunication } from "../context/CommunicationContext";
import { useTranslation } from "react-i18next";

const AdminLayout = () => {
  const { user } = useAuth();
  const { unreadCount } = useCommunication();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const navigation = [
    { name: t("navigation.dashboard"), href: "/admin", icon: "📊" },
    { name: t("admin.manageUsers"), href: "/admin/users", icon: "👥" },
    {
      name: t("admin.manageProperties"),
      href: "/admin/properties",
      icon: "🏠",
    },
    {
      name: t("admin.manualVerification"),
      href: "/admin/manual-verification",
      icon: "✅",
    },
    {
      name: t("admin.contactMessages.title"),
      href: "/admin/contact-messages",
      icon: "📧",
    },
    {
      name: t("communication.messages"),
      href: "/admin/communication",
      icon: "💬",
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ];

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "am" : "en";
    i18n.changeLanguage(newLang);
  };

  const currentLanguage = i18n.language;

  // Telegram-inspired color scheme
  const telegramColors = {
    sidebarBg: "#182533",
    sidebarHover: "#2a3b4d",
    sidebarActive: "#3c5a78",
    textPrimary: "#ffffff",
    textSecondary: "#a8b5c1",
    accentBlue: "#3390ec",
    badgeRed: "#eb5757",
    userOnline: "#4caf50",
  };

  return (
    <div
      className="flex h-screen bg-gray-100"
      dir={currentLanguage === "am" ? "rtl" : "ltr"}
    >
      {/* Desktop Sidebar - Telegram Style */}
      <div
        className={`hidden md:flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
        style={{ backgroundColor: telegramColors.sidebarBg }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          {isSidebarOpen ? (
            <div className="flex items-center justify-between w-full">
              <h1 className="text-lg font-bold text-white">
                {t("navigation.admin")}
              </h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleLanguage}
                  className="text-sm bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors text-white"
                >
                  {currentLanguage === "en" ? "አማ" : "EN"}
                </button>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors"
                  title="Collapse sidebar"
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
                      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                title="Expand sidebar"
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
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center rounded-lg px-3 py-3 transition-all duration-200 group relative overflow-hidden ${
                isActive(item.href)
                  ? "bg-blue-900 bg-opacity-30 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              style={{
                backgroundColor: isActive(item.href)
                  ? telegramColors.sidebarActive
                  : "transparent",
              }}
            >
              {/* Active indicator */}
              {isActive(item.href) && (
                <div
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-r"
                  style={{ backgroundColor: telegramColors.accentBlue }}
                ></div>
              )}

              <span className="text-xl flex-shrink-0">{item.icon}</span>

              {isSidebarOpen && (
                <>
                  <span className="ml-3 flex-1 font-medium transition-opacity duration-200">
                    {item.name}
                  </span>
                  {item.badge && (
                    <span
                      className="ml-2 flex-shrink-0 text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center animate-pulse"
                      style={{ backgroundColor: telegramColors.badgeRed }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}

              {/* Tooltip for collapsed state */}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
                  {item.name}
                  {item.badge && (
                    <span className="ml-1 text-xs text-red-300">
                      ({item.badge})
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-gray-700 p-4">
          <Link
            to="/admin/profile"
            className={`flex items-center rounded-lg px-3 py-3 transition-all duration-200 ${
              isSidebarOpen ? "justify-start" : "justify-center"
            } text-gray-300 hover:bg-gray-800 hover:text-white group relative`}
          >
            <div className="relative">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: telegramColors.accentBlue }}
              >
                {user?.fname?.charAt(0)}
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800"
                style={{ backgroundColor: telegramColors.userOnline }}
              ></div>
            </div>

            {isSidebarOpen && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.fname} {user?.lname}
                </p>
                <p className="text-xs text-gray-400 truncate capitalize">
                  {t(`users.${user?.role}`)}
                </p>
                {unreadCount > 0 && (
                  <p className="text-xs text-red-400 font-medium mt-1">
                    {unreadCount} {t("layout.unreadMessages")}
                  </p>
                )}
              </div>
            )}

            {/* Tooltip for collapsed state */}
            {!isSidebarOpen && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
                <p className="font-medium">
                  {user?.fname} {user?.lname}
                </p>
                <p className="text-xs text-gray-300">
                  {t(`users.${user?.role}`)}
                </p>
                {unreadCount > 0 && (
                  <p className="text-xs text-red-300">
                    {unreadCount} {t("layout.unreadMessages")}
                  </p>
                )}
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileSidebarOpen(false)}
          ></div>
          <div
            className="relative flex-1 flex flex-col max-w-xs w-full h-full"
            style={{ backgroundColor: telegramColors.sidebarBg }}
            dir={currentLanguage === "am" ? "rtl" : "ltr"}
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
              <h1 className="text-lg font-bold text-white">
                {t("navigation.admin")} {t("layout.panel")}
              </h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleLanguage}
                  className="text-sm bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors text-white"
                >
                  {currentLanguage === "en" ? "አማ" : "EN"}
                </button>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={`flex items-center rounded-lg px-3 py-3 transition-colors ${
                    isActive(item.href)
                      ? "bg-blue-900 bg-opacity-30 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <span className="text-xl mr-3">{item.icon}</span>
                  <span className="flex-1 font-medium">{item.name}</span>
                  {item.badge && (
                    <span
                      className="ml-2 text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center"
                      style={{ backgroundColor: telegramColors.badgeRed }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <div className="border-t border-gray-700 p-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: telegramColors.accentBlue }}
                  >
                    {user?.fname?.charAt(0)}
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800"
                    style={{ backgroundColor: telegramColors.userOnline }}
                  ></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.fname} {user?.lname}
                  </p>
                  <p className="text-xs text-gray-400 truncate capitalize">
                    {t(`users.${user?.role}`)}
                  </p>
                  {unreadCount > 0 && (
                    <p className="text-xs text-red-400 font-medium mt-1">
                      {unreadCount} {t("layout.unreadMessages")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <header
          className="bg-white shadow-sm z-10 border-b"
          style={{ height: "64px" }}
        >
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="hidden md:flex text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-800">
                {navigation.find((item) => isActive(item.href))?.name ||
                  t("dashboard.adminDashboard")}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {unreadCount > 0 && (
                <Link
                  to="/admin/communication"
                  className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors group"
                >
                  <span className="text-2xl">💬</span>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-bounce shadow-lg">
                    {unreadCount}
                  </span>
                  <div className="absolute right-0 mt-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
                    {unreadCount} {t("layout.unreadMessages")}
                  </div>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
