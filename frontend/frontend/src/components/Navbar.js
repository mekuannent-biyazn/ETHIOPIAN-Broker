// import React, { useState, useRef, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import { useCommunication } from "../context/CommunicationContext";
// import { useTranslation } from "react-i18next";
// import LanguageSwitcher from "./LanguageSwitcher";
// import "./Navbar.css";

// const Navbar = () => {
//   const { user, logout, isAuthenticated } = useAuth();
//   const { unreadCount, conversations, loadConversations, loadUnreadCount } =
//     useCommunication();
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [showMessages, setShowMessages] = useState(false);
//   const navigate = useNavigate();
//   const { t } = useTranslation();

//   const messagesRef = useRef(null);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (messagesRef.current && !messagesRef.current.contains(event.target)) {
//         setShowMessages(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   // Load conversations when messages dropdown is opened
//   useEffect(() => {
//     if (showMessages && isAuthenticated) {
//       loadConversations();
//       loadUnreadCount();
//     }
//   }, [showMessages, isAuthenticated, loadConversations, loadUnreadCount]);

//   const handleLogout = () => {
//     logout();
//     navigate("/");
//   };

//   const getDashboardLink = () => {
//     if (!user) return "/login";
//     switch (user.role) {
//       case "admin":
//         return "/admin";
//       case "broker":
//         return "/broker/dashboard";
//       case "client":
//         return "/client";
//       default:
//         return "/";
//     }
//   };

//   const getCommunicationLink = () => {
//     if (!user) return "/login";
//     switch (user.role) {
//       case "admin":
//         return "/admin/communication";
//       case "broker":
//         return "/broker/communication";
//       case "client":
//         return "/client/communication";
//       default:
//         return "/communication";
//     }
//   };

//   const toggleMessages = () => {
//     setShowMessages(!showMessages);
//   };

//   const handleMessageClick = (conversation) => {
//     setShowMessages(false);
//     if (conversation?.user?._id) {
//       navigate(`${getCommunicationLink()}/${conversation.user._id}`);
//     }
//   };

//   const handleViewAllMessages = () => {
//     setShowMessages(false);
//     navigate(getCommunicationLink());
//   };

//   // Safe user name display
//   const getUserDisplayName = () => {
//     if (!user) return t("common.user");
//     return user.fname || user.name || t("common.user");
//   };

//   // Safe conversation user display
//   const getConversationUserName = (conversation) => {
//     if (!conversation?.user) return t("communication.unknownUser");
//     const { user } = conversation;
//     return (
//       `${user.fname || ""} ${user.lname || ""}`.trim() ||
//       t("communication.unknownUser")
//     );
//   };

//   // Safe conversation user initials
//   const getConversationUserInitials = (conversation) => {
//     if (!conversation?.user) return "UU";
//     const { user } = conversation;
//     const firstInitial = user.fname ? user.fname.charAt(0) : "U";
//     const lastInitial = user.lname ? user.lname.charAt(0) : "U";
//     return `${firstInitial}${lastInitial}`;
//   };

//   return (
//     <nav className="bg-white shadow-lg sticky top-0 z-50">
//       <div className="max-w-7xl mx-auto px-4">
//         <div className="flex justify-between items-center h-16">
//           {/* Logo */}
//           <Link to="/" className="flex items-center space-x-2">
//             <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
//             <span className="font-bold text-xl text-gray-800">
//               ETHIO Broker
//             </span>
//           </Link>

//           {/* Desktop Menu */}
//           <div className="hidden md:flex items-center space-x-8">
//             <Link
//               to="/"
//               className="text-gray-600 hover:text-blue-600 transition duration-300"
//             >
//               {t("navigation.home")}
//             </Link>

//             <Link
//               to="/properties"
//               className="text-gray-600 hover:text-blue-600 transition duration-300"
//             >
//               {t("navigation.properties")}
//             </Link>

