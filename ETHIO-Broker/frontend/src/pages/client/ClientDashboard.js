

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "../../api/axios";
import ManualVerificationDialog from "../../components/ManualVerificationDialog";
import { useTranslation } from "react-i18next";

const ClientDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [myProperties, setMyProperties] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [myEarnings, setMyEarnings] = useState([]);
  const [earningsStats, setEarningsStats] = useState({
    totalEarnings: 0,
    propertiesSoldRented: 0,
    commissionPaid: 0,
    netEarnings: 0,
  });
  const [stats, setStats] = useState({
    totalProperties: 0,
    availableProperties: 0,
    myPropertiesCount: 0,
    orderedProperties: 0,
    earningsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("browse");
  const [searchTerm, setSearchTerm] = useState("");
  const [fetchError, setFetchError] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    name: "",
    location: "",
    purpose: "",
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showManualVerification, setShowManualVerification] = useState(false);
  const [selectedPropertyForVerification, setSelectedPropertyForVerification] =
    useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Log user object for debugging
  useEffect(() => {
    console.log("👤 User object:", user);
    console.log("👤 User ID:", user?._id || user?.id);
  }, [user]);

  // Fetch all counts on initial load
  useEffect(() => {
    const userId = user?._id || user?.id;
    if (user && userId) {
      console.log("📊 Initial load - fetching all counts");
      fetchAllCounts();
    }
  }, [user?._id, user?.id]);

  useEffect(() => {
    const userId = user?._id || user?.id;
    console.log(
      `🔄 useEffect triggered - activeTab: ${activeTab}, userId: ${userId}`,
    );

    if (user && userId) {
      console.log("✅ User and userId available, fetching data...");
      fetchDashboardData();
    } else {
      console.log("⏳ Waiting for user to load...", { user, userId });
    }
  }, [activeTab, user?._id, user?.id]);

  // Fetch counts for all tabs (for display in tab badges and stats cards)
  const fetchAllCounts = async () => {
    const userId = user?._id || user?.id;
    if (!user || !userId) {
      console.log("⏳ User not loaded, skipping count fetch");
      return;
    }

    try {
      console.log("🔢 Fetching all counts...");

      // Fetch counts in parallel
      const [
        myPropsResponse,
        ordersResponse,
        earningsResponse,
        availablePropsResponse,
      ] = await Promise.all([
        axios
          .get("/api/property/my-properties")
          .catch(() => ({ data: { properties: [] } })),
        axios
          .get("/api/property/user/orders")
          .catch(() => ({ data: { properties: [] } })),
        axios
          .get("/api/payments/owner/earnings")
          .catch(() => ({ data: { data: { properties: [] } } })),
        axios
          .get("/api/property?status=Available")
          .catch(() => ({ data: { properties: [] } })),
      ]);

      // Process my properties count
      const myPropsData =
        myPropsResponse.data.properties || myPropsResponse.data;
      const myPropsCount = Array.isArray(myPropsData) ? myPropsData.length : 0;

      // Process orders count
      const ordersData =
        ordersResponse.data.data?.properties ||
        ordersResponse.data.properties ||
        ordersResponse.data.data ||
        ordersResponse.data;
      const allOrders = Array.isArray(ordersData) ? ordersData : [];
      const pendingOrders = allOrders.filter(
        (property) =>
          (property.status === "Ordered" ||
            property.status === "Payment_Pending") &&
          property.paymentStatus !== "Completed",
      );
      const ordersCount = pendingOrders.length;

      // Process earnings count
      const earningsData = earningsResponse.data.data;
      const earningsProperties = earningsData?.properties || [];
      const earningsCount = Array.isArray(earningsProperties)
        ? earningsProperties.length
        : 0;

      // Process available properties count
      const availablePropsData =
        availablePropsResponse.data.properties ||
        availablePropsResponse.data.data ||
        availablePropsResponse.data;
      let availableCount = 0;

      if (Array.isArray(availablePropsData)) {
        // If API supports status filtering, use the result directly
        availableCount = availablePropsData.length;
      } else {
        // Fallback: fetch all properties and filter client-side
        try {
          const allPropsResponse = await axios.get("/api/property?limit=100");
          const allPropsData =
            allPropsResponse.data.properties ||
            allPropsResponse.data.data ||
            allPropsResponse.data;
          if (Array.isArray(allPropsData)) {
            availableCount = allPropsData.filter(
              (property) => property.status === "Available",
            ).length;
          }
        } catch (fallbackError) {
          console.log("⚠️ Could not fetch available properties count");
        }
      }

      // Update stats
      setStats({
        totalProperties: myPropsCount,
        availableProperties: availableCount,
        myPropertiesCount: myPropsCount,
        orderedProperties: ordersCount,
        earningsCount: earningsCount,
      });

      console.log("✅ All counts fetched:", {
        myProperties: myPropsCount,
        orders: ordersCount,
        earnings: earningsCount,
        available: availableCount,
      });
    } catch (error) {
      console.error("❌ Error fetching counts:", error);
    }
  };

  const fetchDashboardData = async () => {
    // Check multiple possible user ID fields
    const userId = user?._id || user?.id;

    console.log("🔍 fetchDashboardData called", {
      hasUser: !!user,
      userId,
      userKeys: user ? Object.keys(user) : [],
      activeTab,
    });

    if (!user) {
      console.log("⏳ User not loaded yet, skipping data fetch");
      setLoading(false);
      return;
    }

    if (!userId) {
      console.error("❌ User object exists but no ID found:", user);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);
      console.log(`📊 Fetching data for tab: ${activeTab}`);

      // Fetch data based on active tab only
      if (activeTab === "browse") {
        // Fetch available properties for browsing
        console.log("🔍 Fetching available properties...");
        try {
          // Try with status filter first
          let response = await axios.get(
            "/api/property?limit=20&status=Available",
          );
          let propertiesData =
            response.data.properties || response.data.data || response.data;

          // If the API doesn't support status filtering, fetch all and filter client-side
          if (!Array.isArray(propertiesData) || propertiesData.length === 0) {
            console.log(
              "🔄 Status filter not working, fetching all properties and filtering...",
            );
            response = await axios.get("/api/property?limit=50");
            propertiesData =
              response.data.properties || response.data.data || response.data;

            // Filter to only available properties
            if (Array.isArray(propertiesData)) {
              propertiesData = propertiesData.filter(
                (property) => property.status === "Available",
              );
            }
          }

          const availableProperties = Array.isArray(propertiesData)
            ? propertiesData.slice(0, 8)
            : [];
          setProperties(availableProperties);
          console.log(
            `✅ Fetched ${availableProperties.length} available properties`,
          );

          // Update stats with actual count from API
          try {
            const statsResponse = await axios.get(
              "/api/property?status=Available",
            );
            const allAvailableData =
              statsResponse.data.properties ||
              statsResponse.data.data ||
              statsResponse.data;
            const totalAvailable = Array.isArray(allAvailableData)
              ? allAvailableData.length
              : availableProperties.length;

            setStats((prev) => ({
              ...prev,
              availableProperties: totalAvailable,
            }));
          } catch (statsError) {
            console.log(
              "⚠️ Could not fetch total available count, using current batch",
            );
            setStats((prev) => ({
              ...prev,
              availableProperties: availableProperties.length,
            }));
          }
        } catch (error) {
          console.error("❌ Error fetching available properties:", error);
          setFetchError(
            `Failed to load available properties: ${error.response?.data?.message || error.message}`,
          );
          setProperties([]);
          setStats((prev) => ({
            ...prev,
            availableProperties: 0,
          }));
        }
      } else if (activeTab === "myProperties") {
        // Fetch user's properties
        console.log("🔍 Fetching user properties...");
        const response = await axios.get("/api/property/my-properties");
        const myPropertiesData = response.data.properties || response.data;
        const myProps = Array.isArray(myPropertiesData) ? myPropertiesData : [];
        setMyProperties(myProps);
        console.log(`✅ Fetched ${myProps.length} user properties`);

        // Update stats
        setStats((prev) => ({
          ...prev,
          myPropertiesCount: myProps.length,
          totalProperties: myProps.length,
        }));
      } else if (activeTab === "myOrders") {
        // Fetch user's orders (only pending orders)
        console.log("🔍 Fetching user orders...");
        try {
          const response = await axios.get("/api/property/user/orders");
          const ordersData =
            response.data.data?.properties ||
            response.data.properties ||
            response.data.data ||
            response.data;
          const allOrders = Array.isArray(ordersData) ? ordersData : [];

          // Filter to only pending orders
          const pendingOrders = allOrders.filter((property) => {
            return (
              property.status === "Ordered" ||
              property.status === "Payment_Pending"
            );
          });

          setMyOrders(pendingOrders);
          console.log(`✅ Fetched ${pendingOrders.length} pending orders`);

          // Update stats
          setStats((prev) => ({
            ...prev,
            orderedProperties: pendingOrders.length,
          }));
        } catch (error) {
          console.error("❌ Error fetching orders:", error);
          setMyOrders([]);
          setStats((prev) => ({
            ...prev,
            orderedProperties: 0,
          }));
        }
      } else if (activeTab === "myEarnings") {
        // Fetch user's earnings
        console.log("🔍 Fetching user earnings...");
        try {
          const response = await axios.get("/api/payments/owner/earnings");
          const earningsData = response.data.data;

          if (earningsData) {
            const soldRentedProperties = earningsData.properties || [];
            setMyEarnings(soldRentedProperties);

            const summary = earningsData.earningsSummary || {};
            const properties = earningsData.properties || [];

            let totalCommissionPaid = Math.round(
              summary.totalCommissionPaid || 0,
            );
            if (totalCommissionPaid === 0 && properties.length > 0) {
              totalCommissionPaid = Math.round(
                properties.reduce((total, prop) => {
                  return total + prop.price * 0.02;
                }, 0),
              );
            }

            // ✅ SIMPLIFIED: Use the straightforward earnings structure
            setEarningsStats({
              totalEarnings: Math.round(summary.totalEarnings || 0),
              propertiesSoldRented:
                summary.totalPropertiesSoldRented || properties.length,
              commissionPaid: Math.round(summary.totalCommissionPaid || 0),
              netEarnings: Math.round(summary.netEarnings || 0),
            });
            console.log(
              `✅ Fetched earnings for ${soldRentedProperties.length} properties`,
            );
          }
        } catch (error) {
          console.error("❌ Error fetching earnings:", error);
          setMyEarnings([]);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      console.error("❌ Error details:", error.response?.data || error.message);
    } finally {
      setLoading(false);
      console.log("✅ Loading complete");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();

    // Build search parameters
    const searchParams = new URLSearchParams();

    if (searchTerm.trim()) {
      searchParams.append("search", searchTerm.trim());
    }

    if (searchFilters.name.trim()) {
      searchParams.append("name", searchFilters.name.trim());
    }

    if (searchFilters.location.trim()) {
      searchParams.append("location", searchFilters.location.trim());
    }

    if (searchFilters.purpose) {
      searchParams.append("purpose", searchFilters.purpose);
    }

    // Navigate with search parameters
    const queryString = searchParams.toString();
    if (queryString) {
      navigate(`/properties?${queryString}`);
    } else {
      navigate("/properties");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSearchFilters({
      name: "",
      location: "",
      purpose: "",
    });
  };

  // Filter properties for browsing (Available only) with advanced filters
  const filteredProperties = properties.filter((property) => {
    // Must be available
    if (property.status !== "Available") return false;

    // Basic search term filter
    const matchesSearchTerm =
      !searchTerm.trim() ||
      property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city?.toLowerCase().includes(searchTerm.toLowerCase());

    // Name filter (property title)
    const matchesName =
      !searchFilters.name.trim() ||
      property.title?.toLowerCase().includes(searchFilters.name.toLowerCase());

    // Location filter
    const matchesLocation =
      !searchFilters.location.trim() ||
      property.city
        ?.toLowerCase()
        .includes(searchFilters.location.toLowerCase()) ||
      property.address
        ?.toLowerCase()
        .includes(searchFilters.location.toLowerCase());

    // Purpose filter (sell/rent)
    const matchesPurpose =
      !searchFilters.purpose ||
      property.purpose?.toLowerCase() === searchFilters.purpose.toLowerCase();

    return (
      matchesSearchTerm && matchesName && matchesLocation && matchesPurpose
    );
  });

  const formatPrice = (price) => {
    // Round to integer to avoid decimals
    const roundedPrice = Math.round(price || 0);
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(roundedPrice);
  };

  const getStatusBadgeColor = (status, paymentStatus, displayStatus) => {
    // Use displayStatus if available for better UX
    const statusToCheck = displayStatus || status;

    switch (statusToCheck) {
      case "Available":
        return "bg-green-100 text-green-800 border border-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "Payment Pending":
        return "bg-orange-100 text-orange-800 border border-orange-200";
      case "Processing":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "Completed":
        return "bg-green-100 text-green-800 border border-green-200";
      case "Ordered":
        if (paymentStatus === "Pending") {
          return "bg-blue-100 text-blue-800 border border-blue-200";
        } else {
          return "bg-purple-100 text-purple-800 border border-purple-200";
        }
      case "Sold":
      case "Rented":
        return "bg-gray-100 text-gray-800 border border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getStatusText = (property) => {
    // Use displayStatus from backend if available, otherwise fallback to original logic
    if (property.displayStatus) {
      return property.displayStatus;
    }

    // Fallback logic for backward compatibility
    if (
      property.status === "Ordered" &&
      property.orderInfo?.paymentStatus === "Pending"
    ) {
      return t("client.orderedPaymentPending");
    }
    return t(`client.${property.status.toLowerCase()}`, property.status);
  };

  const canOrderProperty = (property) => {
    if (!user) return false;
    if (property.owner?._id === user._id) return false;
    if (["admin", "broker"].includes(user?.role)) return false;

    return property.status === "Available";
  };

  const needsPaymentCompletion = (property) => {
    if (!user || !property) return false;

    const userId = user?._id || user?.id;
    if (!userId) return false;

    // Handle different ID formats (populated vs non-populated)
    let orderedById = property.orderInfo?.orderedBy;

    // If orderedBy is an object with _id, extract the _id
    if (orderedById && typeof orderedById === "object" && orderedById._id) {
      orderedById = orderedById._id;
    }

    // Convert both to strings for comparison
    const orderedByIdStr = orderedById ? orderedById.toString() : null;
    const userIdStr = userId.toString();

    const result =
      property.status === "Ordered" &&
      property.orderInfo?.paymentStatus === "Pending" &&
      orderedByIdStr === userIdStr;

    // Debug logging with null safety
    console.log(
      `🔍 Payment completion check for ${property?.title || "Unknown Property"}:`,
      {
        status: property?.status || "Unknown",
        paymentStatus: property?.orderInfo?.paymentStatus || "No payment info",
        orderedByIdOriginal: property?.orderInfo?.orderedBy || null,
        orderedByIdStr: orderedByIdStr || null,
        userIdStr: userIdStr || null,
        match: orderedByIdStr === userIdStr,
        needsPayment: result,
      },
    );

    return result;
  };

  const handleQuickOrder = async (propertyId, paymentFlow = "immediate", e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      console.log(
        `🛒 Placing order for property (${paymentFlow} payment):`,
        propertyId,
      );
      console.log("👤 Current user:", {
        id: user._id || user.id,
        email: user.email,
      });

      const response = await axios.post(`/api/property/${propertyId}/order`, {
        paymentMethod: "Chapa",
        paymentFlow: paymentFlow, // "immediate" or "later"
      });

      console.log("✅ Order response:", response.data);

      if (response.data.success) {
        // UPDATED ALERT MESSAGE WITH BROKER COMMUNICATION NOTE
        const alertMessage =
          paymentFlow === "later" || response.data.paymentFlow === "later"
            ? t("client.orderPlacedSuccess") +
              "\n\n" +
              t("client.brokerCommunicationNote")
            : response.data.message +
              "\n\n" +
              t("client.brokerCommunicationNote");

        if (response.data.paymentUrl && paymentFlow === "immediate") {
          alert(alertMessage);
          window.location.href = response.data.paymentUrl;
        } else if (
          paymentFlow === "later" ||
          response.data.paymentFlow === "later"
        ) {
          alert(alertMessage);
          // Switch to My Orders tab to show the new order
          setActiveTab("myOrders");
          fetchDashboardData();
        } else if (response.data.warning) {
          // Handle case where immediate payment failed but order succeeded
          alert(
            `${response.data.message}\n\n${response.data.warning}\n\n${t("client.brokerCommunicationNote")}`,
          );
          // Switch to My Orders tab to show the new order
          setActiveTab("myOrders");
          fetchDashboardData();
        } else {
          alert(alertMessage);
          // Switch to My Orders tab to show the new order
          setActiveTab("myOrders");
          fetchDashboardData();
        }
      } else {
        console.error("❌ Order failed:", response.data);
        alert(response.data.message || t("client.orderError"));
      }
    } catch (error) {
      console.error("❌ Order placement error:", error);

      // Enhanced error handling
      let errorMessage = t("client.orderError") + " ";

      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += t("common.tryAgainLater");
      }

      // Show specific error messages
      if (error.response?.status === 403) {
        errorMessage = t("client.notAuthorizedToOrder");
      } else if (error.response?.status === 404) {
        errorMessage = t("client.propertyNotFound");
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response.data.message || t("client.invalidOrderRequest");
      }

      alert(errorMessage);
    }
  };

  const handleCompletePayment = async (propertyId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      console.log(
        "🔄 Initializing payment completion for property:",
        propertyId,
      );
      console.log("👤 Current user:", {
        id: user._id || user.id,
        email: user.email,
      });

      // Initialize payment for the already ordered property
      const response = await axios.post("/api/payments/initialize", {
        propertyId: propertyId,
        paymentType: "full_payment",
      });

      console.log("✅ Payment initialization response:", response.data);

      if (response.data.success) {
        const paymentUrl = response.data.data?.paymentUrl;

        if (paymentUrl) {
          alert(t("client.brokerCommunicationNote"));
          // Store current tab to return to after payment
          localStorage.setItem("returnToTab", "myOrders");

          // Redirect to Chapa payment URL
          window.location.href = paymentUrl;
        } else {
          console.error("❌ No payment URL in response:", response.data);
          alert(t("client.paymentUrlNotAvailable"));
        }
      } else {
        console.error("❌ Payment initialization failed:", response.data);
        alert(response.data.message || t("client.paymentInitFailed"));
      }
    } catch (error) {
      console.error("❌ Payment initialization error:", error);

      // Enhanced error handling
      let errorMessage = t("client.paymentInitFailed") + " ";

      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += t("common.tryAgainLater");
      }

      // Show specific error messages
      if (error.response?.status === 403) {
        errorMessage = t("client.notAuthorizedToCompletePayment");
      } else if (error.response?.status === 404) {
        errorMessage = t("client.propertyNotFoundOrNotOrdered");
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response.data.message || t("client.invalidPaymentRequest");
      }

      alert(errorMessage);
    }
  };

  const handleManualVerification = (property, e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("🔍 Opening manual verification for property:", property.title);
    setSelectedPropertyForVerification(property);
    setShowManualVerification(true);
  };

  const handleVerificationSuccess = (verificationData) => {
    console.log("✅ Manual verification successful:", verificationData);

    // Show success message
    alert(
      t("manualVerification.success") +
        ` ${verificationData.property.title} ${t("common.isNow")} ${verificationData.property.status}.`,
    );

    // Refresh the dashboard data to show updated status
    fetchDashboardData();
    fetchAllCounts();

    // Close the dialog
    setShowManualVerification(false);
    setSelectedPropertyForVerification(null);
  };

  const PropertyCard = ({
    property,
    showStatus = false,
    showOrderInfo = false,
  }) => {
    const canOrder = canOrderProperty(property);

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
          {property.images && property.images.length > 0 ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-5xl">
                {property.propertyType === "Home"
                  ? "🏠"
                  : property.propertyType === "Car"
                    ? "🚗"
                    : "💻"}
              </span>
            </div>
          )}

          {/* Status badges only for My Properties and My Orders tabs */}
          {showStatus && (
            <div className="absolute top-3 left-3 flex flex-col space-y-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                  property.status,
                  property.orderInfo?.paymentStatus,
                  property.displayStatus,
                )}`}
              >
                {getStatusText(property)}
              </span>
              {property.approvedByAdmin && (
                <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
                  ✓ {t("common.approved")}
                </span>
              )}
            </div>
          )}

          {showOrderInfo && property.orderInfo && (
            <div className="absolute top-3 right-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  property.orderInfo?.paymentStatus === "Paid"
                    ? "bg-green-500 text-white"
                    : "bg-yellow-500 text-white"
                }`}
              >
                {property.orderInfo?.paymentStatus === "Paid"
                  ? `✓ ${t("common.paid")}`
                  : `⏳ ${t("client.paymentPending")}`}
              </span>
            </div>
          )}
        </div>

        <div className="p-5">
          {/* Property Name */}
          <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-lg leading-tight">
            {property.title}
          </h3>

          {/* Price */}
          <div className="mb-4">
            <span className="text-2xl font-bold text-rose-600">
              {formatPrice(property.price)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            <Link
              to={`/property/${property._id}`}
              className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg block"
            >
              {t("client.viewDetails")}
            </Link>
            {canOrder && (
              <>
                <button
                  onClick={(e) => handleQuickOrder(property._id, "later", e)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  🛒 {t("client.orderNow")}
                </button>
              </>
            )}
            {showOrderInfo && needsPaymentCompletion(property) && (
              <div className="space-y-2">
                <button
                  onClick={(e) => handleCompletePayment(property._id, e)}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg animate-pulse"
                >
                  💳 {t("client.completePayment")}
                </button>
                <button
                  onClick={(e) => handleManualVerification(property, e)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  ✅ {t("manualVerification.alreadyPaidVerify")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!user || !(user._id || user.id)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-rose-200 rounded-full animate-spin border-t-rose-600 mx-auto"></div>
          </div>
          <p className="mt-4 text-lg font-semibold text-slate-600">
            {t("common.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-100">
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() =>
            i18n.changeLanguage(i18n.language === "en" ? "am" : "en")
          }
          className="bg-white bg-opacity-80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-white border-opacity-20 hover:shadow-xl transition-all duration-300 flex items-center gap-2"
        >
          <span className="text-sm font-semibold">
            {i18n.language === "en" ? "🇬🇧 EN" : "🇪🇹 አማ"}
          </span>
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
              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
            />
          </svg>
        </button>
      </div>

      {/* Hero Section with Search */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-pink-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-rose-100 bg-clip-text text-transparent">
              {t("client.welcomeBack")}, {user?.fname}! 👋
            </h1>
            <p className="text-xl opacity-90">
              {t("client.discoverManageProperties")}
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white via-opacity-20 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 -mt-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group relative bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-white border-opacity-20 hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500 from-opacity-10 to-pink-500 to-opacity-10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl shadow-lg group-hover:shadow-rose-500 group-hover:shadow-opacity-25 transition-all duration-300">
                  <svg
                    className="w-8 h-8 text-white"
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
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-rose-600">
                    {t("common.total")}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">
                  {t("client.totalProperties")}
                </p>
                <p className="text-3xl font-bold text-slate-800 mb-2">
                  {stats.totalProperties}
                </p>
              </div>
            </div>
          </div>

          <div className="group relative bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-white border-opacity-20 hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 from-opacity-10 to-emerald-500 to-opacity-10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg group-hover:shadow-green-500 group-hover:shadow-opacity-25 transition-all duration-300">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-600">
                    {t("client.available")}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">
                  {t("client.availableNow")}
                </p>
                <p className="text-3xl font-bold text-slate-800 mb-2">
                  {stats.availableProperties}
                </p>
              </div>
            </div>
          </div>

          <div className="group relative bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-white border-opacity-20 hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 from-opacity-10 to-indigo-500 to-opacity-10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg group-hover:shadow-purple-500 group-hover:shadow-opacity-25 transition-all duration-300">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-purple-600">
                    {t("client.myListings")}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">
                  {t("client.myListings")}
                </p>
                <p className="text-3xl font-bold text-slate-800 mb-2">
                  {stats.myPropertiesCount}
                </p>
              </div>
            </div>
          </div>

          <div className="group relative bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-white border-opacity-20 hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 from-opacity-10 to-red-500 to-opacity-10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg group-hover:shadow-orange-500 group-hover:shadow-opacity-25 transition-all duration-300">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-orange-600">
                    {t("common.active")}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">
                  {t("client.myOrders")}
                </p>
                <p className="text-3xl font-bold text-slate-800 mb-2">
                  {stats.orderedProperties}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-white border-opacity-20">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("browse")}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition duration-200 ${
                  activeTab === "browse"
                    ? "border-rose-500 text-rose-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                🔍 {t("client.browseProperties")}
              </button>
              <button
                onClick={() => setActiveTab("myProperties")}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition duration-200 ${
                  activeTab === "myProperties"
                    ? "border-rose-500 text-rose-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📋 {t("client.myProperties")} ({stats.myPropertiesCount})
              </button>
              <button
                onClick={() => setActiveTab("myOrders")}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition duration-200 ${
                  activeTab === "myOrders"
                    ? "border-rose-500 text-rose-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                🛒 {t("client.myOrders")} ({stats.orderedProperties})
              </button>
              <button
                onClick={() => setActiveTab("myEarnings")}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition duration-200 ${
                  activeTab === "myEarnings"
                    ? "border-rose-500 text-rose-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                💰 {t("client.myEarnings")} ({stats.earningsCount})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "browse" && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {t("client.availableProperties")}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      {loading
                        ? t("common.loading")
                        : t("client.showingProperties", {
                            count: filteredProperties.length,
                            total: properties.length,
                          })}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
                    <button
                      onClick={() => {
                        console.log("🔄 Refreshing available properties...");
                        fetchDashboardData();
                      }}
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-xl font-semibold transition duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <svg
                        className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      {loading ? t("common.refreshing") : t("common.refresh")}
                    </button>
                    <Link
                      to="/properties"
                      className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200 shadow-md hover:shadow-lg text-center"
                    >
                      {t("client.browseAllProperties")}
                    </Link>
                  </div>
                </div>

                {/* Error Display */}
                {fetchError && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-red-600 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-semibold text-red-800">
                          {t("errors.fetchError")}
                        </h3>
                        <p className="text-sm text-red-700 mt-1">
                          {fetchError}
                        </p>
                        <button
                          onClick={() => {
                            setFetchError(null);
                            fetchDashboardData();
                          }}
                          className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                        >
                          {t("common.tryAgain")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced Search Bar */}
                <div className="mb-6">
                  <form onSubmit={handleSearch} className="space-y-4">
                    {/* Main Search Bar */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={t("client.searchPropertiesPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowAdvancedSearch(!showAdvancedSearch)
                        }
                        className="absolute right-20 top-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition duration-200 text-sm"
                      >
                        {showAdvancedSearch
                          ? t("client.simple")
                          : t("client.advanced")}
                      </button>
                      <button
                        type="submit"
                        className="absolute right-2 top-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-lg font-medium transition duration-200 text-sm"
                      >
                        {t("common.search")}
                      </button>
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedSearch && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {/* Name Filter */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t("properties.form.title")}
                            </label>
                            <input
                              type="text"
                              placeholder={t(
                                "properties.form.titlePlaceholder",
                              )}
                              value={searchFilters.name}
                              onChange={(e) =>
                                setSearchFilters((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                            />
                          </div>

                          {/* Location Filter */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t("client.location")}
                            </label>
                            <input
                              type="text"
                              placeholder={t("client.specificAddress")}
                              value={searchFilters.location}
                              onChange={(e) =>
                                setSearchFilters((prev) => ({
                                  ...prev,
                                  location: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                            />
                          </div>

                          {/* Purpose Filter */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t("properties.purpose")}
                            </label>
                            <select
                              value={searchFilters.purpose}
                              onChange={(e) =>
                                setSearchFilters((prev) => ({
                                  ...prev,
                                  purpose: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                            >
                              <option value="">
                                {t("client.allPurposes")}
                              </option>
                              <option value="Sell">
                                {t("client.forSale")}
                              </option>
                              <option value="Rent">
                                {t("client.forRent")}
                              </option>
                            </select>
                          </div>
                        </div>

                        {/* Filter Actions */}
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-600">
                            {(searchTerm ||
                              searchFilters.name ||
                              searchFilters.location ||
                              searchFilters.purpose) && (
                              <span>
                                {t("common.activeFilters")}:{" "}
                                {[
                                  searchTerm && t("client.generalSearch"),
                                  searchFilters.name &&
                                    t("properties.form.title"),
                                  searchFilters.location &&
                                    t("client.location"),
                                  searchFilters.purpose &&
                                    `${t("properties.purpose")}: ${searchFilters.purpose}`,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={clearFilters}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg font-medium transition duration-200 text-sm"
                          >
                            {t("client.clearAllFilters")}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse"
                      >
                        <div className="h-48 bg-gray-200"></div>
                        <div className="p-5">
                          <div className="h-6 bg-gray-200 rounded mb-3"></div>
                          <div className="h-8 bg-gray-200 rounded mb-4"></div>
                          <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredProperties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProperties.map((property) => (
                      <PropertyCard key={property._id} property={property} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {properties.length === 0
                        ? t("client.noPropertiesAvailable")
                        : t("client.noPropertiesFound")}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {properties.length === 0
                        ? t("client.noPropertiesAvailableDescription")
                        : t("client.tryAdjustingSearch")}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {properties.length > 0 && (
                        <button
                          onClick={clearFilters}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200"
                        >
                          {t("client.clearAllFilters")}
                        </button>
                      )}
                      <Link
                        to="/properties"
                        className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200"
                      >
                        {t("client.browseAllProperties")}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "myProperties" && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {t("client.myProperties")}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      {t("client.myPropertiesDescription")}
                    </p>
                  </div>
                  <Link
                    to="/client/create-property"
                    className="mt-4 sm:mt-0 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200 shadow-md hover:shadow-lg"
                  >
                    + {t("client.addNewProperty")}
                  </Link>
                </div>

                {myProperties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {myProperties.map((property) => (
                      <PropertyCard
                        key={property._id}
                        property={property}
                        showStatus={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <div className="text-6xl mb-4">🏠</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {t("client.noPropertiesListed")}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t("client.noPropertiesListedDescription")}
                    </p>
                    <Link
                      to="/client/create-property"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200"
                    >
                      {t("client.addFirstProperty")}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === "myOrders" && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {t("client.myOrders")}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      {t("client.orderedPropertiesDescription")}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex space-x-3">
                    <button
                      onClick={() => fetchDashboardData()}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl font-semibold transition duration-200 shadow-md hover:shadow-lg"
                    >
                      🔄 {t("common.refresh")}
                    </button>
                    <Link
                      to="/payment-history"
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200 shadow-md hover:shadow-lg"
                    >
                      {t("client.viewPaymentHistory")}
                    </Link>
                  </div>
                </div>

                {myOrders.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {myOrders.map((property) => (
                      <PropertyCard
                        key={property._id}
                        property={property}
                        showStatus={true}
                        showOrderInfo={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <div className="text-6xl mb-4">🛒</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {t("client.noOrdersYet")}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t("client.noOrdersDescription")}
                    </p>
                    <Link
                      to="/properties"
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200"
                    >
                      {t("client.browseProperties")}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === "myEarnings" && (
              <div>
                {/* Earnings Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl border border-yellow-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-yellow-500 rounded-xl">
                        <span className="text-2xl">💰</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-yellow-700 mb-1">
                        {t("client.totalEarnings")}
                      </p>
                      <p className="text-2xl font-bold text-yellow-800">
                        {formatPrice(earningsStats.totalEarnings)}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        {t("client.grossAmountBeforeCommission")}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-500 rounded-xl">
                        <span className="text-2xl">🏠</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700 mb-1">
                        {t("client.propertiesSoldRented")}
                      </p>
                      <p className="text-2xl font-bold text-blue-800">
                        {earningsStats.propertiesSoldRented}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-500 rounded-xl">
                        <span className="text-2xl">💸</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700 mb-1">
                        {t("client.commissionPaid")}
                      </p>
                      <p className="text-2xl font-bold text-purple-800">
                        {formatPrice(earningsStats.commissionPaid)}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        {t("client.platformCommission")}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-500 rounded-xl">
                        <span className="text-2xl">📊</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-1">
                        {t("client.netEarnings")}
                      </p>
                      <p className="text-2xl font-bold text-green-800">
                        {formatPrice(earningsStats.netEarnings)}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {t("client.afterCommissionDeduction")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sold & Rented Properties */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {t("client.soldRentedProperties")}
                  </h3>
                </div>

                {myEarnings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myEarnings.map((property) => (
                      <div
                        key={property._id}
                        className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
                      >
                        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                          {property.images && property.images.length > 0 ? (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="text-5xl">
                                {property.propertyType === "Home"
                                  ? "🏠"
                                  : property.propertyType === "Car"
                                    ? "🚗"
                                    : "💻"}
                              </span>
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                property.status === "Sold"
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : "bg-blue-100 text-blue-800 border border-blue-200"
                              }`}
                            >
                              {t(`client.${property.status.toLowerCase()}`)}
                            </span>
                          </div>
                        </div>

                        <div className="p-5">
                          <h4 className="font-bold text-gray-900 mb-2 line-clamp-1">
                            {property.title}
                          </h4>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {t("client.type")}:
                              </span>
                              <span className="font-medium">
                                {property.propertyType}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {t("client.purpose")}:
                              </span>
                              <span className="font-medium">
                                {property.purpose}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {t("client.location")}:
                              </span>
                              <span className="font-medium">
                                {property.city ||
                                  property.location ||
                                  t("common.notAvailable")}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {t("client.soldRentedDate")}:
                              </span>
                              <span className="font-medium">
                                {property.soldRentedDate
                                  ? new Date(
                                      property.soldRentedDate,
                                    ).toLocaleDateString()
                                  : property.updatedAt
                                    ? new Date(
                                        property.updatedAt,
                                      ).toLocaleDateString()
                                    : t("common.notAvailable")}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {t("client.salePrice")}:
                              </span>
                              <span className="font-bold text-green-600">
                                {formatPrice(property.price || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {t("client.commissionPaid")}:
                              </span>
                              <span className="font-medium text-red-600">
                                -
                                {formatPrice(
                                  property.commissionPaid ||
                                    property.price * 0.02,
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="text-gray-900 font-semibold">
                                {t("client.netReceived")}:
                              </span>
                              <span className="font-bold text-green-700">
                                {formatPrice(
                                  property.netReceived ||
                                    property.price - property.price * 0.02,
                                )}
                              </span>
                            </div>
                          </div>

                          <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition duration-200">
                            {t("client.viewEarningsDetails")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <div className="text-6xl mb-4">💰</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {t("client.noEarningsYet")}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t("client.earningsWillAppear")}
                    </p>
                    <Link
                      to="/client/create-property"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200"
                    >
                      {t("client.addFirstProperty")}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-3xl shadow-lg border border-white border-opacity-20 p-8 mt-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
            <span className="mr-3">⚡</span>
            {t("dashboard.quickActions")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/properties"
              className="group bg-white bg-opacity-80 p-6 rounded-2xl border border-white border-opacity-20 hover:shadow-xl transition-all duration-300 hover:scale-105 block"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-rose-100 rounded-xl group-hover:bg-rose-200 transition-colors">
                  <svg
                    className="w-6 h-6 text-rose-600"
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
                </div>
                <div className="text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="font-bold text-slate-800 mb-2">
                {t("client.browseProperties")}
              </h3>
              <p className="text-sm text-slate-600">
                {t("home.browseAllProperties")}
              </p>
            </Link>

            <Link
              to="/client/create-property"
              className="group bg-white bg-opacity-80 p-6 rounded-2xl border border-white border-opacity-20 hover:shadow-xl transition-all duration-300 hover:scale-105 block"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div className="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="font-bold text-slate-800 mb-2">
                {t("client.listPropertyForSaleRent")}
              </h3>
              <p className="text-sm text-slate-600">
                {t("client.addFirstProperty")}
              </p>
            </Link>

            <Link
              to="/client/profile"
              className="group bg-white bg-opacity-80 p-6 rounded-2xl border border-white border-opacity-20 hover:shadow-xl transition-all duration-300 hover:scale-105 block"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-pink-100 rounded-xl group-hover:bg-pink-200 transition-colors">
                  <svg
                    className="w-6 h-6 text-pink-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="text-pink-600 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="font-bold text-slate-800 mb-2">
                {t("navigation.profile")}
              </h3>
              <p className="text-sm text-slate-600">
                {t("client.updatePersonalInfo")}
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* Manual Verification Dialog */}
      <ManualVerificationDialog
        isOpen={showManualVerification}
        onClose={() => {
          setShowManualVerification(false);
          setSelectedPropertyForVerification(null);
        }}
        propertyId={selectedPropertyForVerification?._id}
        propertyTitle={selectedPropertyForVerification?.title}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </div>
  );
};

export default ClientDashboard;
