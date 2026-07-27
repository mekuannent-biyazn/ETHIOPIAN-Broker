import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCommunication } from "../context/CommunicationContext";
import { useTranslation } from "react-i18next";

const BrokerLayout = () => {
  const { user } = useAuth();
  const { unreadCount } = useCommunication();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language;

  const navigation = [
    {
      name: t("navigation.dashboard"),
      href: "/broker/dashboard",
      icon: (
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
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      name: t("navigation.properties"),
      href: "/broker/properties",
      icon: (
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
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      name: t("broker.commissions"),
      href: "/broker/commissions",
      icon: (
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
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
    },
    {
      name: t("communication.messages"),
      href: "/broker/communication",
      icon: (
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
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      badge: unreadCount > 0 ? unreadCount : null,
    },
    // REMOVED CLIENTS NAVIGATION ITEM
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

  const handleMenuClick = (href) => {
    navigate(href);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar - Telegram Style (Green for Broker) */}
      <div
        className={`hidden md:flex transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex flex-col w-full bg-gradient-to-b from-green-900 via-green-800 to-green-900 text-white">
          {/* Brand/Logo Section */}
          <div className="p-4 border-b border-green-700">
            <div className="flex items-center justify-between">
              {sidebarCollapsed ? (
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-green-900 font-bold text-lg">M4S</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-green-900 font-bold text-lg">
                      M4S
                    </span>
                  </div>
                  <div className="ml-3">
                    <h1 className="text-lg font-bold">M4S Brokerage</h1>
                    <p className="text-green-200 text-xs">Broker Portal</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-green-200 hover:text-white p-1"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {sidebarCollapsed ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto py-4 px-2">
            <nav className="space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-green-700 shadow-md text-white"
                      : "text-green-100 hover:bg-green-700 hover:bg-opacity-50"
                  }`}
                >
                  <div className="relative">
                    {item.icon}
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex items-center justify-between flex-1 ml-3">
                      <span className="text-sm font-medium">{item.name}</span>
                      {item.badge && typeof item.badge === "number" && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </nav>

            {/* Language Toggle */}
            {!sidebarCollapsed && (
              <div className="mt-6 px-3">
                <button
                  onClick={toggleLanguage}
                  className="w-full flex items-center justify-center px-3 py-2 bg-green-700 hover:bg-green-600 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium">
                    {currentLanguage === "en" ? "አማርኛ" : "English"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* User Profile Section */}
          <div className="p-4 border-t border-green-700">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user?.fname?.charAt(0) || "B"}
                </span>
              </div>
              {!sidebarCollapsed && (
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium truncate">
                        {user?.fname} {user?.lname}
                      </p>
                      <p className="text-xs text-green-300 truncate capitalize">
                        {t(`users.${user?.role}`)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden text-gray-600 hover:text-gray-900 mr-4"
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
              <h1 className="text-xl font-semibold text-gray-800">
                {navigation.find((item) => isActive(item.href))?.name ||
                  t("broker.dashboard")}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Language Toggle for Mobile */}
              <button
                onClick={toggleLanguage}
                className="md:hidden text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
              >
                {currentLanguage === "en" ? "አማ" : "EN"}
              </button>

              {/* Messages Badge */}
              {unreadCount > 0 && (
                <Link
                  to="/broker/communication"
                  className="relative p-2 text-gray-600 hover:text-green-600"
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
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        <div
          className={`md:hidden fixed inset-0 z-40 transition-transform duration-300 ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div
            className="fixed inset-0 bg-gray-900 bg-opacity-50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex flex-col w-64 h-full bg-gradient-to-b from-green-900 to-green-800 text-white">
            <div className="flex items-center justify-between p-4 border-b border-green-700">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-green-900 font-bold text-lg">M4S</span>
                </div>
                <div className="ml-3">
                  <h1 className="text-lg font-bold">M4S Brokerage</h1>
                  <p className="text-green-200 text-xs">Broker Portal</p>
                </div>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="text-green-200 hover:text-white"
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

            <nav className="flex-1 py-4 px-2 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleMenuClick(item.href)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-green-700 shadow-md text-white"
                      : "text-green-100 hover:bg-green-700 hover:bg-opacity-50"
                  }`}
                >
                  <div className="flex items-center">
                    {item.icon}
                    <span className="ml-3 text-sm font-medium">
                      {item.name}
                    </span>
                  </div>
                  {item.badge && (
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-green-700">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {user?.fname?.charAt(0) || "B"}
                  </span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium truncate">
                        {user?.fname} {user?.lname}
                      </p>
                      <p className="text-xs text-green-300 truncate capitalize">
                        {t(`users.${user?.role}`)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BrokerLayout;
