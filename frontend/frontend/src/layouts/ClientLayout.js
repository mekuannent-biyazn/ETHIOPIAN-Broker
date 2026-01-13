// import React, { useState } from "react";
// import { Outlet, Link, useLocation } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import { useCommunication } from "../context/CommunicationContext";
// import { useTranslation } from "react-i18next";

// const ClientLayout = () => {
//   const { user } = useAuth();
//   const { unreadCount } = useCommunication();
//   const location = useLocation();
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const { t, i18n } = useTranslation();

//   const navigation = [
//     { name: t("navigation.dashboard"), href: "/client", icon: "📊" },
//     {
//       name: t("layout.myProperties"),
//       href: "/client/my-properties",
//       icon: "🏠",
//     },
//     {
//       name: t("layout.createProperty"),
//       href: "/client/create-property",
//       icon: "➕",
//     },
//     { name: t("navigation.profile"), href: "/client/profile", icon: "👤" },
//     { name: t("layout.browseProperties"), href: "/properties", icon: "🔍" },
//     {
//       name: t("communication.messages"),
//       href: "/client/communication",
//       icon: "💬",
//       badge: unreadCount > 0 ? unreadCount : null,
//     },
//   ];

//   const isActive = (path) => {
//     return (
//       location.pathname === path || location.pathname.startsWith(path + "/")
//     );
//   };

//   const toggleLanguage = () => {
//     const newLang = i18n.language === "en" ? "am" : "en";
//     i18n.changeLanguage(newLang);
//   };

//   const currentLanguage = i18n.language;

//   return (
//     <div
//       className="flex h-screen bg-gray-100"
//       dir={currentLanguage === "am" ? "rtl" : "ltr"}
//     >
//       {/* Sidebar for desktop */}
//       <div className="hidden md:flex md:flex-shrink-0">
//         <div className="flex flex-col w-64 bg-white border-r">
//           <div className="flex items-center justify-between h-16 px-4 bg-purple-600 text-white">
//             <h1 className="text-lg font-bold">
//               {t("navigation.client")} {t("layout.panel")}
//             </h1>
//             <button
//               onClick={toggleLanguage}
//               className="text-sm bg-purple-700 hover:bg-purple-800 px-2 py-1 rounded transition-colors"
//             >
//               {currentLanguage === "en" ? "አማ" : "EN"}
//             </button>
//           </div>
//           <div className="flex flex-col flex-1 overflow-y-auto">
//             <nav className="flex-1 px-4 py-4 space-y-2">
//               {navigation.map((item) => (
//                 <Link
//                   key={item.name}
//                   to={item.href}
//                   className={`flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg transition duration-300 ${
//                     isActive(item.href)
//                       ? "bg-purple-100 text-purple-700"
//                       : "text-gray-600 hover:bg-gray-100"
//                   }`}
//                 >
//                   <div className="flex items-center">
//                     <span
//                       className={`${
//                         currentLanguage === "am" ? "ml-3" : "mr-3"
//                       } text-lg`}
//                     >
//                       {item.icon}
//                     </span>
//                     {item.name}
//                   </div>
//                   {item.badge && (
//                     <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                       {item.badge}
//                     </span>
//                   )}
//                 </Link>
//               ))}
//             </nav>
//             <div className="p-4 border-t">
//               <div className="flex items-center space-x-3">
//                 <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
//                   {user?.fname?.charAt(0)}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-medium text-gray-900 truncate">
//                     {user?.fname} {user?.lname}
//                   </p>
//                   <p className="text-sm text-gray-500 truncate capitalize">
//                     {t(`users.${user?.role}`)}
//                   </p>
//                   {unreadCount > 0 && (
//                     <p className="text-xs text-red-500 font-medium">
//                       {unreadCount} {t("layout.unreadMessages")}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Mobile sidebar */}
//       {isSidebarOpen && (
//         <div className="md:hidden fixed inset-0 z-40">
//           <div
//             className="fixed inset-0 bg-gray-600 bg-opacity-75"
//             onClick={() => setIsSidebarOpen(false)}
//           ></div>
//           <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
//             <div className="flex items-center justify-between h-16 px-4 bg-purple-600 text-white">
//               <h1 className="text-lg font-bold">
//                 {t("navigation.client")} {t("layout.panel")}
//               </h1>
//               <div className="flex items-center space-x-2">
//                 <button
//                   onClick={toggleLanguage}
//                   className="text-sm bg-purple-700 hover:bg-purple-800 px-2 py-1 rounded transition-colors"
//                 >
//                   {currentLanguage === "en" ? "አማ" : "EN"}
//                 </button>
//                 <button
//                   onClick={() => setIsSidebarOpen(false)}
//                   className="text-white hover:text-gray-200"
//                 >
//                   ✕
//                 </button>
//               </div>
//             </div>
//             <nav className="flex-1 px-4 py-4 space-y-2">
//               {navigation.map((item) => (
//                 <Link
//                   key={item.name}
//                   to={item.href}
//                   onClick={() => setIsSidebarOpen(false)}
//                   className={`flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg transition duration-300 ${
//                     isActive(item.href)
//                       ? "bg-purple-100 text-purple-700"
//                       : "text-gray-600 hover:bg-gray-100"
//                   }`}
//                 >
//                   <div className="flex items-center">
//                     <span
//                       className={`${
//                         currentLanguage === "am" ? "ml-3" : "mr-3"
//                       } text-lg`}
//                     >
//                       {item.icon}
//                     </span>
//                     {item.name}
//                   </div>
//                   {item.badge && (
//                     <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                       {item.badge}
//                     </span>
//                   )}
//                 </Link>
//               ))}
//             </nav>
//           </div>
//         </div>
//       )}

