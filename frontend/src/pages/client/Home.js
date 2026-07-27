import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "../../api/axios";

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPropertyType, setSelectedPropertyType] = useState("all");
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    name: "",
    minPrice: "",
    maxPrice: "",
    purpose: "", // sell/rent
  });
  const [stats, setStats] = useState({
    totalHomes: "0",
    totalCars: "0",
    totalElectronics: "0",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, selectedPropertyType, searchQuery, advancedFilters]);

  const fetchProperties = async () => {
    try {
      const response = await axios.get("/api/property?limit=100");
      const propertiesData = response.data.properties || [];

      // ✅ Filter to show ONLY Available properties on home page
      const availableProperties = propertiesData.filter(
        (p) => p.status === "Available",
      );
      setProperties(availableProperties);

      // Calculate stats based on available properties only
      const homes = availableProperties.filter(
        (p) => p.propertyType === "Home",
      ).length;
      const cars = availableProperties.filter(
        (p) => p.propertyType === "Car",
      ).length;
      const electronics = availableProperties.filter(
        (p) => p.propertyType === "Electronics",
      ).length;

      setStats({
        totalHomes: homes.toString(),
        totalCars: cars.toString(),
        totalElectronics: electronics.toString(),
      });
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = [...properties];

    // Filter by property type
    if (selectedPropertyType !== "all") {
      filtered = filtered.filter(
        (p) => p.propertyType === selectedPropertyType,
      );
    }

    // Filter by basic search query (title, description, location)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.city?.toLowerCase().includes(query),
      );
    }

    // Advanced filters
    if (advancedFilters.name.trim()) {
      const nameQuery = advancedFilters.name.toLowerCase();
      filtered = filtered.filter((p) =>
        p.title?.toLowerCase().includes(nameQuery),
      );
    }

    // Price range filter
    if (advancedFilters.minPrice) {
      const minPrice = parseFloat(advancedFilters.minPrice);
      filtered = filtered.filter((p) => p.price >= minPrice);
    }

    if (advancedFilters.maxPrice) {
      const maxPrice = parseFloat(advancedFilters.maxPrice);
      filtered = filtered.filter((p) => p.price <= maxPrice);
    }

    // Purpose filter (sell/rent)
    if (advancedFilters.purpose) {
      filtered = filtered.filter(
        (p) =>
          p.purpose?.toLowerCase() === advancedFilters.purpose.toLowerCase(),
      );
    }

    setFilteredProperties(filtered);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    filterProperties();
  };

  const handleAdvancedFilterChange = (field, value) => {
    setAdvancedFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setAdvancedFilters({
      name: "",
      minPrice: "",
      maxPrice: "",
      purpose: "",
    });
    setSelectedPropertyType("all");
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const propertyTypes = [
    {
      id: "all",
      name: "All Categories",
      icon: "🏪",
      count: properties.length,
      color: "bg-gray-50 hover:bg-gray-100 border-gray-200",
    },
    {
      id: "Car",
      name: "Vehicles",
      icon: "🚗",
      count: parseInt(stats.totalCars),
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    },
    {
      id: "Home",
      name: "Home",
      icon: "🏠",
      count: parseInt(stats.totalHomes),
      color: "bg-green-50 hover:bg-green-100 border-green-200",
    },
    {
      id: "Electronics",
      name: "Electronics",
      icon: "💻",
      count: parseInt(stats.totalElectronics),
      color: "bg-purple-50 hover:bg-purple-100 border-purple-200",
    },
  ];

  const PropertyCard = ({ property, index }) => (
    <div
      className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:scale-105 hover:-rotate-1 animate-slide-up"
      style={{
        animationDelay: `${index * 0.15}s`,
        animationFillMode: "both",
      }}
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Floating Particles Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full animate-float opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-8 left-6 w-1 h-1 bg-purple-400 rounded-full animate-float-delayed opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute bottom-6 right-8 w-1.5 h-1.5 bg-pink-400 rounded-full animate-float-slow opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      <div className="relative z-10 h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-t-2xl">
        {property.images && property.images.length > 0 ? (
          <div className="relative w-full h-full">
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-2"
            />
            {/* Image Overlay with Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Animated Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50 relative overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-8 h-8 border-2 border-blue-300 rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-2 border-purple-300 rounded-full animate-pulse delay-300"></div>
              <div className="absolute top-1/2 left-1/2 w-4 h-4 border-2 border-pink-300 rounded-full animate-pulse delay-700"></div>
            </div>

            <div className="relative z-10 text-center">
              <span className="text-6xl animate-bounce-slow filter drop-shadow-lg">
                {property.propertyType === "Home"
                  ? "🏠"
                  : property.propertyType === "Car"
                    ? "🚗"
                    : "💻"}
              </span>
              <div className="mt-2 text-sm text-gray-500 font-medium">
                {property.propertyType}
              </div>
            </div>
          </div>
        )}

        {/* Floating Badges with Animation */}
        <div className="absolute top-4 left-4 transform transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3">
          <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-blue-700 rounded-full text-xs font-bold shadow-lg border border-blue-100 animate-pulse-slow">
            {property.propertyType}
          </span>
        </div>

        <div className="absolute top-4 right-4 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
          <span
            className={`px-3 py-1.5 backdrop-blur-sm rounded-full text-xs font-bold shadow-lg border transition-all duration-300 ${
              property.status === "Available"
                ? "bg-green-100/90 text-green-700 border-green-200 animate-pulse-green"
                : "bg-yellow-100/90 text-yellow-700 border-yellow-200 animate-pulse-yellow"
            }`}
          >
            {property.status}
          </span>
        </div>

        {/* Magic Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 via-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
          <div className="text-white text-sm font-bold bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            ✨ Click to explore
          </div>
        </div>
      </div>

      <div className="relative z-10 p-6 bg-white">
        {/* Animated Title */}
        <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-lg group-hover:text-blue-600 transition-colors duration-300 transform group-hover:translate-x-1">
          {property.title}
        </h3>

        {/* Description with Fade Effect */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
          {property.description}
        </p>

        {/* Price and Location with Animation */}
        <div className="flex items-center justify-between mb-4 transform group-hover:translate-x-1 transition-transform duration-300">
          <div className="relative">
            <span className="text-xl font-bold text-green-600 animate-pulse-price">
              {formatPrice(property.price)}
            </span>
            {/* Price Highlight Effect */}
            <div className="absolute inset-0 bg-green-100 rounded-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10 scale-110"></div>
          </div>

          <div className="flex items-center text-gray-500 group-hover:text-blue-500 transition-colors duration-300">
            <span className="animate-bounce-gentle mr-1 text-base">📍</span>
            <span className="text-sm font-medium">{property.city}</span>
          </div>
        </div>

        {/* Purpose Badge */}
        <div className="mb-4">
          <span className="inline-block bg-gradient-to-r from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-purple-100 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 group-hover:text-blue-700 transition-all duration-300 transform group-hover:scale-105">
            <span className="capitalize">{property.purpose}</span>
          </span>
        </div>

        {/* Animated CTA Button */}
        <Link
          to={`/property/${property._id}`}
          className="block w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white text-center py-3.5 px-6 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-xl group/button"
        >
          {/* Button Background Animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover/button:translate-x-full transition-transform duration-700"></div>

          <span className="relative z-10 flex items-center justify-center space-x-2">
            <span>View Details</span>
            <svg
              className="w-5 h-5 transition-transform duration-300 group-hover/button:translate-x-1 group-hover/button:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </span>

          {/* Button Glow Effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover/button:opacity-20 transition-opacity duration-300 blur-xl"></div>
        </Link>
      </div>

      {/* Card Border Glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500 -z-10 blur-xl"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Expressive Text */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 text-white py-16 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white rounded-full animate-pulse delay-2000"></div>
          <div className="absolute bottom-32 right-1/3 w-14 h-14 bg-white rounded-full animate-pulse delay-500"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="mb-8">
            <img
              src="/m4sbrokerlogo.png"
              alt="M4S Broker Logo"
              className="h-16 w-auto mx-auto mb-6 drop-shadow-lg"
            />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Your Gateway to
            <span className="block text-yellow-300">
              Cars, Homes & Electronics
            </span>
          </h1>

          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-4xl mx-auto leading-relaxed">
            Discover amazing deals across Ethiopia's most trusted marketplace.
            Whether you're buying your dream car, finding the perfect home, or
            upgrading your tech -
            <span className="font-semibold text-white">
              {" "}
              we've got you covered!
            </span>
          </p>

          <div className="text-lg text-blue-100 mb-8">
            <p className="mb-2">
              ✨ <strong>Trusted by thousands</strong> across Ethiopia
            </p>
            <p className="mb-2">
              🔒 <strong>Secure transactions</strong> guaranteed
            </p>
            <p>
              🎯 <strong>Find exactly</strong> what you're looking for
            </p>
          </div>

          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-8 py-4 rounded-full font-bold text-lg transition duration-300 transform hover:scale-105 shadow-lg"
              >
                🚀 Start Exploring Now
              </Link>
              <Link
                to="/login"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-8 py-4 rounded-full font-bold text-lg transition duration-300 border border-white/30"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Search Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 text-white py-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-5 left-16 w-12 h-12 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-16 right-24 w-8 h-8 bg-white rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-10 left-1/3 w-10 h-10 bg-white rounded-full animate-pulse delay-2000"></div>
          <div className="absolute bottom-5 right-1/4 w-6 h-6 bg-white rounded-full animate-pulse delay-500"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
            What are you looking for?
          </h2>

          <form onSubmit={handleSearch} className="max-w-4xl mx-auto space-y-4">
            {/* Basic Search */}
            <div className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, location..."
                className="w-full px-4 py-3 rounded-l-lg text-gray-700 border-0 focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="button"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="px-4 py-3 bg-purple-700 hover:bg-purple-800 text-white transition duration-200 border-l border-purple-600"
              >
                {showAdvancedSearch ? "Simple" : "Advanced"}
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-white text-purple-600 rounded-r-lg hover:bg-gray-100 transition duration-200"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>

            {/* Advanced Search Filters */}
            {showAdvancedSearch && (
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold mb-4">Advanced Search</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Property Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Property Name
                    </label>
                    <input
                      type="text"
                      value={advancedFilters.name}
                      onChange={(e) =>
                        handleAdvancedFilterChange("name", e.target.value)
                      }
                      placeholder="Search by name..."
                      className="w-full px-3 py-2 rounded-lg text-gray-700 border-0 focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  {/* Min Price */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Min Price (ETB)
                    </label>
                    <input
                      type="number"
                      value={advancedFilters.minPrice}
                      onChange={(e) =>
                        handleAdvancedFilterChange("minPrice", e.target.value)
                      }
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 rounded-lg text-gray-700 border-0 focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  {/* Max Price */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max Price (ETB)
                    </label>
                    <input
                      type="number"
                      value={advancedFilters.maxPrice}
                      onChange={(e) =>
                        handleAdvancedFilterChange("maxPrice", e.target.value)
                      }
                      placeholder="1000000"
                      min="0"
                      className="w-full px-3 py-2 rounded-lg text-gray-700 border-0 focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Purpose
                    </label>
                    <select
                      value={advancedFilters.purpose}
                      onChange={(e) =>
                        handleAdvancedFilterChange("purpose", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg text-gray-700 border-0 focus:ring-2 focus:ring-blue-300"
                    >
                      <option value="">All (Sell & Rent)</option>
                      <option value="Sell">For Sale</option>
                      <option value="Rent">For Rent</option>
                    </select>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-white border-opacity-20">
                  <div className="text-sm">
                    {(searchQuery ||
                      advancedFilters.name ||
                      advancedFilters.minPrice ||
                      advancedFilters.maxPrice ||
                      advancedFilters.purpose) && (
                      <span className="text-white text-opacity-90">
                        Active filters:{" "}
                        {[
                          searchQuery && "General search",
                          advancedFilters.name && "Name",
                          advancedFilters.minPrice &&
                            `Min: ${formatPrice(advancedFilters.minPrice)}`,
                          advancedFilters.maxPrice &&
                            `Max: ${formatPrice(advancedFilters.maxPrice)}`,
                          advancedFilters.purpose &&
                            `Purpose: ${advancedFilters.purpose}`,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Property Types */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Categories
              </h2>
              <div className="space-y-2">
                {propertyTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedPropertyType(type.id)}
                    className={`w-full p-4 rounded-lg border transition duration-200 flex items-center space-x-3 ${
                      selectedPropertyType === type.id
                        ? `${type.color} border-current`
                        : "bg-white hover:bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="text-2xl">{type.icon}</div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900">
                        {type.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {loading ? "..." : `${type.count} ads`}
                      </p>
                    </div>
                    <div>
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions for Authenticated Users */}
            {isAuthenticated && (
              <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Link
                    to={
                      user?.role === "admin"
                        ? "/admin"
                        : user?.role === "broker"
                          ? "/broker/dashboard"
                          : "/client"
                    }
                    className="block w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📊</span>
                      <span className="font-medium text-gray-900">
                        Dashboard
                      </span>
                    </div>
                  </Link>

                  {user?.role === "client" && (
                    <Link
                      to="/client/create-property"
                      className="block w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">➕</span>
                        <span className="font-medium text-gray-900">
                          Post Ad
                        </span>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Properties Display */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedPropertyType === "all"
                  ? "All Properties"
                  : `${propertyTypes.find((t) => t.id === selectedPropertyType)?.name} Properties`}
              </h2>
              <span className="text-sm text-gray-600">
                {loading
                  ? "Loading..."
                  : `${filteredProperties.length} results`}
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProperties.map((property, index) => (
                  <PropertyCard
                    key={property._id}
                    property={property}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No properties found
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "No properties available in this category"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Call to Action for Non-Authenticated Users */}
      {!isAuthenticated && (
        <section className="py-12 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-8 left-20 w-16 h-16 bg-white rounded-full animate-pulse"></div>
            <div className="absolute bottom-8 right-16 w-12 h-12 bg-white rounded-full animate-pulse delay-1000"></div>
          </div>

          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-2xl font-bold mb-4">
              Join M4S Brokerage Today
            </h2>
            <p className="text-blue-100 mb-6">
              Start buying and selling with Ethiopia's trusted marketplace
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-8 py-3 rounded-lg font-semibold transition duration-200"
              >
                Sign Up Free
              </Link>
              <Link
                to="/login"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 px-8 py-3 rounded-lg font-semibold transition duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slide-up {
          0% {
            opacity: 0;
            transform: translateY(60px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(180deg);
          }
        }

        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(-180deg);
          }
        }

        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-6px) rotate(90deg);
          }
        }

        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.05);
          }
        }

        @keyframes bounce-gentle {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }

        @keyframes pulse-green {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
          }
        }

        @keyframes pulse-yellow {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(234, 179, 8, 0);
          }
        }

        @keyframes pulse-price {
          0%,
          100% {
            transform: scale(1);
            text-shadow: 0 0 0 rgba(34, 197, 94, 0);
          }
          50% {
            transform: scale(1.02);
            text-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 4s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 5s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-pulse-green {
          animation: pulse-green 2s ease-in-out infinite;
        }

        .animate-pulse-yellow {
          animation: pulse-yellow 2s ease-in-out infinite;
        }

        .animate-pulse-price {
          animation: pulse-price 2s ease-in-out infinite;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Hover Effects */
        .group:hover .animate-bounce-slow {
          animation-duration: 1s;
        }

        .group:hover .animate-pulse-price {
          animation-duration: 1s;
        }

        /* Responsive Animations */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
