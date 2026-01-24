import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { validators } from "../../utils/validators";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { forgotPassword } = useAuth();
  const { t } = useTranslation();

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    // Real-time validation
    const validation = validators.validateEmail(value);
    setEmailError(validation.isValid ? "" : validation.message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validate email
    const validation = validators.validateEmail(email);
    if (!validation.isValid) {
      setEmailError(validation.message);
      setLoading(false);
      return;
    }

    const result = await forgotPassword(email.toLowerCase().trim());

    if (result.success) {
      setMessage(t("success.passwordReset"));
      setIsSubmitted(true);
    } else {
      setMessage(result.message);
    }

    setLoading(false);
  };

  const getInputClass = () => {
    const baseClass =
      "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";
    if (emailError) {
      return `${baseClass} border-red-500`;
    }
    return `${baseClass} border-gray-300`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t("auth.resetPassword")}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t("auth.hasAccount")}{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {t("auth.signIn")}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("auth.email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={getInputClass()}
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={handleEmailChange}
              disabled={isSubmitted}
            />
            {emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
            )}
          </div>

          {message && (
            <div
              className={`p-3 rounded-md ${
                message.includes("sent") || message.includes("success")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          {!isSubmitted ? (
            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? t("common.loading") : t("auth.resetPassword")}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">{t("success.passwordReset")}</p>
              <Link to="/login" className="btn-secondary">
                {t("auth.backToLogin")}
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
