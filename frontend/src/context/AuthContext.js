import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import axios from "../api/axios";

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Wrap verifyToken in useCallback to avoid infinite re-renders
  const verifyToken = useCallback(async () => {
    try {
      // Since we don't have a profile endpoint, we'll use a simple approach
      // In a real app, you'd have an endpoint to verify token and get user info
      if (token) {
        // For now, we'll assume the token is valid and get user from localStorage
        const userData = localStorage.getItem("user");
        if (userData) {
          setUser(JSON.parse(userData));
        }
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token, verifyToken]);

  const login = async (email, password) => {
    try {
      const response = await axios.post("/api/users/login", {
        email,
        password,
      });

      const { user: userData, token: userToken } = response.data;
      localStorage.setItem("token", userToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setToken(userToken);
      setUser(userData);
      axios.defaults.headers.common["Authorization"] = `Bearer ${userToken}`;

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Login error:", error);

      // Enhanced error handling for rate limiting
      if (error.response?.status === 429) {
        return {
          success: false,
          message: "Too many login attempts. Please try again in 15 minutes.",
        };
      }

      if (error.response?.data?.message) {
        return {
          success: false,
          message: error.response.data.message,
        };
      }

      return {
        success: false,
        message: error.message || "Login failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log("🔄 AuthContext: Sending registration request...");
      const response = await axios.post("/api/users/register", userData);

      console.log("✅ AuthContext: Registration response received:", response.data);

      // Don't automatically log in after registration
      // User needs to verify email first
      return { success: true, data: response.data };
    } catch (error) {
      console.error("❌ AuthContext: Registration error:", error);
      console.error("❌ Error response:", error.response?.data);

      // Enhanced error handling for rate limiting
      if (error.response?.status === 429) {
        return {
          success: false,
          message:
            "Too many registration attempts. Please try again in 15 minutes.",
        };
      }

      if (error.response?.data?.errors) {
        return {
          success: false,
          message: error.response.data.errors.join(", "),
          errors: error.response.data.errors,
        };
      }

      if (error.response?.data?.message) {
        return {
          success: false,
          message: error.response.data.message,
        };
      }

      return {
        success: false,
        message: error.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put("/api/users/profile", profileData);

      // Update user in state and localStorage
      const updatedUser = { ...user, ...response.data.user };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Profile update error:", error);

      // Enhanced error handling
      if (error.response?.data?.errors) {
        return {
          success: false,
          message: error.response.data.errors.join(", "),
          errors: error.response.data.errors,
        };
      }

      if (error.response?.data?.fieldErrors) {
        const fieldMessages = Object.values(error.response.data.fieldErrors);
        return {
          success: false,
          message: fieldMessages.join(", "),
          fieldErrors: error.response.data.fieldErrors,
        };
      }

      return {
        success: false,
        message: error.response?.data?.message || "Profile update failed",
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await axios.post("/api/users/forgot-password", {
        email,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Password reset request failed",
      };
    }
  };

  const resetPassword = async (resetData) => {
    try {
      const response = await axios.post("/api/users/reset-password", resetData);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        setToken(response.data.token);
      }
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Password reset failed",
      };
    }
  };

  const verifyEmail = async (token) => {
    try {
      const response = await axios.post("/api/users/verify-email", { token });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Email verification failed",
      };
    }
  };

  const resendVerification = async (email) => {
    try {
      const response = await axios.post("/api/users/resend-verification", {
        email,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to resend verification email",
      };
    }
  };

  const updateUserRole = (newRole) => {
    setUser((prevUser) => ({
      ...prevUser,
      role: newRole,
    }));

    const updatedUser = { ...user, role: newRole };
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    updateUserRole,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};