import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "react-i18next";

const UserSearch = ({ onUserSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const { user } = useAuth();
  const { t } = useTranslation();

  // Load all available users when component mounts
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        const response = await axios.get("/api/users/available");
        console.log("Available users loaded:", response.data);
        setAllUsers(response.data.users || []);
      } catch (error) {
        console.error("Failed to load users:", error);
        setAllUsers([]);
      }
    };

    loadAllUsers();
  }, []);

  const searchUsers = async (query) => {
    if (!query || query.trim().length < 1) {
      setSearchResults([]);
      setShowResults(false);
      setError(null);
      return;
    }

    setLoading(true);
    setShowResults(true);
    setError(null);

    try {
      // Use the available users we already loaded and filter them locally
      const filteredUsers = allUsers.filter((u) => {
        const searchLower = query.toLowerCase();
        return (
          u.fname?.toLowerCase().includes(searchLower) ||
          u.lname?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower) ||
          `${u.fname} ${u.lname}`.toLowerCase().includes(searchLower)
        );
      });

      console.log("Local search results:", {
        query,
        allUsersCount: allUsers.length,
        filteredCount: filteredUsers.length,
        filteredUsers: filteredUsers.map(
          (u) => `${u.fname} ${u.lname} (${u.role})`
        ),
      });

      setSearchResults(filteredUsers);

      if (filteredUsers.length === 0 && allUsers.length > 0) {
        setError(t("communication.noUsersFoundForQuery", { query }));
      } else if (filteredUsers.length === 0 && allUsers.length === 0) {
        setError(t("communication.noUsersAvailable"));
      }
    } catch (error) {
      console.error("Search failed:", error);
      setError(t("communication.searchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (selectedUser) => {
    console.log("User selected:", selectedUser);
    onUserSelect(selectedUser);
    setSearchTerm("");
    setShowResults(false);
    setSearchResults([]);
    setError(null);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "broker":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "client":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCommunicationHint = () => {
    if (!user) return t("communication.searchUsers");

    switch (user.role) {
      case "client":
        return t("communication.clientHint");
      case "broker":
        return t("communication.brokerHint");
      case "admin":
        return t("communication.adminHint");
      default:
        return t("communication.searchUsers");
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim().length >= 1) {
      searchUsers(value);
    } else {
      setSearchResults([]);
      setShowResults(false);
      setError(null);
    }
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 1 && allUsers.length > 0) {
      setShowResults(true);
      // Show all available users when focusing on empty search
      if (!searchTerm.trim()) {
        setSearchResults(allUsers);
      }
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
    setError(null);
  };

  // Show all available users when clicking search (empty search)
  const handleSearchClick = () => {
    if (allUsers.length > 0 && !searchTerm.trim()) {
      setSearchResults(allUsers);
      setShowResults(true);
    }
  };

  return (
    <div className="relative mb-4">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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

        <input
          type="text"
          placeholder={t("communication.searchUsers")}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onClick={handleSearchClick}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
        )}
      </div>

      {/* Communication Hint */}
      <div className="mt-1 text-xs text-gray-500 flex items-center space-x-1">
        <svg
          className="w-3 h-3 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{getCommunicationHint()}</span>
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-20">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-1 text-sm">
                {t("communication.searchingUsers")}
              </p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-gray-500">
              <div className="flex flex-col items-center space-y-2">
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
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-gray-600">{error}</p>
                {allUsers.length === 0 && (
                  <p className="text-xs text-gray-500">
                    {t("communication.noUsersBasedOnRules")}
                  </p>
                )}
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="flex flex-col items-center space-y-2">
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
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm">{t("communication.noUsersFound")}</p>
                <p className="text-xs">{t("communication.tryDifferentTerm")}</p>
                <div className="text-xs text-gray-400 mt-2">
                  <p>
                    {t("communication.availableUsers")}: {allUsers.length}
                  </p>
                  <p>
                    {t("navigation.role")}: {user?.role}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="p-2 bg-gray-50 border-b border-gray-200">
                <p className="text-xs text-gray-600">
                  {searchTerm
                    ? t("communication.foundUsers", {
                        count: searchResults.length,
                        query: searchTerm,
                        plural: searchResults.length !== 1 ? "s" : "",
                      })
                    : t("communication.allAvailableUsers", {
                        count: searchResults.length,
                      })}
                </p>
              </div>
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleUserSelect(user)}
                  className="flex items-center space-x-3 p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-colors"
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.fname?.charAt(0)}
                      {user.lname?.charAt(0)}
                    </div>
                    {user.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {user.fname} {user.lname}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border capitalize ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {t(`navigation.${user.role}`)}
                      </span>
                      {user.role === "broker" && !user.isApproved && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                          {t("common.pending")}
                        </span>
                      )}
                      {user.isOnline ? (
                        <span className="text-xs text-green-600">
                          {t("communication.online")}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {t("communication.offline")}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-1">
                      {user.email}
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* Overlay to close results when clicking outside */}
      {showResults && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowResults(false);
            setError(null);
          }}
        ></div>
      )}
    </div>
  );
};

export default UserSearch;
