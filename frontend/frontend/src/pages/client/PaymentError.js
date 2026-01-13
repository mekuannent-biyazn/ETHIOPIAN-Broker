import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const PaymentError = () => {
  const [searchParams] = useSearchParams();
  const message =
    searchParams.get("message") || t("client.paymentProcessingFailed");
  const paymentId = searchParams.get("payment_id");
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 text-white py-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {t("client.paymentFailed")}
            </h1>
            <p className="text-xl opacity-90">
              {t("client.paymentFailedDescription")}
            </p>
          </div>

          {/* Error Details */}
          <div className="p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                {t("client.whatHappened")}
              </h2>
              <p className="text-red-700">{message}</p>
              {paymentId && (
                <p className="text-red-600 text-sm mt-2">
                  {t("client.referenceId")}: {paymentId}
                </p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-yellow-800 mb-2">
                {t("client.whatYouCanDo")}
              </h2>
              <ul className="text-yellow-700 space-y-2">
                <li>• {t("client.checkFunds")}</li>
                <li>• {t("client.verifyDetails")}</li>
                <li>• {t("client.tryDifferentMethod")}</li>
                <li>• {t("client.contactBank")}</li>
                <li>• {t("client.contactSupport")}</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/client"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-4 px-6 rounded-lg font-semibold text-lg transition duration-200"
              >
                {t("client.goToDashboard")}
              </Link>
              <Link
                to="/properties"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-4 px-6 rounded-lg font-semibold text-lg transition duration-200"
              >
                {t("client.tryAgain")}
              </Link>
              <button
                onClick={() => window.history.back()}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-center py-4 px-6 rounded-lg font-semibold text-lg transition duration-200"
              >
                {t("client.goBack")}
              </button>
            </div>

            {/* Support Info */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                {t("client.needHelp")}{" "}
                <a
                  href="mailto:support@ethiobroker.com"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  support@ethiobroker.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentError;
