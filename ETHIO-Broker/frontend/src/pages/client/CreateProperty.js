import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import axios from "../../api/axios";
import PropertyForm from "../../components/properties/PropertyForm";

const CreateProperty = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

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
        error.response?.data?.message || t("client.propertyCreationError"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/client/my-properties");
  };

  // Define tips content based on language
  const getPropertyTips = () => {
    if (i18n.language === "am") {
      return {
        title: "የንብረት ዝርዝር ምክሮች",
        tips: [
          {
            title: "ሁግጅቱ ከፍተኛ የሆነ ፎቶዎች",
            description: "የንብረትዎን ግልጽ እና በትክክል የተበራ ምስሎች ይጫኑ",
            color: "bg-blue-500",
          },
          {
            title: "ትክክለኛ ዝርዝሮች",
            description: "ትክክለኛ መለኪያዎችን እና ባህሪያትን ያቅርቡ",
            color: "bg-green-500",
          },
          {
            title: "ተወዳዳሪ ዋጋ",
            description: "በአካባቢዎ ውስጥ ተመሳሳይ ንብረቶችን ያሰሱ",
            color: "bg-purple-500",
          },
          {
            title: "ሙሉ መግለጫ",
            description: "ብቸኛ ባህሪያትን እና መገልገያዎችን ያሳዩ",
            color: "bg-orange-500",
          },
        ],
      };
    } else {
      return {
        title: "Property Listing Tips",
        tips: [
          {
            title: "High-Quality Photos",
            description: "Upload clear, well-lit images of your property",
            color: "bg-blue-500",
          },
          {
            title: "Accurate Details",
            description: "Provide precise measurements and features",
            color: "bg-green-500",
          },
          {
            title: "Competitive Pricing",
            description: "Research similar properties in your area",
            color: "bg-purple-500",
          },
          {
            title: "Complete Description",
            description: "Highlight unique features and amenities",
            color: "bg-orange-500",
          },
        ],
      };
    }
  };

  const propertyTips = getPropertyTips();

  // Get step labels based on language
  const getStepLabels = () => {
    if (i18n.language === "am") {
      return ["የንብረት ዝርዝሮች", "ምስሎች እና ሚድያ", "ግምገማ እና አስገባ"];
    } else {
      return ["Property Details", "Images & Media", "Review & Submit"];
    }
  };

  const stepLabels = getStepLabels();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400 to-pink-500 rounded-full opacity-10 animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-5 animate-ping"></div>
      </div>

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

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        {/* Enhanced Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden mb-8 border border-white/20 transform hover:scale-105 transition-all duration-300">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-8 py-6 relative overflow-hidden">
            {/* Header background animation */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-2 left-4 w-16 h-16 bg-white rounded-full animate-pulse"></div>
              <div className="absolute bottom-2 right-4 w-12 h-12 bg-white rounded-full animate-bounce"></div>
              <div className="absolute top-1/2 right-8 w-6 h-6 bg-white rounded-full animate-ping"></div>
            </div>

            <div className="relative z-10 flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg hover:scale-110 transition-transform duration-300">
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
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  {t("client.createNewProperty")}
                </h1>
                <p className="text-blue-100 text-lg mt-1">
                  {t("client.listPropertyForSaleRent")}
                </p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mt-6 relative">
              <div className="flex items-center justify-between text-white/80 text-sm">
                {stepLabels.map((label, index) => (
                  <span key={index}>{label}</span>
                ))}
              </div>
              <div className="mt-2 bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
                  style={{
                    width: `${(currentStep / stepLabels.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Message Display */}
        {message && (
          <div
            className={`mb-8 p-6 rounded-2xl border-2 animate-slide-down shadow-lg ${
              message.includes(t("client.propertyCreatedSuccess").split("!")[0])
                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200"
                : "bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-200"
            }`}
          >
            <div className="flex items-start">
              {message.includes(
                t("client.propertyCreatedSuccess").split("!")[0],
              ) ? (
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-4">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              ) : (
                <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-4">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-lg">{message}</p>
                {message.includes(
                  t("client.propertyCreatedSuccess").split("!")[0],
                ) && (
                  <p className="text-sm mt-1 opacity-80">
                    {i18n.language === "am"
                      ? "ወደ ንብረቶችዎ በመሄድ ላይ..."
                      : "Redirecting to your properties..."}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Property Form Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <PropertyForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            submitButtonText={t("client.createProperty")}
            onStepChange={setCurrentStep}
          />
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm rounded-2xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
            <svg
              className="w-6 h-6 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            {propertyTips.title}
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div className="space-y-3">
              {propertyTips.tips.slice(0, 2).map((tip, index) => (
                <div
                  key={index}
                  className="flex items-start p-3 bg-white/50 rounded-lg"
                >
                  <div
                    className={`w-2 h-2 ${tip.color} rounded-full mr-3 mt-2`}
                  ></div>
                  <div>
                    <p className="font-semibold">{tip.title}</p>
                    <p className="text-xs opacity-80">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {propertyTips.tips.slice(2, 4).map((tip, index) => (
                <div
                  key={index}
                  className="flex items-start p-3 bg-white/50 rounded-lg"
                >
                  <div
                    className={`w-2 h-2 ${tip.color} rounded-full mr-3 mt-2`}
                  ></div>
                  <div>
                    <p className="font-semibold">{tip.title}</p>
                    <p className="text-xs opacity-80">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-down {
          animation: slide-down 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CreateProperty;
