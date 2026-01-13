import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCommunication } from "../context/CommunicationContext";
import { useTranslation } from "react-i18next";

const BrokerSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useCommunication();
  const { t } = useTranslation();

  const navigation = [
    {
      name: t("navigation.dashboard"),
      href: "/broker/dashboard",
      icon: "📊",
      current: location.pathname === "/broker/dashboard",
    },
    {
      name: t("navigation.properties"),
      href: "/broker/properties",
      icon: "🏠",
      current: location.pathname === "/broker/properties",
    },
    {
      name: t("broker.commissions"),
      href: "/broker/commissions",
      icon: "💰",
      current: location.pathname === "/broker/commissions",
    },
    {
      name: t("broker.clients"),
      href: "/broker/clients",
      icon: "👥",
      current: location.pathname === "/broker/clients",
    },
    {
      name: t("communication.messages"),
      href: "/broker/communication",
      icon: "💬",
      current: location.pathname.startsWith("/broker/communication"),
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md bg-white shadow-lg"
        >
          <span className="text-xl">☰</span>
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <span className="text-2xl">🏠</span>
            <span className="ml-2 text-xl font-semibold">
              {t("broker.portal")}
            </span>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.fname?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {user?.fname} {user?.lname}
              </p>
              <p className="text-xs text-gray-500">{t("navigation.broker")}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                  ${
                    item.current
                      ? "bg-green-50 text-green-700 border-r-2 border-green-500"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <div className="flex items-center">
                  <span className="text-lg mr-3">{item.icon}</span>
                  {item.name}
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* Quick Stats */}
        <div className="mt-8 px-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              {t("broker.quickStats")}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">{t("navigation.role")}:</span>
                <span className="font-medium text-green-600">
                  {t("navigation.broker")}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">{t("common.status")}:</span>
                <span className="font-medium text-green-600">
                  {t("common.active")}
                </span>
              </div>
              {unreadCount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">
                    {t("broker.unreadMessages")}:
                  </span>
                  <span className="font-medium text-red-600">
                    {unreadCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BrokerSidebar;
