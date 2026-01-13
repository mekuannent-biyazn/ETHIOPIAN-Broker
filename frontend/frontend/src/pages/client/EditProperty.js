import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import axios from "../../api/axios";

const EditProperty = () => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [property, setProperty] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await axios.get("/api/property/my-properties");
      const myProperty = response.data.properties.find(
        (prop) => prop._id === id
      );

      if (myProperty) {
        setProperty(myProperty);
        setFormData({
          title: myProperty.title || "",
          description: myProperty.description || "",
          price: myProperty.price || "",
          currency: myProperty.currency || "ETB",
          city: myProperty.city || "",
          location: myProperty.location || "",
          images: myProperty.images || [],
          homeDetails: myProperty.homeDetails || {
            size: "",
            bedrooms: "",
            bathrooms: "",
            floors: "",
            yearBuilt: "",
            amenities: "",
            condition: "Good",
          },
          carDetails: myProperty.carDetails || {
            brand: "",
            model: "",
            year: "",
            mileage: "",
            fuelType: "Petrol",
            transmission: "Manual",
          },
          electronicsDetails: myProperty.electronicsDetails || {
            category: "",
            brand: "",
            model: "",
            specifications: "",
            condition: "New",
            warranty: false,
            warrantyPeriod: "",
          },
        });
      } else {
        setMessage(t("client.propertyNotFound"));
      }
    } catch (error) {
      console.error("Error fetching property:", error);
      setMessage(t("client.propertyLoadError"));
    } finally {
      setFetchLoading(false);
    }
  };

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
    const newImageUrls = files.map((file) => URL.createObjectURL(file));

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImageUrls],
    }));

    setMessage(`${files.length} ${t("client.imagesAdded")}`);
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const hasChanges = () => {
    if (!property) return false;

    const basicFieldsChanged =
      formData.title !== property.title ||
      formData.description !== property.description ||
      formData.price !== property.price ||
      formData.currency !== property.currency ||
      formData.city !== property.city ||
      formData.location !== property.location;

    const imagesChanged = formData.images.length !== property.images.length;

    let detailsChanged = false;

    if (property.propertyType === "Home" && property.homeDetails) {
      const homeDetails = property.homeDetails;
      detailsChanged =
        formData.homeDetails.size !== homeDetails.size ||
        formData.homeDetails.bedrooms !== homeDetails.bedrooms ||
        formData.homeDetails.bathrooms !== homeDetails.bathrooms ||
        formData.homeDetails.floors !== homeDetails.floors ||
        formData.homeDetails.yearBuilt !== homeDetails.yearBuilt ||
        formData.homeDetails.amenities !== homeDetails.amenities ||
        formData.homeDetails.condition !== homeDetails.condition;
    } else if (property.propertyType === "Car" && property.carDetails) {
      const carDetails = property.carDetails;
      detailsChanged =
        formData.carDetails.brand !== carDetails.brand ||
        formData.carDetails.model !== carDetails.model ||
        formData.carDetails.year !== carDetails.year ||
        formData.carDetails.mileage !== carDetails.mileage ||
        formData.carDetails.fuelType !== carDetails.fuelType ||
        formData.carDetails.transmission !== carDetails.transmission;
    } else if (
      property.propertyType === "Electronics" &&
      property.electronicsDetails
    ) {
      const electronicsDetails = property.electronicsDetails;
      detailsChanged =
        formData.electronicsDetails.category !== electronicsDetails.category ||
        formData.electronicsDetails.brand !== electronicsDetails.brand ||
        formData.electronicsDetails.model !== electronicsDetails.model ||
        formData.electronicsDetails.specifications !==
          electronicsDetails.specifications ||
        formData.electronicsDetails.condition !==
          electronicsDetails.condition ||
        formData.electronicsDetails.warranty !== electronicsDetails.warranty ||
        formData.electronicsDetails.warrantyPeriod !==
          electronicsDetails.warrantyPeriod;
    }

    return basicFieldsChanged || imagesChanged || detailsChanged;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!hasChanges()) {
        setMessage(t("client.noChangesDetected"));
        setLoading(false);
        return;
      }

      const updateData = {};

      if (formData.title !== property.title)
        updateData.title = formData.title.trim();
      if (formData.description !== property.description)
        updateData.description = formData.description.trim();
      if (formData.price !== property.price)
        updateData.price = Number(formData.price);
      if (formData.currency !== property.currency)
        updateData.currency = formData.currency;
      if (formData.city !== property.city)
        updateData.city = formData.city.trim();
      if (formData.location !== property.location)
        updateData.location = formData.location.trim();

      if (formData.images.length !== property.images.length) {
        updateData.images = formData.images;
      }

      if (property.propertyType === "Home" && property.homeDetails) {
        const homeDetails = property.homeDetails;
        const homeUpdate = {};

        if (formData.homeDetails.size !== homeDetails.size)
          homeUpdate.size = Number(formData.homeDetails.size);
        if (formData.homeDetails.bedrooms !== homeDetails.bedrooms)
          homeUpdate.bedrooms = Number(formData.homeDetails.bedrooms);
        if (formData.homeDetails.bathrooms !== homeDetails.bathrooms)
          homeUpdate.bathrooms = Number(formData.homeDetails.bathrooms);
        if (formData.homeDetails.floors !== homeDetails.floors)
          homeUpdate.floors = Number(formData.homeDetails.floors);
        if (formData.homeDetails.yearBuilt !== homeDetails.yearBuilt)
          homeUpdate.yearBuilt = Number(formData.homeDetails.yearBuilt);
        if (formData.homeDetails.amenities !== homeDetails.amenities)
          homeUpdate.amenities = formData.homeDetails.amenities.trim();
        if (formData.homeDetails.condition !== homeDetails.condition)
          homeUpdate.condition = formData.homeDetails.condition;

        if (Object.keys(homeUpdate).length > 0) {
          updateData.homeDetails = homeUpdate;
        }
      } else if (property.propertyType === "Car" && property.carDetails) {
        const carDetails = property.carDetails;
        const carUpdate = {};

        if (formData.carDetails.brand !== carDetails.brand)
          carUpdate.brand = formData.carDetails.brand.trim();
        if (formData.carDetails.model !== carDetails.model)
          carUpdate.model = formData.carDetails.model.trim();
        if (formData.carDetails.year !== carDetails.year)
          carUpdate.year = Number(formData.carDetails.year);
        if (formData.carDetails.mileage !== carDetails.mileage)
          carUpdate.mileage = Number(formData.carDetails.mileage);
        if (formData.carDetails.fuelType !== carDetails.fuelType)
          carUpdate.fuelType = formData.carDetails.fuelType;
        if (formData.carDetails.transmission !== carDetails.transmission)
          carUpdate.transmission = formData.carDetails.transmission;

        if (Object.keys(carUpdate).length > 0) {
          updateData.carDetails = carUpdate;
        }
      } else if (
        property.propertyType === "Electronics" &&
        property.electronicsDetails
      ) {
        const electronicsDetails = property.electronicsDetails;
        const electronicsUpdate = {};

        if (
          formData.electronicsDetails.category !== electronicsDetails.category
        )
          electronicsUpdate.category =
            formData.electronicsDetails.category.trim();
        if (formData.electronicsDetails.brand !== electronicsDetails.brand)
          electronicsUpdate.brand = formData.electronicsDetails.brand.trim();
        if (formData.electronicsDetails.model !== electronicsDetails.model)
          electronicsUpdate.model = formData.electronicsDetails.model.trim();
        if (
          formData.electronicsDetails.specifications !==
          electronicsDetails.specifications
        )
          electronicsUpdate.specifications =
            formData.electronicsDetails.specifications.trim();
        if (
          formData.electronicsDetails.condition !== electronicsDetails.condition
        )
          electronicsUpdate.condition = formData.electronicsDetails.condition;
        if (
          formData.electronicsDetails.warranty !== electronicsDetails.warranty
        )
          electronicsUpdate.warranty = formData.electronicsDetails.warranty;
        if (
          formData.electronicsDetails.warrantyPeriod !==
          electronicsDetails.warrantyPeriod
        )
          electronicsUpdate.warrantyPeriod =
            formData.electronicsDetails.warrantyPeriod.trim();

        if (Object.keys(electronicsUpdate).length > 0) {
          updateData.electronicsDetails = electronicsUpdate;
        }
      }

      console.log("📤 Sending update data:", updateData);

      if (Object.keys(updateData).length === 0) {
        setMessage(t("client.noChangesDetected"));
        setLoading(false);
        return;
      }

      const response = await axios.put(`/api/property/${id}`, updateData);

      if (response.data.success) {
        setMessage(t("client.propertyUpdatedSuccess"));

        setTimeout(() => {
          navigate("/client/my-properties");
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating property:", error);

      if (error.response?.data?.message) {
        setMessage(`❌ ${error.response.data.message}`);
      } else {
        setMessage(t("client.propertyUpdateError"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/client/my-properties");
  };

  const renderPropertySpecificFields = () => {
    if (!property) return null;

    switch (property.propertyType) {
      case "Home":
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">
              {t("client.homeDetails")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.size")} (sqft)
                </label>
                <input
                  type="number"
                  value={formData.homeDetails.size}
                  onChange={(e) =>
                    handleNestedChange("homeDetails", "size", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.bedrooms")}
                </label>
                <input
                  type="number"
                  value={formData.homeDetails.bedrooms}
                  onChange={(e) =>
                    handleNestedChange(
                      "homeDetails",
                      "bedrooms",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.bathrooms")}
                </label>
                <input
                  type="number"
                  value={formData.homeDetails.bathrooms}
                  onChange={(e) =>
                    handleNestedChange(
                      "homeDetails",
                      "bathrooms",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.floors")}
                </label>
                <input
                  type="number"
                  value={formData.homeDetails.floors}
                  onChange={(e) =>
                    handleNestedChange("homeDetails", "floors", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.yearBuilt")}
                </label>
                <input
                  type="number"
                  value={formData.homeDetails.yearBuilt}
                  onChange={(e) =>
                    handleNestedChange(
                      "homeDetails",
                      "yearBuilt",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.condition")}
                </label>
                <select
                  value={formData.homeDetails.condition}
                  onChange={(e) =>
                    handleNestedChange(
                      "homeDetails",
                      "condition",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Excellent">{t("client.excellent")}</option>
                  <option value="Good">{t("client.good")}</option>
                  <option value="Fair">{t("client.fair")}</option>
                  <option value="Needs Repair">
                    {t("client.needsRepair")}
                  </option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.amenities")}
                </label>
                <textarea
                  value={formData.homeDetails.amenities}
                  onChange={(e) =>
                    handleNestedChange(
                      "homeDetails",
                      "amenities",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder={t("client.amenitiesPlaceholder")}
                  rows="3"
                />
              </div>
            </div>
          </div>
        );

      case "Car":
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">
              {t("client.carDetails")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.brand")}
                </label>
                <input
                  type="text"
                  value={formData.carDetails.brand}
                  onChange={(e) =>
                    handleNestedChange("carDetails", "brand", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder={t("client.brandPlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.model")}
                </label>
                <input
                  type="text"
                  value={formData.carDetails.model}
                  onChange={(e) =>
                    handleNestedChange("carDetails", "model", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder={t("client.modelPlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.year")}
                </label>
                <input
                  type="number"
                  value={formData.carDetails.year}
                  onChange={(e) =>
                    handleNestedChange("carDetails", "year", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.mileage")} (km)
                </label>
                <input
                  type="number"
                  value={formData.carDetails.mileage}
                  onChange={(e) =>
                    handleNestedChange("carDetails", "mileage", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.fuelType")}
                </label>
                <select
                  value={formData.carDetails.fuelType}
                  onChange={(e) =>
                    handleNestedChange("carDetails", "fuelType", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Petrol">{t("client.petrol")}</option>
                  <option value="Diesel">{t("client.diesel")}</option>
                  <option value="Electric">{t("client.electric")}</option>
                  <option value="Hybrid">{t("client.hybrid")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.transmission")}
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
                >
                  <option value="Manual">{t("client.manual")}</option>
                  <option value="Automatic">{t("client.automatic")}</option>
                </select>
              </div>
            </div>
          </div>
        );

      case "Electronics":
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">
              {t("client.electronicsDetails")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.category")}
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
                  placeholder={t("client.categoryPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.brand")}
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
                  placeholder={t("client.brandPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.model")}
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
                  placeholder={t("client.modelPlaceholder")}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.specifications")}
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
                  placeholder={t("client.specificationsPlaceholder")}
                  rows="4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("client.condition")}
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
                >
                  <option value="New">{t("client.new")}</option>
                  <option value="Used">{t("client.used")}</option>
                  <option value="Refurbished">{t("client.refurbished")}</option>
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
                  {t("client.hasWarranty")}
                </label>
              </div>

              {formData.electronicsDetails.warranty && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("client.warrantyPeriod")}
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
                    placeholder={t("client.warrantyPeriodPlaceholder")}
                  />
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canEditProperty =
    property &&
    (property.owner?.userId === user._id ||
      property.createdBy === user._id ||
      user.role === "admin");

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">
              {t("client.loadingPropertyDetails")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {t("client.propertyNotFound")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("client.propertyNotFoundDescription")}
            </p>
            <button
              onClick={() => navigate("/client/my-properties")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              {t("client.backToMyProperties")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!canEditProperty) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🚫</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {t("client.accessDenied")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("client.notAuthorizedEdit")}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/client/my-properties")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold block w-full"
              >
                {t("client.backToMyProperties")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">
              {t("client.editProperty")}
            </h1>
            <p className="text-yellow-100">{t("client.updatePropertyTip")}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {property.status === "Available" && property.approvedByAdmin && (
                <span className="bg-green-500 bg-opacity-20 text-green-100 px-3 py-1 rounded text-sm">
                  ✓ {t("client.currentlyApprovedAvailable")}
                </span>
              )}
              <span className="bg-blue-500 bg-opacity-20 text-blue-100 px-3 py-1 rounded text-sm capitalize">
                {property.propertyType} {t("client.for")} {property.purpose}
              </span>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
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

        {/* Edit Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-blue-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-blue-700 text-sm">
                <strong>{t("client.tip")}:</strong>{" "}
                {t("client.updatePropertyTip")}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Section */}
            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                {t("client.basicInformation")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("client.title")}
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t("client.enterPropertyTitle")}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("client.description")}
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t("client.describePropertyDetail")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("client.price")} (ETB)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("client.currency")}
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ETB">ETB - Ethiopian Birr</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("client.city")}
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("client.location")}
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t("client.specificAddress")}
                  />
                </div>
              </div>
            </div>

            {/* Property Specific Details Section */}
            <div className="border-b pb-6">
              {renderPropertySpecificFields()}
            </div>

            {/* Images Section */}
            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                {t("client.propertyImages")}
              </h3>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-block transition duration-200"
                  >
                    {t("client.addMoreImages")}
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    {t("client.uploadAdditionalImages")}
                  </p>
                </div>

                {/* Image Preview */}
                {formData.images.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {formData.images.length} {t("client.imagesSelected")}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`${t("client.property")} ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 font-semibold"
              >
                {t("client.cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition duration-200"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {t("client.updating")}
                  </span>
                ) : (
                  t("client.updateProperty")
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProperty;
