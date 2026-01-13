import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import axios from "../../api/axios";
import PropertyForm from "../../components/properties/PropertyForm";

const CreateProperty = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (formData) => {
    setLoading(true);
    setMessage("");

    try {
      // Add user info to the property data
      const propertyData = {
        ...formData,
        createdBy: user._id,
        owner: {
          userId: user._id,
          fname: user.fname,
          lname: user.lname,
          email: user.email,
          phone: user.phone,
        },
      };

      const response = await axios.post("/api/property", propertyData);

      if (response.data.success) {
        setMessage(t("client.propertyCreatedSuccess"));

        // Redirect to my properties page after successful creation
        setTimeout(() => {
          navigate("/client/my-properties");
        }, 2000);
      }
    } catch (error) {
      console.error("Error creating property:", error);
      setMessage(
        error.response?.data?.message || t("client.propertyCreationError")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/client/my-properties");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">
              {t("client.createNewProperty")}
            </h1>
            <p className="text-blue-100">
              {t("client.listPropertyForSaleRent")}
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("success")
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <PropertyForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          submitButtonText={t("client.createProperty")}
        />
      </div>
    </div>
  );
};

export default CreateProperty;
