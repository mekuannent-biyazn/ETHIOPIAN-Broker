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

  return (
    <div
      className="flex h-screen bg-gray-100"
      dir={currentLanguage === "am" ? "rtl" : "ltr"}
    >
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r">
          <div className="flex items-center justify-between h-16 px-4 bg-blue-600 text-white">
            <h1 className="text-lg font-bold">
              {t("navigation.admin")} {t("layout.panel")}
            </h1>
            <button
              onClick={toggleLanguage}
              className="text-sm bg-blue-700 hover:bg-blue-800 px-2 py-1 rounded transition-colors"
            >
              {currentLanguage === "en" ? "አማ" : "EN"}
            </button>
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto">
            <nav className="flex-1 px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg transition duration-300 ${
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center">
                    <span
                      className={`${
                        currentLanguage === "am" ? "ml-3" : "mr-3"
                      } text-lg`}
                    >
                      {item.icon}
                    </span>
                    {item.name}
                  </div>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user?.fname?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.fname} {user?.lname}
                  </p>
                  <p className="text-sm text-gray-500 truncate capitalize">
                    {t(`users.${user?.role}`)}
                  </p>
                  {unreadCount > 0 && (
                    <p className="text-xs text-red-500 font-medium">
                      {unreadCount} {t("layout.unreadMessages")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="flex items-center justify-between h-16 px-4 bg-blue-600 text-white">
              <h1 className="text-lg font-bold">
                {t("navigation.admin")} {t("layout.panel")}
              </h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleLanguage}
                  className="text-sm bg-blue-700 hover:bg-blue-800 px-2 py-1 rounded transition-colors"
                >
                  {currentLanguage === "en" ? "አማ" : "EN"}
                </button>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-white hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg transition duration-300 ${
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center">
                    <span
                      className={`${
                        currentLanguage === "am" ? "ml-3" : "mr-3"
                      } text-lg`}
                    >
                      {item.icon}
                    </span>
                    {item.name}
                  </div>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-gray-600 hover:text-gray-900"
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
                t("dashboard.adminDashboard")}
            </h1>
            <div className="flex items-center space-x-4">
              {unreadCount > 0 && (
                <Link
                  to="/admin/communication"
                  className="relative p-2 text-gray-600 hover:text-blue-600"
                >
                  <span className="text-xl">💬</span>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
