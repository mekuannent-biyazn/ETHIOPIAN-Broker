// import React from "react";
// import { useTranslation } from "react-i18next";

// const Loader = ({ size = "medium", text = null }) => {
//   const { t } = useTranslation();

//   const sizeClasses = {
//     small: "w-6 h-6",
//     medium: "w-12 h-12",
//     large: "w-16 h-16",
//   };

//   const displayText = text || t("common.loading");

//   return (
//     <div className="flex flex-col items-center justify-center p-4">
//       <div
//         className={`loader border-4 border-t-4 border-gray-200 border-t-blue-600 rounded-full animate-spin ${sizeClasses[size]}`}
//       ></div>
//       {displayText && <p className="mt-2 text-gray-600">{displayText}</p>}
//     </div>
//   );
// };

// export default Loader;

import React from "react";
import { useTranslation } from "react-i18next";

const Loader = ({
  size = "medium",
  text = null,
  type = "spinner",
  fullScreen = false,
  color = "primary",
}) => {
  const { t } = useTranslation();

  const sizeClasses = {
    small: {
      spinner: "w-8 h-8 border-3",
      dots: "w-6 h-6",
      bar: "w-32 h-2",
    },
    medium: {
      spinner: "w-16 h-16 border-4",
      dots: "w-12 h-12",
      bar: "w-48 h-3",
    },
    large: {
      spinner: "w-24 h-24 border-6",
      dots: "w-20 h-20",
      bar: "w-64 h-4",
    },
  };

  const colorClasses = {
    primary: {
      spinner: "border-gray-200 border-t-[#FF4747]",
      dots: "bg-[#FF4747]",
      bar: "bg-gradient-to-r from-[#FF4747] to-orange-500",
    },
    white: {
      spinner: "border-gray-300 border-t-white",
      dots: "bg-white",
      bar: "bg-white",
    },
    blue: {
      spinner: "border-gray-200 border-t-blue-600",
      dots: "bg-blue-600",
      bar: "bg-blue-600",
    },
  };

  const displayText = text || t("common.loading");

  // Spinner Loader
  const renderSpinner = () => (
    <div
      className={`${sizeClasses[size].spinner} rounded-full animate-spin ${colorClasses[color].spinner}`}
    ></div>
  );

  // Dots Loader (like AliExpress dots)
  const renderDots = () => (
    <div
      className={`${sizeClasses[size].dots} flex items-center justify-center space-x-1`}
    >
      <div
        className={`w-3 h-3 rounded-full ${colorClasses[color].dots} animate-bounce`}
        style={{ animationDelay: "0s" }}
      ></div>
      <div
        className={`w-3 h-3 rounded-full ${colorClasses[color].dots} animate-bounce`}
        style={{ animationDelay: "0.2s" }}
      ></div>
      <div
        className={`w-3 h-3 rounded-full ${colorClasses[color].dots} animate-bounce`}
        style={{ animationDelay: "0.4s" }}
      ></div>
    </div>
  );

  // Progress Bar Loader
  const renderProgressBar = () => (
    <div
      className={`${sizeClasses[size].bar} bg-gray-200 rounded-full overflow-hidden`}
    >
      <div
        className={`h-full ${colorClasses[color].bar} animate-progress rounded-full`}
      ></div>
    </div>
  );

  // Skeleton Loader (for content placeholders)
  const renderSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="flex space-x-4">
        <div
          className={`w-12 h-12 ${colorClasses[color].dots} opacity-20 rounded-full`}
        ></div>
        <div className="flex-1 space-y-3">
          <div
            className={`h-4 ${colorClasses[color].dots} opacity-20 rounded w-3/4`}
          ></div>
          <div
            className={`h-3 ${colorClasses[color].dots} opacity-20 rounded w-1/2`}
          ></div>
        </div>
      </div>
    </div>
  );

  // Modern AliExpress-style pulsing circles
  const renderPulse = () => (
    <div className="relative">
      <div
        className={`${sizeClasses[size].dots} ${colorClasses[color].dots} rounded-full animate-ping opacity-75`}
      ></div>
      <div
        className={`${sizeClasses[size].dots} ${colorClasses[color].dots} rounded-full absolute top-0 left-0`}
      ></div>
    </div>
  );

  const renderLoader = () => {
    switch (type) {
      case "dots":
        return renderDots();
      case "progress":
        return renderProgressBar();
      case "skeleton":
        return renderSkeleton();
      case "pulse":
        return renderPulse();
      case "spinner":
      default:
        return renderSpinner();
    }
  };

  // Full screen loader
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex flex-col items-center justify-center">
        <div className="mb-4">
          {/* Logo or brand */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-[#FF4747] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">E</span>
            </div>
            <span className="ml-3 font-bold text-2xl text-gray-900">
              ETHIO<span className="text-[#FF4747]">Broker</span>
            </span>
          </div>

          {renderLoader()}
        </div>
        <div className="text-center">
          <p className="text-gray-600 font-medium">{displayText}</p>
          <p className="text-sm text-gray-400 mt-2">{t("common.pleaseWait")}</p>
        </div>

        {/* Progress percentage for progress bar */}
        {type === "progress" && (
          <div className="mt-4 text-sm text-gray-500">
            {t("common.loadingProgress")}...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {renderLoader()}
      {displayText && (
        <p
          className={`mt-4 text-gray-600 font-medium ${
            type === "skeleton" ? "hidden" : ""
          }`}
        >
          {displayText}
        </p>
      )}
    </div>
  );
};

export default Loader;
