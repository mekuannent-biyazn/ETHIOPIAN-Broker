import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const ImageGallery = ({ images, propertyType, title }) => {
  const [activeImage, setActiveImage] = useState(0);
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || "en");

  React.useEffect(() => {
    const handleLanguageChange = (lng) => {
      setLanguage(lng);
    };
    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  const getPropertyIcon = () => {
    const type = propertyType || "";
    if (type.includes("Home") || type.includes("ቤት")) return "🏠";
    if (type.includes("Car") || type.includes("መኪና")) return "🚗";
    if (type.includes("Electronics") || type.includes("ኤሌክትሮኒክስ")) return "💻";
    return "🏢";
  };

  return (
    <div className="space-y-4" dir={language === "am" ? "rtl" : "ltr"}>
      {/* Main Image */}
      <div className="relative h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-lg">
        {images && images.length > 0 ? (
          <img
            src={images[activeImage]}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-8xl">{getPropertyIcon()}</span>
          </div>
        )}

        {/* Image Counter */}
        {images && images.length > 1 && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm font-medium">
            {activeImage + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images && images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setActiveImage(index)}
              className={`relative h-20 bg-gray-200 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                activeImage === index
                  ? "border-blue-500 shadow-md scale-105"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <img
                src={image}
                alt={`${title} ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {activeImage === index && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-blue-500 rounded-lg"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