//       {/* Main content */}
//       <div className="flex flex-col flex-1 overflow-hidden">
//         <header className="bg-white shadow-sm z-10">
//           <div className="flex items-center justify-between h-16 px-4">
//             <button
//               onClick={() => setIsSidebarOpen(true)}
//               className="md:hidden text-gray-600 hover:text-gray-900"
//             >
//               <svg
//                 className="w-6 h-6"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M4 6h16M4 12h16M4 18h16"
//                 />
//               </svg>
//             </button>
//             <h1 className="text-xl font-semibold text-gray-800">
//               {navigation.find((item) => isActive(item.href))?.name ||
//                 t("layout.clientDashboard")}
//             </h1>
//             <div className="flex items-center space-x-4">
//               {unreadCount > 0 && (
//                 <Link
//                   to="/client/communication"
//                   className="relative p-2 text-gray-600 hover:text-purple-600"
//                 >
//                   <span className="text-xl">💬</span>
//                   <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                     {unreadCount}
//                   </span>
//                 </Link>
//               )}
//             </div>
//           </div>
//         </header>

//         <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// };

// export default ClientLayout;

import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCommunication } from "../context/CommunicationContext";
import { useTranslation } from "react-i18next";
import {
  FiHome,
  FiPackage,
  FiPlusCircle,
  FiSearch,
  FiHeart,
  FiBarChart2,
  FiUser,
  FiMessageSquare,
  FiSettings,
  FiBell,
  FiGlobe,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronRight,
} from "react-icons/fi";

