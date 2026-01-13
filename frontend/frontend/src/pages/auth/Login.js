import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { validators } from "../../utils/validators";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const validateField = (name, value) => {
    switch (name) {
      case "email":
        return validators.validateEmail(value);
      case "password":
        return validators.validatePassword(value);
      default:
        return { isValid: true, message: "" };
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Real-time validation
    const validation = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: validation.isValid ? "" : validation.message,
    }));
  };

  const getInputClass = (fieldName) => {
    const baseClass =
      "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200";
    if (fieldErrors[fieldName]) {
      return `${baseClass} border-red-500 bg-red-50`;
    }
    return `${baseClass} border-gray-300`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validate form
    const emailValidation = validators.validateEmail(formData.email);
    const passwordValidation = validators.validatePassword(formData.password);

    if (!emailValidation.isValid || !passwordValidation.isValid) {
      setFieldErrors({
        email: emailValidation.message,
        password: passwordValidation.message,
      });
      setLoading(false);
      return;
    }

    const result = await login(
      formData.email.toLowerCase().trim(),
      formData.password
    );

    if (result.success) {
      setMessage(t("success.login"));

      // Redirect based on user role
      const user = result.data.user;
      setTimeout(() => {
        switch (user.role) {
          case "admin":
            navigate("/admin");
            break;
          case "broker":
            navigate("/broker");
            break;
          case "client":
            navigate("/client");
            break;
          default:
            navigate("/");
        }
      }, 1000);
    } else {
      // Enhanced error handling for rate limiting and various error cases
      if (result.message?.includes("Too many requests")) {
        setMessage(t("errors.tooManyRequests"));
      } else if (result.message?.includes("not verified")) {
        setMessage(
          <span>
            {t("errors.emailNotVerified")}{" "}
            <Link
              to="/verify-email"
              className="text-blue-600 hover:text-blue-500 underline"
            >
              {t("auth.resendVerification")}
            </Link>
          </span>
        );
      } else if (
        result.message?.includes("Invalid Password") ||
        result.message?.includes("not registered")
      ) {
        setMessage(t("errors.invalidCredentials"));
      } else {
        setMessage(result.message || t("errors.loginFailed"));
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">EB</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t("auth.signIn")}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t("auth.noAccount")}{" "}
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {t("auth.createAccount")}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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
                className={getInputClass("email")}
                placeholder={t("auth.emailPlaceholder")}
                value={formData.email}
                onChange={handleChange}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("auth.password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={getInputClass("password")}
                placeholder={t("auth.password")}
                value={formData.password}
                onChange={handleChange}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900"
              >
                {t("auth.rememberMe")}
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>
          </div>

          {message && (
            <div
              className={`p-4 rounded-md border ${
                typeof message === "string" && message.includes("successful")
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-red-100 text-red-700 border-red-200"
              }`}
            >
              <div className="flex items-start">
                {typeof message === "string" &&
                message.includes("successful") ? (
                  <span className="text-green-500 mr-2 mt-0.5">✓</span>
                ) : (
                  <span className="text-red-500 mr-2 mt-0.5">⚠</span>
                )}
                <div className="flex-1">{message}</div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t("auth.signingIn")}
                </span>
              ) : (
                t("auth.signIn")
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">{t("auth.secureLogin")}</p>
          </div>
        </form>

        {/* Demo Accounts Info */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">
            {t("auth.demoAccounts")}
          </h4>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>
              <strong>{t("users.admin")}:</strong> {t("auth.demoAdmin")}
            </div>
            <div>
              <strong>{t("users.broker")}:</strong> {t("auth.demoBroker")}
            </div>
            <div>
              <strong>{t("users.client")}:</strong> {t("auth.demoClient")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
