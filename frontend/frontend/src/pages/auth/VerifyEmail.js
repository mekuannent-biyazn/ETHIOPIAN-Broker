import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const { verifyEmail, resendVerification } = useAuth();
  const { t } = useTranslation();

  const handleVerification = useCallback(
    async (token) => {
      setLoading(true);
      const result = await verifyEmail(token);

      if (result.success) {
        setMessage(t("auth.emailVerifiedSuccess"));
        setIsVerified(true);
      } else {
        setMessage(result.message);
      }
      setLoading(false);
    },
    [verifyEmail, t]
  );

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      handleVerification(token);
    }
  }, [searchParams, handleVerification]);

  const handleResendVerification = async () => {
    if (!email) {
      setMessage(t("auth.enterEmailAddress"));
      return;
    }

    setLoading(true);
    const result = await resendVerification(email);

    if (result.success) {
      setMessage(t("auth.verificationEmailSent"));
    } else {
      setMessage(result.message);
    }
    setLoading(false);
  };

  const handleManualVerificationRequest = () => {
    setMessage(t("auth.manualVerificationRequest"));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t("auth.emailVerification")}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t("auth.verifyEmailToActivate")}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          {isVerified ? (
            <div className="text-center">
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("auth.emailVerifiedSuccess")}
              </h3>
              <p className="text-gray-600 mb-4">
                {t("auth.emailVerifiedMessage")}
              </p>
              <Link to="/login" className="btn-primary inline-block">
                {t("auth.goToLogin")}
              </Link>
            </div>
          ) : (
            <div className="text-center">
              {searchParams.get("token") ? (
                <div>
                  <div className="loader mx-auto mb-4"></div>
                  <p className="text-gray-600">{t("auth.verifyingEmail")}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Automatic Verification */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {t("auth.resendVerificationEmail")}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t("auth.enterEmailForVerification")}
                    </p>
                    <input
                      type="email"
                      placeholder={t("auth.enterYourEmail")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input mb-4"
                    />
                    <button
                      onClick={handleResendVerification}
                      disabled={loading}
                      className="btn-primary w-full"
                    >
                      {loading
                        ? t("common.sending")
                        : t("auth.resendVerificationEmail")}
                    </button>
                  </div>

                  {/* Manual Verification Option */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {t("auth.needHelpVerifying")}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {t("auth.manualVerificationHelp")}
                    </p>
                    <button
                      onClick={handleManualVerificationRequest}
                      className="btn-secondary w-full"
                    >
                      {t("auth.requestManualVerification")}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      {t("auth.manualVerificationTime")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {message && (
            <div
              className={`mt-4 p-3 rounded-md ${
                message.includes("successful") ||
                message.includes("sent") ||
                message.includes("notified")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          {/* Contact Information */}
          {!isVerified && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                {t("auth.contactSupport")}
              </h4>
              <p className="text-blue-700 text-sm">
                {t("auth.supportEmail")}: mekuannentbiyazn@gmail.com
                <br />
                {t("auth.supportPhone")}: +251 123 456 789
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
