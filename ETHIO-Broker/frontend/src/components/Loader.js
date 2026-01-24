import React from "react";
import { useTranslation } from "react-i18next";

const Loader = ({ size = "medium", text = null }) => {
  const { t } = useTranslation();

  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-12 h-12",
    large: "w-16 h-16",
  };

  const displayText = text || t("common.loading");

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className={`loader border-4 border-t-4 border-gray-200 border-t-blue-600 rounded-full animate-spin ${sizeClasses[size]}`}
      ></div>
      {displayText && <p className="mt-2 text-gray-600">{displayText}</p>}
    </div>
  );
};

export default Loader;