//             {isAuthenticated ? (
//               <>
//                 {/* Messages Dropdown */}
//                 <div className="relative" ref={messagesRef}>
//                   <button
//                     onClick={toggleMessages}
//                     className="relative p-2 text-gray-600 hover:text-blue-600 transition duration-300"
//                   >
//                     <span className="text-xl">💬</span>
//                     {unreadCount > 0 && (
//                       <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                         {unreadCount > 99 ? "99+" : unreadCount}
//                       </span>
//                     )}
//                   </button>

//                   {showMessages && (
//                     <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
//                       <div className="p-4 border-b border-gray-200">
//                         <div className="flex justify-between items-center">
//                           <h3 className="font-semibold text-gray-800">
//                             {t("communication.messages")}
//                           </h3>
//                           <button
//                             onClick={handleViewAllMessages}
//                             className="text-blue-600 text-sm hover:text-blue-800"
//                           >
//                             {t("common.viewAll")}
//                           </button>
//                         </div>
//                       </div>

//                       <div className="max-h-96 overflow-y-auto">
//                         {!conversations || conversations.length === 0 ? (
//                           <div className="p-4 text-center text-gray-500">
//                             {t("communication.noMessages")}
//                           </div>
//                         ) : (
//                           conversations
//                             .slice(0, 5)
//                             .map((conversation, index) => (
//                               <div
//                                 key={conversation?.user?._id || `conv-${index}`}
//                                 onClick={() => handleMessageClick(conversation)}
//                                 className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition duration-150"
//                               >
//                                 <div className="flex items-center space-x-3">
//                                   <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
//                                     {getConversationUserInitials(conversation)}
//                                   </div>
//                                   <div className="flex-1 min-w-0">
//                                     <div className="flex justify-between items-start">
//                                       <p className="font-medium text-gray-900 truncate">
//                                         {getConversationUserName(conversation)}
//                                       </p>
//                                       {conversation?.unreadCount > 0 && (
//                                         <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-6 text-center">
//                                           {conversation.unreadCount > 99
//                                             ? "99+"
//                                             : conversation.unreadCount}
//                                         </span>
//                                       )}
//                                     </div>
//                                     <p className="text-sm text-gray-500 truncate">
//                                       {conversation?.lastMessage?.content ||
//                                         t("communication.noMessages")}
//                                     </p>
//                                   </div>
//                                 </div>
//                               </div>
//                             ))
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 <Link
//                   to={getDashboardLink()}
//                   className="text-gray-600 hover:text-blue-600 transition duration-300"
//                 >
//                   {t("navigation.dashboard")}
//                 </Link>

//                 <Link
//                   to={getCommunicationLink()}
//                   className="text-gray-600 hover:text-blue-600 transition duration-300"
//                 >
//                   {t("communication.messages")}
//                 </Link>

//                 <div className="flex items-center space-x-4">
//                   <span className="text-gray-700">
//                     {t("common.welcome")}, {getUserDisplayName()}
//                   </span>
//                   <LanguageSwitcher />
//                   <button
//                     onClick={handleLogout}
//                     className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-300"
//                   >
//                     {t("auth.logout")}
//                   </button>
//                 </div>
//               </>
//             ) : (
//               <div className="flex items-center space-x-4">
//                 <LanguageSwitcher />
//                 <Link
//                   to="/login"
//                   className="text-gray-600 hover:text-blue-600 transition duration-300"
//                 >
//                   {t("auth.login")}
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-300"
//                 >
//                   {t("auth.register")}
//                 </Link>
//               </div>
//             )}
//           </div>

//           {/* Mobile menu button */}
//           <div className="md:hidden flex items-center space-x-2">
//             {isAuthenticated && unreadCount > 0 && (
//               <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                 {unreadCount > 99 ? "99+" : unreadCount}
//               </span>
//             )}
//             <button
//               onClick={() => setIsMenuOpen(!isMenuOpen)}
//               className="text-gray-600 hover:text-blue-600 focus:outline-none"
//             >
//               <svg
//                 className="w-6 h-6"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 {isMenuOpen ? (
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M6 18L18 6M6 6l12 12"
//                   />
//                 ) : (
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M4 6h16M4 12h16M4 18h16"
//                   />
//                 )}
//               </svg>
//             </button>
//           </div>
//         </div>

