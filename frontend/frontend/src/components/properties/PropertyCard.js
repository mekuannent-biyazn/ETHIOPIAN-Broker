import React from "react";
import { useTranslation } from "react-i18next";

const PropertyCard = ({
  property,
  onEdit,
  onDelete,
  onView,
  formatPrice,
  getStatusBadgeColor,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Property Image */}
      <div className="relative h-48 bg-gray-200">
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={`w-full h-full flex items-center justify-center text-gray-400 ${
            property.images && property.images.length > 0 ? "hidden" : "flex"
          }`}
        >
          <span className="text-4xl">
            {property.propertyType === "Home"
              ? "🏠"
              : property.propertyType === "Car"
              ? "🚗"
              : "💻"}
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
              property.status
            )}`}
          >
            {t(`properties.status.${property.status.toLowerCase()}`)}
          </span>
        </div>

        {/* Admin Approval Badge */}
        {property.approvedByAdmin && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              ✓ {t("properties.approved")}
            </span>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
          {property.title}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {property.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{t("properties.price")}:</span>
            <span className="font-bold text-blue-600">
              {formatPrice(property.price)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{t("properties.type")}:</span>
            <span className="capitalize">
              {t(
                `properties.propertyTypes.${property.propertyType.toLowerCase()}`
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{t("properties.purpose")}:</span>
            <span className="capitalize">
              {t(`properties.purposes.${property.purpose.toLowerCase()}`)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{t("properties.location")}:</span>
            <span>{property.city}</span>
          </div>
        </div>

        {/* Order Info */}
        {property.orderInfo && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2 text-sm">
              {t("properties.orderInformation")}
            </h4>
            <div className="text-xs text-blue-700 space-y-1">
              <div>
                {t("properties.orderedBy")}:{" "}
                {property.orderInfo.orderedBy?.fname}{" "}
                {property.orderInfo.orderedBy?.lname}
              </div>
              <div>
                {t("properties.orderDate")}:{" "}
                {new Date(property.orderInfo.orderDate).toLocaleDateString()}
              </div>
              <div className="capitalize">
                {t("properties.payment")}: {property.orderInfo.paymentStatus}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => onView(property._id)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-3 rounded text-sm font-medium transition-colors"
          >
            {t("common.view")}
          </button>

          <button
            onClick={() => onEdit(property._id)}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-center py-2 px-3 rounded text-sm font-medium transition-colors"
          >
            {t("common.edit")}
          </button>

          <button
            onClick={() => onDelete(property._id)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
          >
            {t("common.delete")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
