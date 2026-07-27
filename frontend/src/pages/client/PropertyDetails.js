import React, { useState, useEffect } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import axios from "../../api/axios";

const PropertyDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Check if this is a verification request
  const isVerificationRequest = searchParams.get("verify") === "true";
  const txRef = searchParams.get("tx_ref");
  const amount = searchParams.get("amount");
  const paymentId = searchParams.get("payment_id");

  useEffect(() => {
    fetchProperty();

    if (isVerificationRequest) {
      const verificationUrl = `/properties/${id}/verify?tx_ref=${txRef || ""}&amount=${amount || ""}&payment_id=${paymentId || ""}`;
      navigate(verificationUrl);
    }
  }, [id, isVerificationRequest, navigate, txRef, amount, paymentId]);

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

  // Image gallery functions
  const nextImage = () => {
    if (property.images && property.images.length > 0) {
      setActiveImage((prev) => (prev + 1) % property.images.length);
      resetImageTransform();
    }
  };

  const prevImage = () => {
    if (property.images && property.images.length > 0) {
      setActiveImage(
        (prev) => (prev - 1 + property.images.length) % property.images.length,
      );
      resetImageTransform();
    }
  };

  const resetImageTransform = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const rotateImage = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const downloadImage = async (imageUrl, imageName) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${property.title.replace(/\s+/g, "-")}-${imageName || "image"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage("✅ " + t("client.imageDownloaded"));
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error downloading image:", error);
      setMessage("❌ " + t("client.downloadFailed"));
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const shareProperty = async () => {
    const shareData = {
      title: property.title,
      text: `${property.title} - ${formatPrice(property.price)}`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if (error.name !== "AbortError") {
          fallbackShare();
        }
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setMessage("📋 " + t("client.linkCopied"));
    setTimeout(() => setMessage(""), 3000);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showLightbox) return;

      switch (e.key) {
        case "ArrowLeft":
          prevImage();
          break;
        case "ArrowRight":
          nextImage();
          break;
        case "+":
        case "=":
          e.preventDefault();
          zoomIn();
          break;
        case "-":
          e.preventDefault();
          zoomOut();
          break;
        case "r":
        case "R":
          rotateImage();
          break;
        case "Escape":
          setShowLightbox(false);
          resetImageTransform();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showLightbox, zoomLevel, rotation]);

  // Close lightbox on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showLightbox && e.target.classList.contains("lightbox-backdrop")) {
        setShowLightbox(false);
        resetImageTransform();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showLightbox]);

  // SVG Icons for buttons
  const ArrowLeftIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );

  const ArrowRightIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );

  const CloseIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );

  const FullscreenIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );

  const DownloadIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );

  const ShareIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );

  const HeartIcon = ({ filled }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );

  const ZoomInIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );

  const ZoomOutIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );

  const RotateIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 2v6h-6" />
      <path d="M21 13a9 9 0 1 1-3-7.7L21 8" />
    </svg>
  );

  // Render image gallery
  const renderImageGallery = () => (
    <div className="space-y-6">
      {/* Main Image Container */}
      <div className="relative group">
        <div
          className="relative h-[500px] lg:h-[600px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden cursor-zoom-in transition-all duration-300"
          onClick={() => setShowLightbox(true)}
        >
          {property.images && property.images.length > 0 ? (
            <img
              src={property.images[activeImage]}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <span className="text-8xl mb-4">
                {property.propertyType === "Home"
                  ? "🏠"
                  : property.propertyType === "Car"
                    ? "🚗"
                    : "💻"}
              </span>
              <p className="text-lg">{t("client.noImagesAvailable")}</p>
            </div>
          )}

          {/* Navigation Arrows */}
          {property.images && property.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
              >
                <ArrowLeftIcon />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
              >
                <ArrowRightIcon />
              </button>
            </>
          )}

          {/* Image Counter */}
          {property.images && property.images.length > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
              {activeImage + 1} / {property.images.length}
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked(!isLiked);
              }}
              className={`p-3 rounded-full backdrop-blur-sm transition-all ${
                isLiked
                  ? "bg-red-500/90 text-white"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
              title={t("client.saveToFavorites")}
            >
              <HeartIcon filled={isLiked} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLightbox(true);
              }}
              className="p-3 rounded-full backdrop-blur-sm bg-white/20 text-white hover:bg-white/30"
              title={t("client.fullscreen")}
            >
              <FullscreenIcon />
            </button>
          </div>

          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <span
              className={`px-4 py-2.5 rounded-full text-sm font-semibold backdrop-blur-sm ${getStatusBadgeColor(
                property.status,
              )}`}
            >
              {t(`client.${property.status.toLowerCase()}`)}
            </span>
          </div>
        </div>

        {/* Zoom Hint */}
        {property.images && property.images.length > 0 && (
          <div className="absolute bottom-4 left-4 text-white/80 text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            {t("client.clickToZoom")}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {property.images && property.images.length > 1 && (
        <div className="relative">
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {property.images.map((image, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveImage(index);
                  resetImageTransform();
                }}
                className={`flex-shrink-0 w-24 h-24 rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                  activeImage === index
                    ? "border-blue-500 ring-2 ring-blue-200 scale-105"
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <img
                  src={image}
                  alt={`${property.title} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {activeImage === index && (
                  <div className="absolute inset-0 bg-blue-500/20" />
                )}
              </button>
            ))}
          </div>

          {/* Scroll hint for many thumbnails */}
          {property.images.length > 6 && (
            <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent pointer-events-none" />
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {showLightbox && property.images && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lightbox-backdrop bg-black/95 backdrop-blur-sm">
          <div className="relative w-full max-w-7xl h-full flex flex-col">
            {/* Lightbox Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-white text-lg">
                {property.title} - {activeImage + 1}/{property.images.length}
              </div>
              <div className="flex gap-2">
                {/* Image Controls */}
                <button
                  onClick={zoomOut}
                  disabled={zoomLevel <= 0.5}
                  className="p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
                  title={t("client.zoomOut")}
                >
                  <ZoomOutIcon />
                </button>
                <button
                  onClick={zoomIn}
                  disabled={zoomLevel >= 3}
                  className="p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
                  title={t("client.zoomIn")}
                >
                  <ZoomInIcon />
                </button>
                <button
                  onClick={rotateImage}
                  className="p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  title={t("client.rotate")}
                >
                  <RotateIcon />
                </button>
                <button
                  onClick={() =>
                    downloadImage(
                      property.images[activeImage],
                      `image-${activeImage + 1}`,
                    )
                  }
                  className="p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  title={t("client.download")}
                >
                  <DownloadIcon />
                </button>
                <button
                  onClick={shareProperty}
                  className="p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  title={t("client.share")}
                >
                  <ShareIcon />
                </button>
                <button
                  onClick={() => {
                    setShowLightbox(false);
                    resetImageTransform();
                  }}
                  className="p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  title={t("client.close")}
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Main Lightbox Image */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <img
                src={property.images[activeImage]}
                alt={property.title}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                }}
              />

              {/* Navigation Arrows */}
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 bg-black/60 hover:bg-black/80 text-white p-4 rounded-full backdrop-blur-sm"
                  >
                    <ArrowLeftIcon />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 bg-black/60 hover:bg-black/80 text-white p-4 rounded-full backdrop-blur-sm"
                  >
                    <ArrowRightIcon />
                  </button>
                </>
              )}

              {/* Zoom Level Indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
                {Math.round(zoomLevel * 100)}%
              </div>
            </div>

            {/* Lightbox Thumbnails */}
            <div className="mt-4 flex justify-center gap-3">
              {property.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveImage(index);
                    resetImageTransform();
                  }}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImage === index
                      ? "border-blue-500 scale-110"
                      : "border-transparent hover:border-gray-400"
                  }`}
                >
                  <img
                    src={image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

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

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Image Gallery */}
            <div>{renderImageGallery()}</div>

            {/* Property Details */}
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    {property.title}
                  </h1>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium">
                      {property.propertyType}
                    </span>
                    <span
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${
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

                {/* Only show owner info to brokers and admins, not to clients */}
                {user?.role !== "client" && (
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
                )}

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
                      message.includes("✅") || message.includes("📋")
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
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
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
                      className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 text-center transform hover:scale-105 active:scale-95"
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

        {/* Image Navigation Shortcuts */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            {t("client.imageNavigationHint")}:
            <span className="mx-2">← → {t("client.navigate")}</span>
            <span className="mx-2">+ - {t("client.zoom")}</span>
            <span className="mx-2">R {t("client.rotate")}</span>
            <span className="mx-2">ESC {t("client.close")}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