//         {/* Mobile Menu */}
//         {isMenuOpen && (
//           <div className="md:hidden py-4 border-t border-gray-200">
//             <div className="flex flex-col space-y-4">
//               <Link
//                 to="/"
//                 className="text-gray-600 hover:text-blue-600 transition duration-300"
//                 onClick={() => setIsMenuOpen(false)}
//               >
//                 {t("navigation.home")}
//               </Link>

//               <Link
//                 to="/properties"
//                 className="text-gray-600 hover:text-blue-600 transition duration-300"
//                 onClick={() => setIsMenuOpen(false)}
//               >
//                 {t("navigation.properties")}
//               </Link>

//               {isAuthenticated ? (
//                 <>
//                   <Link
//                     to={getCommunicationLink()}
//                     className="text-gray-600 hover:text-blue-600 transition duration-300 flex items-center"
//                     onClick={() => setIsMenuOpen(false)}
//                   >
//                     <span className="mr-2">💬</span>
//                     {t("communication.messages")}
//                     {unreadCount > 0 && (
//                       <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                         {unreadCount > 99 ? "99+" : unreadCount}
//                       </span>
//                     )}
//                   </Link>

//                   <Link
//                     to={getDashboardLink()}
//                     className="text-gray-600 hover:text-blue-600 transition duration-300"
//                     onClick={() => setIsMenuOpen(false)}
//                   >
//                     {t("navigation.dashboard")}
//                   </Link>

//                   <span className="text-gray-700">
//                     {t("common.welcome")}, {getUserDisplayName()}
//                     {user?.role && ` (${t(`navigation.${user.role}`)})`}
//                   </span>

//                   <div className="py-2">
//                     <LanguageSwitcher />
//                   </div>

//                   <button
//                     onClick={handleLogout}
//                     className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-300 text-left"
//                   >
//                     {t("auth.logout")}
//                   </button>
//                 </>
//               ) : (
//                 <>
//                   <div className="py-2">
//                     <LanguageSwitcher />
//                   </div>
//                   <Link
//                     to="/login"
//                     className="text-gray-600 hover:text-blue-600 transition duration-300"
//                     onClick={() => setIsMenuOpen(false)}
//                   >
//                     {t("auth.login")}
//                   </Link>
//                   <Link
//                     to="/register"
//                     className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-300 text-center"
//                     onClick={() => setIsMenuOpen(false)}
//                   >
//                     {t("auth.register")}
//                   </Link>
//                 </>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// };

// export default Navbar;

