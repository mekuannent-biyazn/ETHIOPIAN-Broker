

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const EmptyState = () => {
  const { t } = useTranslation();

  return (
    <div className="text-center py-16 bg-white rounded-lg shadow border-2 border-dashed border-gray-300">
      <div className="text-6xl mb-4">🏠</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        {t("properties.emptyState.title")}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {t("properties.emptyState.description")}
      </p>
      <Link
        to="/create-property"
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center gap-2"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        {t("properties.emptyState.button")}
      </Link>
    </div>
  );
};

export default EmptyState;