const ClientLayout = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useCommunication();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenu, setActiveMenu] = useState("");
  const { t, i18n } = useTranslation();

  // Track sidebar state
  useEffect(() => {
    const savedSidebarState = localStorage.getItem("client-sidebar-open");
    if (savedSidebarState !== null) {
      setIsSidebarOpen(savedSidebarState === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("client-sidebar-open", isSidebarOpen.toString());
  }, [isSidebarOpen]);

  // Function to close sidebar and handle navigation
  const handleNavigation = (href) => {
    setIsSidebarOpen(false);
    // Optional: If you want to navigate programmatically, you can do:
    // navigate(href);
  };

  // Function to handle menu click with auto-close
  const handleMenuClick = (key, href) => {
    setActiveMenu(activeMenu === key ? "" : key);
    // Close sidebar after a short delay for better UX
    setTimeout(() => {
      setIsSidebarOpen(false);
    }, 150);
  };

  const navigation = [
    {
      name: t("navigation.dashboard"),
      href: "/client",
      icon: <FiHome className="w-5 h-5" />,
      desc: t("layout.viewOverview"),
      key: "dashboard",
    },
    {
      name: t("layout.myProperties"),
      href: "/client/my-properties",
      icon: <FiPackage className="w-5 h-5" />,
      desc: t("layout.viewYourListings"),
      key: "my-properties",
    },
    {
      name: t("layout.createProperty"),
      href: "/client/create-property",
      icon: <FiPlusCircle className="w-5 h-5" />,
      desc: t("layout.addNewListing"),
      key: "create-property",
      highlight: true,
    },
    {
      name: t("layout.searchProperties"),
      href: "/properties",
      icon: <FiSearch className="w-5 h-5" />,
      desc: t("layout.exploreMarket"),
      key: "search",
    },
  ];

  const quickActions = [
    {
      name: t("navigation.profile"),
      href: "/client/profile",
      icon: <FiUser className="w-4 h-4" />,
      desc: t("layout.editProfile"),
      key: "profile",
    },
    {
      name: t("communication.messages"),
      href: "/client/communication",
      icon: <FiMessageSquare className="w-4 h-4" />,
      badge: unreadCount,
      desc: t("layout.viewMessages"),
      key: "messages",
    },
    {
      name: t("layout.favorites"),
      href: "/client/favorites",
      icon: <FiHeart className="w-4 h-4" />,
      desc: t("layout.savedProperties"),
      key: "favorites",
    },
    {
      name: t("layout.analytics"),
      href: "/client/analytics",
      icon: <FiBarChart2 className="w-4 h-4" />,
      desc: t("layout.viewPerformance"),
      key: "analytics",
    },
  ];

  const settingsMenu = [
    {
      name: t("layout.settings"),
      href: "/client/settings",
      icon: <FiSettings className="w-4 h-4" />,
      desc: t("layout.accountSettings"),
      key: "settings",
    },
    {
      name: t("layout.notifications"),
      href: "/client/notifications",
      icon: <FiBell className="w-4 h-4" />,
      badge: 0,
      desc: t("layout.manageAlerts"),
      key: "notifications",
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
  const dir = currentLanguage === "am" ? "rtl" : "ltr";

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setIsSidebarOpen(false); // Close sidebar on search
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
      dir={dir}
    >
      {/* Floating Menu Button - Always visible on large screens */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-24 left-6 z-50 hidden lg:flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#FF4747] to-orange-500 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110"
        title={t("layout.showSidebar")}
      >
        <FiMenu className="w-6 h-6" />
      </button>

      {/* Sidebar Overlay for Large Screens */}
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 hidden lg:block"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar - Floats above content like mobile */}
          <div className="fixed top-0 left-0 h-screen w-80 z-50 hidden lg:block">
            <div className="flex flex-col h-full w-full bg-white shadow-2xl border-r border-gray-200">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <Link
                  to="/client"
                  className="flex items-center space-x-3"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-[#FF4747] to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-white font-bold">P</span>
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-gray-900">
                      {t("navigation.client")} Panel
                    </h1>
                    <p className="text-xs text-gray-500">
                      {user?.role || t("common.user")}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all group"
                  title={t("layout.hideSidebar")}
                >
                  <FiX className="w-5 h-5 text-gray-600 group-hover:text-[#FF4747]" />
                </button>
              </div>

              {/* User Profile */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#FF4747] to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {user?.fname?.charAt(0) || "U"}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {user?.fname} {user?.lname}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="flex-1 overflow-y-auto py-4">
                <div className="space-y-1 px-2">
                  {navigation.map((item) => (
                    <div key={item.key}>
                      <Link
                        to={item.href}
                        className={`group relative flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                          isActive(item.href)
                            ? "bg-gradient-to-r from-[#FF4747]/10 to-orange-500/10 text-[#FF4747]"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        } ${
                          item.highlight ? "border-l-2 border-[#FF4747]" : ""
                        }`}
                        onClick={() => handleMenuClick(item.key, item.href)}
                      >
                        <div
                          className={`text-gray-600 group-hover:text-[#FF4747] ${
                            isActive(item.href) ? "text-[#FF4747]" : ""
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="flex-1 flex items-center justify-between ml-3">
                          <span className="text-sm font-medium">
                            {item.name}
                          </span>
                          {item.highlight && (
                            <span className="text-xs bg-gradient-to-r from-[#FF4747] to-orange-500 text-white px-2 py-0.5 rounded-full">
                              NEW
                            </span>
                          )}
                        </div>
                        <FiChevronRight
                          className={`w-3 h-3 text-gray-400 transition-transform ${
                            activeMenu === item.key ? "rotate-90" : ""
                          }`}
                        />
                      </Link>

                      {activeMenu === item.key && (
                        <div className="ml-10 mt-1 mb-2 space-y-1 animate-slideDown">
                          <div className="text-xs text-gray-500 px-3 py-1 bg-gray-50 rounded">
                            {item.desc}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="my-4 px-3">
                  <div className="border-t border-gray-200"></div>
                </div>

                <div className="space-y-1 px-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t("layout.quickActions")}
                  </div>
                  {quickActions.map((item) => (
                    <Link
                      key={item.key}
                      to={item.href}
                      className={`group relative flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900`}
                      onClick={() => handleMenuClick(item.key, item.href)}
                    >
                      <div className="relative">
                        <div className="text-gray-600 group-hover:text-[#FF4747]">
                          {item.icon}
                        </div>
                        {item.badge > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                            {item.badge > 9 ? "9+" : item.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 flex items-center justify-between ml-3">
                        <span className="text-sm">{item.name}</span>
                        <FiChevronRight className="w-3 h-3 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="mt-4 space-y-1 px-2">
                  {settingsMenu.map((item) => (
                    <Link
                      key={item.key}
                      to={item.href}
                      className={`group relative flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900`}
                      onClick={() => handleMenuClick(item.key, item.href)}
                    >
                      <div className="relative">
                        <div className="text-gray-600 group-hover:text-[#FF4747]">
                          {item.icon}
                        </div>
                        {item.badge > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-sm ml-3">{item.name}</span>
                    </Link>
                  ))}
                </div>
              </nav>

              <div className="p-4 border-t border-gray-200 space-y-2">
                <button
                  onClick={() => {
                    toggleLanguage();
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                >
                  <div className="flex items-center space-x-3">
                    <FiGlobe className="w-4 h-4" />
                    <span className="text-sm">
                      {currentLanguage === "en" ? "አማርኛ" : "English"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {currentLanguage === "en" ? "Switch" : "ቀይር"}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-start px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span className="text-sm ml-3">{t("layout.logout")}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsSidebarOpen(false)}
          />

          <div className="relative flex flex-col w-80 bg-white h-full ml-auto shadow-2xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <Link
                to="/client"
                className="flex items-center space-x-3"
                onClick={() => setIsSidebarOpen(false)}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#FF4747] to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">P</span>
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">
                    {t("navigation.client")} Panel
                  </h1>
                  <p className="text-xs text-gray-500">
                    {user?.role || t("common.user")}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF4747] to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user?.fname?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {user?.fname} {user?.lname}
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
              <div className="space-y-1 px-2">
                {navigation.map((item) => (
                  <Link
                    key={item.key}
                    to={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                      isActive(item.href)
                        ? "bg-gradient-to-r from-[#FF4747]/10 to-orange-500/10 text-[#FF4747]"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="mr-3">{item.icon}</div>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                    </div>
                    {item.highlight && (
                      <span className="text-xs bg-gradient-to-r from-[#FF4747] to-orange-500 text-white px-2 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              <div className="mt-6 px-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  {t("layout.quickActions")}
                </div>
                <div className="space-y-1">
                  {quickActions.concat(settingsMenu).map((item) => (
                    <Link
                      key={item.key}
                      to={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className="flex items-center justify-between px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <div className="mr-3">{item.icon}</div>
                        <span>{item.name}</span>
                      </div>
                      {item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            <div className="p-4 border-t border-gray-200 space-y-2">
              <button
                onClick={() => {
                  toggleLanguage();
                  setIsSidebarOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <FiGlobe className="w-4 h-4 mr-3" />
                  <span>{currentLanguage === "en" ? "አማርኛ" : "English"}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {currentLanguage === "en" ? "Switch" : "ቀይር"}
                </span>
              </button>

              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  logout();
                }}
                className="w-full flex items-center px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 font-medium"
              >
                <FiLogOut className="w-4 h-4 mr-3" />
                {t("layout.logout")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - No margin shift */}
      <div className="min-h-screen">
        {/* Main Content Area */}
        <main className="p-4 sm:p-6 pt-20">
          {" "}
          {/* Added pt-20 to account for navbar */}
          {/* Stats Cards */}
          {location.pathname === "/client" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("layout.totalProperties")}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-[#FF4747]/10 to-orange-500/10 rounded-lg flex items-center justify-center">
                    <FiPackage className="w-5 h-5 text-[#FF4747]" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("layout.unreadMessages")}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {unreadCount}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg flex items-center justify-center">
                    <FiMessageSquare className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("layout.viewsThisMonth")}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg flex items-center justify-center">
                    <FiBarChart2 className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Content Area */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Add CSS animation */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ClientLayout;