import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCommunication } from "../context/CommunicationContext";
import { useTheme } from "../context/ThemeContext"; // Add this import
import { useTranslation } from "react-i18next";
import {
  FiSearch,
  FiMessageSquare,
  FiHeart,
  FiShoppingCart,
  FiUser,
  FiHome,
  FiSettings,
  FiLogOut,
  FiBell,
  FiGrid,
  FiGlobe,
  FiMenu,
  FiX,
  FiChevronDown,
  FiPlusCircle,
  FiPackage,
  FiChevronRight,
  FiSun, // Add for light mode icon
  FiMoon, // Add for dark mode icon
} from "react-icons/fi";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount, conversations, loadConversations, loadUnreadCount } =
    useCommunication();
  const { isDarkMode, toggleTheme } = useTheme(); // Get theme context
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const messagesRef = useRef(null);
  const userMenuRef = useRef(null);
  const categoriesRef = useRef(null);

  // Property categories
  const propertyCategories = [
    {
      name: t("properties.apartment"),
      icon: "🏢",
      href: "/properties?type=apartment",
    },
    {
      name: t("properties.villa"),
      icon: "🏡",
      href: "/properties?type=villa",
    },
    {
      name: t("properties.commercial"),
      icon: "🏬",
      href: "/properties?type=commercial",
    },
    {
      name: t("properties.land"),
      icon: "🏞️",
      href: "/properties?type=land",
    },
    {
      name: t("properties.rental"),
      icon: "🏠",
      href: "/properties?purpose=rent",
    },
    {
      name: t("properties.sale"),
      icon: "💰",
      href: "/properties?purpose=sale",
    },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (messagesRef.current && !messagesRef.current.contains(event.target)) {
        setShowMessages(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (
        categoriesRef.current &&
        !categoriesRef.current.contains(event.target)
      ) {
        setShowCategories(false);
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
    setShowUserMenu(false);
  };

  // Get correct links based on user role
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

  const getProfileLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "admin":
        return "/admin/profile";
      case "broker":
        return "/broker/profile";
      case "client":
        return "/client/profile";
      default:
        return "/profile";
    }
  };

  const getSettingsLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "admin":
        return "/admin/settings";
      case "broker":
        return "/broker/settings";
      case "client":
        return "/client/settings";
      default:
        return "/settings";
    }
  };

  const getWishlistLink = () => {
    if (!user) return "/login";
    return "/client/favorites";
  };

  const getOrdersLink = () => {
    if (!user) return "/login";
    // Use the correct path based on your route
    return "/client/my-orders";
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "am" : "en";
    i18n.changeLanguage(newLang);
    setShowUserMenu(false);
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
    return user.fname || user.name || t("common.user");
  };

  // Safe conversation user display
  const getConversationUserName = (conversation) => {
    if (!conversation?.user) return t("communication.unknownUser");
    const { user } = conversation;
    return (
      `${user.fname || ""} ${user.lname || ""}`.trim() ||
      t("communication.unknownUser")
    );
  };

  // User menu items for dropdown
  const userMenuItems = [
    {
      name: t("navigation.dashboard"),
      href: getDashboardLink(),
      icon: <FiHome className="w-4 h-4" />,
      onClick: () => setShowUserMenu(false),
    },
    {
      name: t("navigation.profile"),
      href: getProfileLink(),
      icon: <FiUser className="w-4 h-4" />,
      onClick: () => setShowUserMenu(false),
    },
    {
      name: t("communication.messages"),
      href: getCommunicationLink(),
      icon: <FiMessageSquare className="w-4 h-4" />,
      badge: unreadCount,
      onClick: () => setShowUserMenu(false),
    },
    {
      name: t("layout.favorites"),
      href: getWishlistLink(),
      icon: <FiHeart className="w-4 h-4" />,
      onClick: () => setShowUserMenu(false),
    },
    {
      name: t("layout.settings"),
      href: getSettingsLink(),
      icon: <FiSettings className="w-4 h-4" />,
      onClick: () => setShowUserMenu(false),
    },
    {
      name: t("auth.logout"),
      onClick: handleLogout,
      icon: <FiLogOut className="w-4 h-4" />,
      isLogout: true,
    },
  ];

  // Check if user is client
  const isClientUser = user?.role === "client";
  const currentLanguage = i18n.language;

  return (
    <nav className="bg-gradient-to-r from-[#FF4747] to-orange-500 shadow-lg sticky top-0 z-50 font-sans dark:from-gray-900 dark:to-gray-800">
      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg dark:bg-gray-800">
              <span className="font-bold text-xl text-[#FF4747] dark:text-orange-400">
                P
              </span>
            </div>
            <span className="font-bold text-2xl text-white dark:text-gray-100">
              PROP<span className="text-white dark:text-gray-100">FIND</span>
            </span>
          </Link>

          {/* Main Navigation Items - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Categories Button */}
            <div className="relative" ref={categoriesRef}>
              <button
                onClick={() => setShowCategories(!showCategories)}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm dark:bg-gray-800/50 dark:hover:bg-gray-700/50"
              >
                <FiGrid className="w-5 h-5" />
                <span>{t("navigation.categories")}</span>
              </button>

              {showCategories && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-40 dark:bg-gray-800 dark:border-gray-700">
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      {t("navigation.browseCategories")}
                    </h3>
                    <div className="space-y-2">
                      {propertyCategories.map((category, index) => (
                        <Link
                          key={index}
                          to={category.href}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                          onClick={() => setShowCategories(false)}
                        >
                          <span className="text-lg">{category.icon}</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {category.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Post Property Button - Only for clients */}
            {isClientUser && (
              <Link
                to="/client/create-property"
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm dark:bg-gray-800/50 dark:hover:bg-gray-700/50"
              >
                <FiPlusCircle className="w-5 h-5" />
                <span>{t("properties.postProperty")}</span>
              </Link>
            )}

            {/* Orders Button - Only for authenticated users */}
            {isAuthenticated && (
              <Link
                to={getOrdersLink()}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm dark:bg-gray-800/50 dark:hover:bg-gray-700/50"
              >
                <FiPackage className="w-5 h-5" />
                <span>{t("navigation.orders")}</span>
              </Link>
            )}

            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm dark:bg-gray-800/50 dark:hover:bg-gray-700/50"
              title={t("common.toggleDarkMode")}
            >
              {isDarkMode ? (
                <FiSun className="w-5 h-5" />
              ) : (
                <FiMoon className="w-5 h-5" />
              )}
              <span className="hidden md:inline">
                {isDarkMode ? t("common.lightMode") : t("common.darkMode")}
              </span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition backdrop-blur-sm dark:bg-gray-800/50 dark:hover:bg-gray-700/50"
            >
              <FiGlobe className="w-5 h-5" />
              <span>{currentLanguage === "en" ? "አማ" : "EN"}</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8 hidden lg:block">
            <form onSubmit={handleSearch} className="relative">
              <div className="flex">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={t("common.searchProperties")}
                    className="w-full px-4 py-3 pl-12 pr-4 text-sm border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 rounded-l-full focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent dark:border-gray-600/30 dark:bg-gray-800/50 dark:placeholder-gray-300"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/80 dark:text-gray-300">
                    <FiSearch className="w-5 h-5" />
                  </div>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="bg-white text-[#FF4747] px-6 py-3 rounded-r-full font-medium hover:bg-gray-100 transition flex items-center space-x-2 dark:bg-gray-800 dark:text-orange-400 dark:hover:bg-gray-700"
                >
                  <FiSearch className="w-4 h-4" />
                  <span>{t("common.search")}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Messages - Only show badge if authenticated */}
            {isAuthenticated && unreadCount > 0 && (
              <div className="relative hidden md:block" ref={messagesRef}>
                <button
                  onClick={() => setShowMessages(!showMessages)}
                  className="relative p-2 text-white hover:bg-white/20 rounded-full transition dark:hover:bg-gray-700/50"
                >
                  <FiMessageSquare className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 bg-white text-[#FF4747] text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold dark:bg-gray-800 dark:text-orange-400">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                </button>

                {showMessages && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                          {t("communication.messages")}
                        </h3>
                        <button
                          onClick={handleViewAllMessages}
                          className="text-[#FF4747] text-sm hover:text-[#ff3333] font-medium flex items-center space-x-1 dark:text-orange-400 dark:hover:text-orange-300"
                        >
                          <span>{t("common.viewAll")}</span>
                          <FiChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {!conversations || conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          {t("communication.noMessages")}
                        </div>
                      ) : (
                        conversations.slice(0, 5).map((conversation, index) => (
                          <div
                            key={conversation?.user?._id || `conv-${index}`}
                            onClick={() => handleMessageClick(conversation)}
                            className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition dark:border-gray-700 dark:hover:bg-gray-700"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#FF4747] to-orange-500 rounded-full flex items-center justify-center text-white font-semibold dark:from-orange-600 dark:to-orange-700">
                                {getUserDisplayName().charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <p className="font-medium text-gray-900 truncate dark:text-gray-200">
                                    {getConversationUserName(conversation)}
                                  </p>
                                  {conversation?.unreadCount > 0 && (
                                    <span className="bg-[#FF4747] text-white text-xs rounded-full px-2 py-1 min-w-6 text-center dark:bg-orange-600">
                                      {conversation.unreadCount > 99
                                        ? "99+"
                                        : conversation.unreadCount}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                                  {conversation?.lastMessage?.content ||
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
            )}

            {/* Dark Mode Toggle for Mobile/Tablet */}
            <button
              onClick={toggleTheme}
              className="hidden md:block lg:hidden p-2 text-white hover:bg-white/20 rounded-full transition dark:hover:bg-gray-700/50"
              title={t("common.toggleDarkMode")}
            >
              {isDarkMode ? (
                <FiSun className="w-5 h-5" />
              ) : (
                <FiMoon className="w-5 h-5" />
              )}
            </button>

            {/* User Profile Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 hover:bg-white/20 rounded-lg transition text-white dark:hover:bg-gray-700/50"
              >
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30 dark:bg-gray-800/50 dark:border-gray-600/50">
                  {isAuthenticated ? (
                    <span className="font-bold text-lg">
                      {user?.fname?.charAt(0) || "U"}
                    </span>
                  ) : (
                    <FiUser className="w-5 h-5" />
                  )}
                </div>
                {isAuthenticated && (
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs opacity-80">
                      {t(`users.${user?.role}`)}
                    </p>
                  </div>
                )}
                <FiChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                  {isAuthenticated ? (
                    <>
                      {/* User Info */}
                      <div className="p-4 bg-gradient-to-r from-[#FF4747]/10 to-orange-500/10 border-b dark:from-orange-600/20 dark:to-orange-700/20 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#FF4747] to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg dark:from-orange-600 dark:to-orange-700">
                            {user?.fname?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate dark:text-gray-200">
                              {user?.fname} {user?.lname}
                            </p>
                            <p className="text-sm text-gray-600 truncate dark:text-gray-400">
                              {user?.email}
                            </p>
                            <p className="text-xs text-gray-500 capitalize mt-1 dark:text-gray-500">
                              {t(`users.${user?.role}`)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        {userMenuItems.map((item, index) =>
                          item.isLogout ? (
                            <button
                              key={item.name}
                              onClick={item.onClick}
                              className="w-full flex items-center justify-between px-4 py-3 text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 dark:text-red-400 dark:hover:bg-red-900/20 dark:border-gray-700"
                            >
                              <div className="flex items-center space-x-3">
                                {item.icon}
                                <span className="font-medium">{item.name}</span>
                              </div>
                            </button>
                          ) : (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={item.onClick}
                              className="flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <div className="flex items-center space-x-3">
                                {item.icon}
                                <span className="font-medium">{item.name}</span>
                              </div>
                              {item.badge > 0 && (
                                <span className="bg-[#FF4747] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center dark:bg-orange-600">
                                  {item.badge > 99 ? "99+" : item.badge}
                                </span>
                              )}
                            </Link>
                          )
                        )}
                      </div>

                      {/* Dark Mode Toggle in Dropdown */}
                      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={toggleTheme}
                          className="w-full flex items-center justify-between px-2 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center space-x-3">
                            {isDarkMode ? (
                              <FiSun className="w-5 h-5" />
                            ) : (
                              <FiMoon className="w-5 h-5" />
                            )}
                            <span>
                              {isDarkMode
                                ? t("common.lightMode")
                                : t("common.darkMode")}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {isDarkMode
                              ? t("common.toggleDarkMode")
                              : t("common.toggleDarkMode")}
                          </span>
                        </button>
                      </div>

                      {/* Language Switcher in Dropdown */}
                      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={toggleLanguage}
                          className="w-full flex items-center justify-between px-2 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center space-x-3">
                            <FiGlobe className="w-5 h-5" />
                            <span>
                              {currentLanguage === "en" ? "አማርኛ" : "English"}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {currentLanguage === "en" ? "Switch" : "ቀይር"}
                          </span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4">
                      <p className="text-gray-600 mb-4 dark:text-gray-400">
                        {t("auth.loginPrompt")}
                      </p>
                      <div className="space-y-2">
                        <Link
                          to="/login"
                          onClick={() => setShowUserMenu(false)}
                          className="block w-full text-center bg-[#FF4747] text-white py-2 rounded-lg font-medium hover:bg-[#ff3333] transition dark:bg-orange-600 dark:hover:bg-orange-700"
                        >
                          {t("auth.login")}
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setShowUserMenu(false)}
                          className="block w-full text-center border border-[#FF4747] text-[#FF4747] py-2 rounded-lg font-medium hover:bg-[#FF4747]/10 transition dark:border-orange-600 dark:text-orange-600 dark:hover:bg-orange-600/10"
                        >
                          {t("auth.register")}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden text-white hover:bg-white/20 p-2 rounded-lg transition dark:hover:bg-gray-700/50"
            >
              {isMenuOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden pb-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder={t("common.searchProperties")}
              className="w-full px-4 py-3 pl-12 pr-4 text-sm border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent dark:border-gray-600/30 dark:bg-gray-800/50 dark:placeholder-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/80 dark:text-gray-300">
              <FiSearch className="w-5 h-5" />
            </div>
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white text-[#FF4747] p-2 rounded-full dark:bg-gray-800 dark:text-orange-400"
            >
              <FiSearch className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Categories Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {propertyCategories.map((category, index) => (
                <Link
                  key={index}
                  to={category.href}
                  className="flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition dark:bg-gray-700 dark:hover:bg-gray-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-2xl mb-2">{category.icon}</span>
                  <span className="text-sm text-center text-gray-700 dark:text-gray-300">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>

            {/* Navigation Items for Mobile */}
            <div className="space-y-2 mb-6">
              {isClientUser && (
                <Link
                  to="/client/create-property"
                  className="flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-[#FF4747] to-orange-500 text-white rounded-lg font-medium hover:shadow-lg transition dark:from-orange-600 dark:to-orange-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiPlusCircle className="w-5 h-5" />
                  <span>{t("properties.postProperty")}</span>
                </Link>
              )}

              {isAuthenticated && (
                <Link
                  to={getOrdersLink()}
                  className="flex items-center justify-center space-x-2 p-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiPackage className="w-5 h-5" />
                  <span>{t("navigation.orders")}</span>
                </Link>
              )}
            </div>

            {/* Dark Mode Toggle for Mobile */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-center space-x-2 p-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {isDarkMode ? (
                <FiSun className="w-5 h-5" />
              ) : (
                <FiMoon className="w-5 h-5" />
              )}
              <span>
                {isDarkMode ? t("common.lightMode") : t("common.darkMode")}
              </span>
            </button>

            {/* Auth Links */}
            <div className="space-y-2 mt-4">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    className="flex items-center justify-center space-x-2 p-3 bg-[#FF4747] text-white rounded-lg font-medium hover:bg-[#ff3333] transition dark:bg-orange-600 dark:hover:bg-orange-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FiUser className="w-5 h-5" />
                    <span>{t("auth.login")}</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center justify-center space-x-2 p-3 border border-[#FF4747] text-[#FF4747] rounded-lg font-medium hover:bg-[#FF4747]/10 transition dark:border-orange-600 dark:text-orange-600 dark:hover:bg-orange-600/10"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>{t("auth.register")}</span>
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center space-x-2 p-3 border border-red-600 text-red-600 rounded-lg font-medium hover:bg-red-50 transition dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <FiLogOut className="w-5 h-5" />
                  <span>{t("auth.logout")}</span>
                </button>
              )}

              {/* Language Switcher Mobile */}
              <button
                onClick={toggleLanguage}
                className="w-full flex items-center justify-center space-x-2 p-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <FiGlobe className="w-5 h-5" />
                <span>{currentLanguage === "en" ? "አማርኛ" : "English"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
