import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import axios from "../../api/axios";

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/property/view/${id}`);

      if (response.data.success) {
        setProperty(response.data.property);
      } else if (response.data._id) {
        setProperty(response.data);
      } else {
        setMessage(t("client.propertyNotFound"));
      }
    } catch (error) {
      console.error("Error fetching property:", error);
      setMessage(t("client.errorLoadingProperty"));
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!isAuthenticated) {
      setMessage(t("client.pleaseLoginToOrder"));
      setTimeout(() => {
        navigate("/login", { state: { from: `/property/${id}` } });
      }, 2000);
      return;
    }

    if (property.owner?._id === user?._id) {
      setMessage(t("client.cannotOrderOwnProperty"));
      return;
    }

    if (["admin", "broker"].includes(user?.role)) {
      setMessage(t("client.adminsBrokersCannotOrder"));
      return;
    }

    if (property.status !== "Available") {
      setMessage(t("client.propertyNotAvailableForOrder"));
      return;
    }

    setOrderLoading(true);
    setMessage("");

    try {
      const orderResponse = await axios.post(`/api/property/${id}/order`);

      if (orderResponse.data.success) {
        setMessage(t("client.orderPlacedSuccessPayment"));

        const paymentResponse = await axios.post("/api/payments/initialize", {
          propertyId: id,
          paymentType: "full_payment",
        });

        if (paymentResponse.data.success) {
          window.location.href = paymentResponse.data.data.paymentUrl;
        } else {
          setMessage(t("client.paymentInitFailed"));
        }
      }
    } catch (error) {
      console.error("Error ordering property:", error);
      const errorMessage =
        error.response?.data?.message || t("client.errorPlacingOrder");
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setOrderLoading(false);
    }
  };

  const canOrderProperty = () => {
    if (!isAuthenticated) return false;
    if (property.owner?._id === user?._id) return false;
    if (["admin", "broker"].includes(user?.role)) return false;
    return property.status === "Available";
  };

  const canEditProperty = () => {
    if (!isAuthenticated) return false;
    if (property.owner?._id !== user?._id) return false;
    return property.status !== "Sold" && property.status !== "Rented";
  };

  const getOrderButtonText = () => {
    return property.purpose === "Sell"
      ? t("client.buyNow")
      : t("client.rentNow");
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
    }).format(price);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800 border border-green-200";
      case "Ordered":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "Sold":
      case "Rented":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const renderPropertySpecificDetails = () => {
    if (!property) return null;

    switch (property.propertyType) {
      case "Home":
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              🏠 {t("client.homeDetails")}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl text-blue-600 mb-2">📏</div>
                <div className="text-sm text-gray-600 font-medium">
                  {t("client.size")}
                </div>
                <div className="font-bold text-gray-900">
                  {property.homeDetails?.size || t("client.notAvailable")}{" "}
                  {t("client.sqft")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl text-blue-600 mb-2">🛏️</div>
                <div className="text-sm text-gray-600 font-medium">
                  {t("client.bedrooms")}
                </div>
                <div className="font-bold text-gray-900">
                  {property.homeDetails?.bedrooms || t("client.notAvailable")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl text-blue-600 mb-2">🚿</div>
                <div className="text-sm text-gray-600 font-medium">
                  {t("client.bathrooms")}
                </div>
                <div className="font-bold text-gray-900">
                  {property.homeDetails?.bathrooms || t("client.notAvailable")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl text-blue-600 mb-2">🏢</div>
                <div className="text-sm text-gray-600 font-medium">
                  {t("client.floors")}
                </div>
                <div className="font-bold text-gray-900">
                  {property.homeDetails?.floors || t("client.notAvailable")}
                </div>
              </div>
            </div>
            {property.homeDetails?.amenities && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  ✨ {t("client.amenities")}
                </h4>
                <p className="text-gray-700 bg-white p-4 rounded-lg border">
                  {property.homeDetails.amenities}
                </p>
              </div>
            )}
          </div>
        );

      case "Car":
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              🚗 {t("client.carDetails")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="font-medium text-gray-700">
                  {t("client.brand")}:
                </span>
                <span className="font-semibold text-gray-900">
                  {property.carDetails?.brand || t("client.notAvailable")}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="font-medium text-gray-700">
                  {t("client.model")}:
                </span>
                <span className="font-semibold text-gray-900">
                  {property.carDetails?.model || t("client.notAvailable")}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="font-medium text-gray-700">
                  {t("client.year")}:
                </span>
                <span className="font-semibold text-gray-900">
                  {property.carDetails?.year || t("client.notAvailable")}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="font-medium text-gray-700">
                  {t("client.mileage")}:
                </span>
                <span className="font-semibold text-gray-900">
                  {property.carDetails?.mileage || t("client.notAvailable")}{" "}
                  {t("client.km")}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="font-medium text-gray-700">
                  {t("client.fuelType")}:
                </span>
                <span className="font-semibold text-gray-900">
                  {property.carDetails?.fuelType || t("client.notAvailable")}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="font-medium text-gray-700">
                  {t("client.transmission")}:
                </span>
                <span className="font-semibold text-gray-900">
                  {property.carDetails?.transmission ||
                    t("client.notAvailable")}
                </span>
              </div>
            </div>
          </div>
        );

      case "Electronics":
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              💻 {t("client.electronicsDetails")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="font-medium text-gray-700">
                  {t("client.category")}:
                </span>
                <span className="font-semibold text-gray-900">
                  {property.electronicsDetails?.category ||
                    t("client.notAvailable")}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="font-medium text-gray-700">
                  {t("client.brand")}:
                </span>
                <span className="font-semibold text-gray-900">
                  {property.electronicsDetails?.brand ||
                    t("client.notAvailable")}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="font-medium text-gray-700">
                  {t("client.model")}:
                </span>
                <span className="font-semibold text-gray-900">
                  {property.electronicsDetails?.model ||
                    t("client.notAvailable")}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="font-medium text-gray-700">
                  {t("client.condition")}:
                </span>
                <span className="font-semibold text-gray-900">
                  {property.electronicsDetails?.condition ||
                    t("client.notAvailable")}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <span className="font-medium text-gray-700">
                  {t("client.warranty")}:
                </span>
                <span className="font-semibold text-gray-900">
                  {property.electronicsDetails?.warranty
                    ? t("client.yes")
                    : t("client.no")}
                </span>
              </div>
              {property.electronicsDetails?.warranty && (
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                  <span className="font-medium text-gray-700">
                    {t("client.warrantyPeriod")}:
                  </span>
                  <span className="font-semibold text-gray-900">
                    {property.electronicsDetails.warrantyPeriod}
                  </span>
                </div>
              )}
            </div>
            {property.electronicsDetails?.specifications && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  ⚙️ {t("client.specifications")}
                </h4>
                <p className="text-gray-700 bg-white p-4 rounded-lg border whitespace-pre-line">
                  {property.electronicsDetails.specifications}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">
            {t("client.loadingPropertyDetails")}
          </p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t("client.propertyNotFound")}
          </h2>
          <p className="text-gray-600 mb-4">
            {t("client.propertyNotFoundDescription")}
          </p>
          <Link
            to="/properties"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
          >
            {t("client.browseProperties")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link
                to="/"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {t("client.home")}
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <Link
                to="/properties"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {t("client.properties")}
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li className="text-gray-900 font-semibold truncate max-w-xs">
              {property.title}
            </li>
          </ol>
        </nav>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Image Gallery */}
            <div>
              <div className="relative h-80 lg:h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-4 overflow-hidden">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[activeImage]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-8xl">
                      {property.propertyType === "Home"
                        ? "🏠"
                        : property.propertyType === "Car"
                        ? "🚗"
                        : "💻"}
                    </span>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                  <span
                    className={`px-3 py-2 rounded-full text-sm font-semibold ${getStatusBadgeColor(
                      property.status
                    )}`}
                  >
                    {t(`client.${property.status.toLowerCase()}`)}
                  </span>
                </div>
              </div>

              {property.images && property.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {property.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`h-20 bg-gray-200 rounded-lg border-2 transition-all duration-200 ${
                        activeImage === index
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${property.title} ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    {property.title}
                  </h1>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {property.propertyType}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        property.purpose === "Sell"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {t("client.for")} {property.purpose}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPrice(property.price)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {property.purpose === "Rent"
                      ? t("client.perMonth")
                      : t("client.oneTimePayment")}
                  </div>
                </div>
              </div>

              <p className="text-gray-700 text-lg leading-relaxed">
                {property.description}
              </p>

              {/* Key Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {property.city}
                    </div>
                    <div className="text-sm text-gray-600">
                      {property.location}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {property.owner?.fname} {property.owner?.lname}
                    </div>
                    <div className="text-sm text-gray-600">
                      {t("client.propertyOwner")}
                    </div>
                  </div>
                </div>

                {property.assignedBroker && (
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🤝</span>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {property.assignedBroker?.fname}{" "}
                        {property.assignedBroker?.lname}
                      </div>
                      <div className="text-sm text-gray-600">
                        {t("client.assignedBroker")}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Property Specific Details */}
              {renderPropertySpecificDetails()}

              {/* Action Buttons */}
              <div className="space-y-4 pt-6 border-t">
                {message && (
                  <div
                    className={`p-4 rounded-lg ${
                      message.includes("✅")
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : message.includes("❌")
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "bg-blue-100 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  {canOrderProperty() && (
                    <button
                      onClick={handleOrder}
                      disabled={orderLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-semibold text-lg transition duration-200 transform hover:scale-105"
                    >
                      {orderLoading ? (
                        <span className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          {t("client.processing")}
                        </span>
                      ) : (
                        getOrderButtonText()
                      )}
                    </button>
                  )}

                  {canEditProperty() && (
                    <Link
                      to={`/client/edit-property/${property._id}`}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition duration-200 text-center"
                    >
                      {t("client.editProperty")}
                    </Link>
                  )}
                </div>

                {!isAuthenticated && (
                  <p className="text-center text-gray-600">
                    {t("client.please")}{" "}
                    <Link
                      to="/login"
                      className="text-blue-600 hover:text-blue-700 font-semibold underline"
                    >
                      {t("client.login")}
                    </Link>{" "}
                    {t("client.toOrderThisProperty")}
                  </p>
                )}

                {isAuthenticated && property.owner?._id === user?._id && (
                  <p className="text-center text-yellow-600 font-semibold">
                    👋 {t("client.yourPropertyListing")}
                  </p>
                )}

                {isAuthenticated &&
                  ["admin", "broker"].includes(user?.role) && (
                    <p className="text-center text-purple-600 font-semibold">
                      🔧{" "}
                      {user.role === "admin"
                        ? t("client.admins")
                        : t("client.brokers")}{" "}
                      {t("client.cannotOrderProperties")}
                    </p>
                  )}

                {!canOrderProperty() &&
                  isAuthenticated &&
                  property.owner?._id !== user?._id &&
                  !["admin", "broker"].includes(user?.role) && (
                    <p className="text-center text-red-600 font-semibold">
                      ❌ {t("client.propertyCurrentlyNotAvailable")}
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
