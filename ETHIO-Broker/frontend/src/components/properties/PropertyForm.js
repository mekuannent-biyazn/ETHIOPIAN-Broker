

import React, { useState, useEffect } from "react";
import { uploadMultipleToCloudinary } from "../../utils/cloudinary";
import { useTranslation } from "react-i18next";

const PropertyForm = ({
  onSubmit,
  onCancel,
  loading,
  submitButtonText = "Submit",
  initialData = null,
  isEdit = false,
}) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    propertyType: "Home",
    purpose: "Sell",
    price: "",
    currency: "ETB",
    city: "",
    location: "",
    images: [],
    homeDetails: {
      size: "",
      bedrooms: "",
      bathrooms: "",
      floors: "",
      yearBuilt: "",
      amenities: "",
      condition: "Good",
    },
    carDetails: {
      brand: "",
      model: "",
      year: "",
      mileage: "",
      fuelType: "Petrol",
      transmission: "Manual",
    },
    electronicsDetails: {
      category: "",
      brand: "",
      model: "",
      specifications: "",
      condition: "New",
      warranty: false,
      warrantyPeriod: "",
    },
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Initialize form with existing data when editing
  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        propertyType: initialData.propertyType || "Home",
        purpose: initialData.purpose || "Sell",
        price: initialData.price || "",
        currency: initialData.currency || "ETB",
        city: initialData.city || "",
        location: initialData.location || "",
        images: initialData.images || [],
        homeDetails: initialData.homeDetails || {
          size: "",
          bedrooms: "",
          bathrooms: "",
          floors: "",
          yearBuilt: "",
          amenities: "",
          condition: "Good",
        },
        carDetails: initialData.carDetails || {
          brand: "",
          model: "",
          year: "",
          mileage: "",
          fuelType: "Petrol",
          transmission: "Manual",
        },
        electronicsDetails: initialData.electronicsDetails || {
          category: "",
          brand: "",
          model: "",
          specifications: "",
          condition: "New",
          warranty: false,
          warrantyPeriod: "",
        },
      });
    }
  }, [initialData, isEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create temporary local URLs for preview
      const tempUrls = files.map((file) => URL.createObjectURL(file));

      // Update form with temporary images first
      setFormData((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          ...tempUrls.map((url) => ({ tempUrl: url, isUploading: true })),
        ],
      }));

      // Upload to Cloudinary
      const cloudinaryUrls = await uploadMultipleToCloudinary(files);

      // Replace temporary URLs with Cloudinary URLs
      setFormData((prev) => {
        const newImages = [...prev.images];
        const tempImageCount = tempUrls.length;

        // Replace the last N temporary images (the ones we just added)
        const startIndex = newImages.length - tempImageCount;
        cloudinaryUrls.forEach((url, index) => {
          newImages[startIndex + index] = url;
        });

        return {
          ...prev,
          images: newImages,
        };
      });

      setUploadProgress(100);
    } catch (error) {
      console.error("Error uploading images:", error);
      // Remove the temporary images if upload fails
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((img) => !img.isUploading),
      }));
      alert(t("properties.form.imageUploadError"));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Filter out any temporary objects and ensure we only send strings
    const finalFormData = {
      ...formData,
      images: formData.images
        .filter((img) => typeof img === "string" || img.url)
        .map((img) => (typeof img === "string" ? img : img.url)),
    };

    onSubmit(finalFormData);
  };

  const renderPropertySpecificFields = () => {
    switch (formData.propertyType) {
      case "Home":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.home.size")} *
              </label>
              <input
                type="number"
                value={formData.homeDetails.size}
                onChange={(e) =>
                  handleNestedChange("homeDetails", "size", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.home.bedrooms")} *
              </label>
              <input
                type="number"
                value={formData.homeDetails.bedrooms}
                onChange={(e) =>
                  handleNestedChange("homeDetails", "bedrooms", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.home.bathrooms")} *
              </label>
              <input
                type="number"
                value={formData.homeDetails.bathrooms}
                onChange={(e) =>
                  handleNestedChange("homeDetails", "bathrooms", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.home.floors")} *
              </label>
              <input
                type="number"
                value={formData.homeDetails.floors}
                onChange={(e) =>
                  handleNestedChange("homeDetails", "floors", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.home.yearBuilt")} *
              </label>
              <input
                type="number"
                value={formData.homeDetails.yearBuilt}
                onChange={(e) =>
                  handleNestedChange("homeDetails", "yearBuilt", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.home.condition")} *
              </label>
              <select
                value={formData.homeDetails.condition}
                onChange={(e) =>
                  handleNestedChange("homeDetails", "condition", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Excellent">
                  {t("properties.form.conditions.excellent")}
                </option>
                <option value="Good">
                  {t("properties.form.conditions.good")}
                </option>
                <option value="Fair">
                  {t("properties.form.conditions.fair")}
                </option>
                <option value="Needs Repair">
                  {t("properties.form.conditions.needsRepair")}
                </option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.home.amenities")} *
              </label>
              <textarea
                value={formData.homeDetails.amenities}
                onChange={(e) =>
                  handleNestedChange("homeDetails", "amenities", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder={t("properties.form.home.amenitiesPlaceholder")}
                required
                rows="3"
              />
            </div>
          </div>
        );

      case "Car":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.car.brand")} *
              </label>
              <input
                type="text"
                value={formData.carDetails.brand}
                onChange={(e) =>
                  handleNestedChange("carDetails", "brand", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder={t("properties.form.car.brandPlaceholder")}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.car.model")} *
              </label>
              <input
                type="text"
                value={formData.carDetails.model}
                onChange={(e) =>
                  handleNestedChange("carDetails", "model", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder={t("properties.form.car.modelPlaceholder")}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.car.year")} *
              </label>
              <input
                type="number"
                value={formData.carDetails.year}
                onChange={(e) =>
                  handleNestedChange("carDetails", "year", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.car.mileage")} *
              </label>
              <input
                type="number"
                value={formData.carDetails.mileage}
                onChange={(e) =>
                  handleNestedChange("carDetails", "mileage", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.car.fuelType")} *
              </label>
              <select
                value={formData.carDetails.fuelType}
                onChange={(e) =>
                  handleNestedChange("carDetails", "fuelType", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Petrol">
                  {t("properties.form.car.fuelTypes.petrol")}
                </option>
                <option value="Diesel">
                  {t("properties.form.car.fuelTypes.diesel")}
                </option>
                <option value="Electric">
                  {t("properties.form.car.fuelTypes.electric")}
                </option>
                <option value="Hybrid">
                  {t("properties.form.car.fuelTypes.hybrid")}
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.car.transmission")} *
              </label>
              <select
                value={formData.carDetails.transmission}
                onChange={(e) =>
                  handleNestedChange(
                    "carDetails",
                    "transmission",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Manual">
                  {t("properties.form.car.transmissions.manual")}
                </option>
                <option value="Automatic">
                  {t("properties.form.car.transmissions.automatic")}
                </option>
              </select>
            </div>
          </div>
        );

      case "Electronics":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.electronics.category")} *
              </label>
              <input
                type="text"
                value={formData.electronicsDetails.category}
                onChange={(e) =>
                  handleNestedChange(
                    "electronicsDetails",
                    "category",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder={t(
                  "properties.form.electronics.categoryPlaceholder"
                )}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.electronics.brand")} *
              </label>
              <input
                type="text"
                value={formData.electronicsDetails.brand}
                onChange={(e) =>
                  handleNestedChange(
                    "electronicsDetails",
                    "brand",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder={t("properties.form.electronics.brandPlaceholder")}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.electronics.model")} *
              </label>
              <input
                type="text"
                value={formData.electronicsDetails.model}
                onChange={(e) =>
                  handleNestedChange(
                    "electronicsDetails",
                    "model",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder={t("properties.form.electronics.modelPlaceholder")}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.electronics.specifications")} *
              </label>
              <textarea
                value={formData.electronicsDetails.specifications}
                onChange={(e) =>
                  handleNestedChange(
                    "electronicsDetails",
                    "specifications",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder={t(
                  "properties.form.electronics.specificationsPlaceholder"
                )}
                required
                rows="4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.electronics.condition")} *
              </label>
              <select
                value={formData.electronicsDetails.condition}
                onChange={(e) =>
                  handleNestedChange(
                    "electronicsDetails",
                    "condition",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="New">
                  {t("properties.form.conditions.new")}
                </option>
                <option value="Used">
                  {t("properties.form.conditions.used")}
                </option>
                <option value="Refurbished">
                  {t("properties.form.conditions.refurbished")}
                </option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.electronicsDetails.warranty}
                onChange={(e) =>
                  handleNestedChange(
                    "electronicsDetails",
                    "warranty",
                    e.target.checked
                  )
                }
                className="w-5 h-5 text-blue-600 border-gray-300 rounded"
              />
              <label className="text-gray-700">
                {t("properties.form.electronics.hasWarranty")}
              </label>
            </div>

            {formData.electronicsDetails.warranty && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("properties.form.electronics.warrantyPeriod")}
                </label>
                <input
                  type="text"
                  value={formData.electronicsDetails.warrantyPeriod}
                  onChange={(e) =>
                    handleNestedChange(
                      "electronicsDetails",
                      "warrantyPeriod",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder={t(
                    "properties.form.electronics.warrantyPlaceholder"
                  )}
                />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {isEdit && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-yellow-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-yellow-700 text-sm">
              <strong>{t("properties.form.editNote.title")}:</strong>{" "}
              {t("properties.form.editNote.description")}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            {t("properties.form.sections.basicInfo")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.propertyType")} *
              </label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
                disabled={isEdit} // Cannot change property type when editing
              >
                <option value="Home">
                  {t("properties.propertyTypes.home")}
                </option>
                <option value="Car">{t("properties.propertyTypes.car")}</option>
                <option value="Electronics">
                  {t("properties.propertyTypes.electronics")}
                </option>
              </select>
              {isEdit && (
                <p className="text-xs text-gray-500 mt-1">
                  {t("properties.form.cannotChangeType")}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.purpose")} *
              </label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
                disabled={isEdit} // Cannot change purpose when editing
              >
                <option value="Sell">{t("properties.purposes.sell")}</option>
                <option value="Rent">{t("properties.purposes.rent")}</option>
              </select>
              {isEdit && (
                <p className="text-xs text-gray-500 mt-1">
                  {t("properties.form.cannotChangePurpose")}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.title")} *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder={t("properties.form.titlePlaceholder")}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.description")} *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder={t("properties.form.descriptionPlaceholder")}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.price")} *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.city")} *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.location")} *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder={t("properties.form.locationPlaceholder")}
                required
              />
            </div>
          </div>
        </div>

        {/* Property Specific Details */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            {t(
              `properties.propertyTypes.${formData.propertyType.toLowerCase()}`
            )}{" "}
            {t("properties.form.sections.details")}
          </h3>
          {renderPropertySpecificFields()}
        </div>

        {/* Image Upload */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            {t("properties.form.sections.images")}
          </h3>

          {/* Upload Progress */}
          {uploading && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{t("properties.form.uploadingImages")}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
              disabled={uploading}
            />
            <label
              htmlFor="image-upload"
              className={`cursor-pointer px-6 py-3 rounded-lg font-semibold inline-block transition duration-200 ${
                uploading
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {uploading
                ? t("properties.form.uploading")
                : t("properties.form.addImages")}
            </label>
            <p className="text-sm text-gray-500 mt-2">
              {t("properties.form.imageUploadHint")}
            </p>
          </div>

          {/* Image Preview */}
          {formData.images.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                {formData.images.length}{" "}
                {t("properties.form.imagesSelected", {
                  count: formData.images.length,
                })}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.tempUrl || image}
                      alt={`${t("properties.form.property")} ${index + 1}`}
                      className={`w-full h-24 object-cover rounded-lg ${
                        image.isUploading ? "opacity-50" : ""
                      }`}
                    />
                    {image.isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={uploading}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 disabled:bg-gray-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition duration-200"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isEdit
                  ? t("properties.form.updating")
                  : t("properties.form.creating")}
              </span>
            ) : (
              submitButtonText
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;
