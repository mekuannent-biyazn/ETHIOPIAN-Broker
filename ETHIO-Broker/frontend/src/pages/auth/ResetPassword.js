import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isValidToken, setIsValidToken] = useState(true);

  const { resetPassword } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const id = searchParams.get("id");

    if (!token || !id) {
      setIsValidToken(false);
      setMessage("Invalid or missing reset token.");
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords don't match");
      setLoading(false);
      return;
    }

    const token = searchParams.get("token");
    const id = searchParams.get("id");

    const result = await resetPassword({
      token,
      id,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    if (result.success) {
      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } else {
      setMessage(result.message);
    }

    setLoading(false);
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900">
            Invalid Reset Link
          </h2>
          <p className="text-gray-600 mb-4">
            The password reset link is invalid or has expired.
          </p>
          <Link to="/forgot-password" className="btn-primary">
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your new password below.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="form-input mt-1"
              placeholder="Enter new password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="form-input mt-1"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-md ${
                message.includes("successful")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
