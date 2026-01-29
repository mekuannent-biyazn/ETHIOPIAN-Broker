import axios from "axios";

// ✅ KEEP: Your existing base URL without /api
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL || "https://ethiopian-broker.onrender.com"
    : "http://localhost:9000";

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 second timeout
});

// Request interceptor with enhanced logging
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Enhanced logging for debugging
    console.log(
      `🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${
        config.url
      }`,
      {
        data: config.data,
        hasToken: !!token,
        headers: config.headers,
      },
    );

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor with enhanced error handling
instance.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`, {
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error(
      `❌ API Error: ${error.response?.status} ${error.config?.baseURL}${error.config?.url}`,
      {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      },
    );

    // Handle specific error cases
    if (error.response?.status === 429) {
      error.message = "Too many requests. Please try again later.";
    }

    if (error.code === "NETWORK_ERROR" || error.message === "Network Error") {
      error.message = "Network error. Please check your internet connection.";
    }

    if (error.code === "ECONNABORTED") {
      error.message = "Request timeout. Please try again.";
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      error.message = "Session expired. Please login again.";
      // Optional: Redirect to login page after a delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    }

    if (
      error.response?.status === 403 &&
      error.response?.data?.message?.includes("deactivated")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      error.message =
        "Your account has been deactivated. Please contact the administrator.";
      // Optional: Redirect to login page after a delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    }

    if (error.response?.status === 400) {
      const errorData = error.response.data;
      if (errorData.error) {
        error.message = errorData.error;
      } else if (errorData.message) {
        error.message = errorData.message;
      }
    }

    if (error.response?.status === 404) {
      error.message = `Endpoint not found: ${error.config?.url}. Please check the API route.`;
    }

    if (error.response?.status === 500) {
      error.message = "Server error. Please try again later.";
    }

    return Promise.reject(error);
  },
);

export default instance;
