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
  const [token, setToken] = useState(() => {
    // Safely get token from localStorage
    try {
      return localStorage.getItem("token");
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return null;
    }
  });

  // Communication-related states
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Safe localStorage functions
  const safeGetItem = (key) => {
    try {
      const item = localStorage.getItem(key);
      // Check if item is "undefined" string or actually undefined
      return item === "undefined" || item === undefined ? null : item;
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return null;
    }
  };

  const safeSetItem = (key, value) => {
    try {
      if (value === undefined || value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Error setting ${key} in localStorage:`, error);
    }
  };

  // Wrap verifyToken in useCallback to avoid infinite re-renders
  const verifyToken = useCallback(async () => {
    try {
      if (token) {
        const userData = safeGetItem("user");
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            if (parsedUser && typeof parsedUser === "object") {
              setUser(parsedUser);
              setIsAuthenticated(true);

              // Load unread message count when user is authenticated
              loadUnreadCount();
            } else {
              console.warn("Invalid user data in localStorage");
              logout();
            }
          } catch (parseError) {
            console.error("Error parsing user data:", parseError);
            logout();
          }
        } else {
          // No user data found, but we have a token - try to validate it
          try {
            const response = await axios.get("/api/users/me"); // You might need to create this endpoint
            if (response.data.success) {
              setUser(response.data.user);
              safeSetItem("user", JSON.stringify(response.data.user));
              setIsAuthenticated(true);
              loadUnreadCount();
            } else {
              logout();
            }
          } catch (apiError) {
            console.error("Error validating token:", apiError);
            logout();
          }
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load unread message count for communication functionality
  const loadUnreadCount = async () => {
    try {
      const response = await axios.get("/api/communication/unread-count");
      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to load unread count:", error);
      // Don't set unread count to 0 on error, keep previous value
    }
  };

  // Update unread count (for communication system)
  const updateUnreadCount = (count) => {
    setUnreadCount(count);
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      verifyToken();
    } else {
      setLoading(false);
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [token, verifyToken]);

  const login = async (email, password) => {
    try {
      const response = await axios.post("/api/users/login", {
        email,
        password,
      });

      const { user: userData, token: userToken } = response.data;

      // Safely store token and user data
      safeSetItem("token", userToken);
      safeSetItem("user", JSON.stringify(userData));

      setToken(userToken);
      setUser(userData);
      setIsAuthenticated(true);
      axios.defaults.headers.common["Authorization"] = `Bearer ${userToken}`;

      // Load unread count after successful login
      loadUnreadCount();

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Login error:", error);

      // Clear any invalid data
      logout();

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
      const response = await axios.post("/api/users/register", userData);
      const { token: userToken, user: newUser } = response.data;

      if (userToken && newUser) {
        // Safely store token and user data
        safeSetItem("token", userToken);
        safeSetItem("user", JSON.stringify(newUser));

        setToken(userToken);
        setUser(newUser);
        setIsAuthenticated(true);
        axios.defaults.headers.common["Authorization"] = `Bearer ${userToken}`;

        // Load unread count after successful registration
        loadUnreadCount();
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Registration error:", error);

      // Clear any partial data
      logout();

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
    // Safely remove items from localStorage
    safeSetItem("token", null);
    safeSetItem("user", null);

    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setUnreadCount(0); // Reset unread count on logout
    delete axios.defaults.headers.common["Authorization"];
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put("/api/users/profile", profileData);

      // Update user in state and localStorage
      const updatedUser = { ...user, ...response.data.user };
      setUser(updatedUser);
      safeSetItem("user", JSON.stringify(updatedUser));

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Profile update error:", error);

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
      console.log("Forgot password request for:", email); // Debug

      const response = await axios.post("/api/users/forgot-password", {
        email,
      });

      console.log("Forgot password response:", response.data); // Debug

      // Handle temporary workaround (if backend returns resetUrl directly)
      if (response.data.resetUrl) {
        console.log("Reset URL (for development):", response.data.resetUrl);

        return {
          success: true,
          data: response.data,
          message:
            response.data.message || "Check your email for reset instructions",
          resetUrl: response.data.resetUrl, // Include for debugging
        };
      }

      return {
        success: true,
        data: response.data,
        message:
          response.data.message || "Check your email for reset instructions",
      };
    } catch (error) {
      console.error("Forgot password error:", error);

      let errorMessage = "Password reset request failed";

      if (error.response?.status === 429) {
        errorMessage = "Too many attempts. Please try again later.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
        status: error.response?.status,
      };
    }
  };

  const resetPassword = async (resetData) => {
    try {
      console.log("resetPassword called with data:", resetData); // Debug log

      // Validate required fields
      if (
        !resetData.token ||
        !resetData.id ||
        !resetData.password ||
        !resetData.confirmPassword
      ) {
        console.error("Missing required fields:", {
          hasToken: !!resetData.token,
          hasId: !!resetData.id,
          hasPassword: !!resetData.password,
          hasConfirmPassword: !!resetData.confirmPassword,
        });
        return {
          success: false,
          message: "Missing required fields for password reset",
        };
      }

      // Validate passwords match (client-side check)
      if (resetData.password !== resetData.confirmPassword) {
        return {
          success: false,
          message: "Passwords do not match",
        };
      }

      // Validate password length (client-side check)
      if (resetData.password.length < 6) {
        return {
          success: false,
          message: "Password must be at least 6 characters",
        };
      }

      const response = await axios.post("/api/users/reset-password", {
        token: resetData.token,
        id: resetData.id,
        password: resetData.password,
        confirmPassword: resetData.confirmPassword,
      });

      console.log("resetPassword response:", response.data); // Debug log

      // Check if response indicates success
      if (
        response.data.message &&
        response.data.message.includes("successful")
      ) {
        // Store the new token if provided
        if (response.data.token) {
          safeSetItem("token", response.data.token);
          setToken(response.data.token);
          setIsAuthenticated(true);

          // Update user data if provided
          if (response.data.user) {
            setUser(response.data.user);
            safeSetItem("user", JSON.stringify(response.data.user));
          }
        }

        return {
          success: true,
          data: response.data,
          message: response.data.message || "Password reset successful",
        };
      } else {
        return {
          success: false,
          message: response.data.message || "Password reset failed",
          data: response.data,
        };
      }
    } catch (error) {
      console.error("Reset password error:", error);

      // Extract meaningful error message
      let errorMessage = "Password reset failed";

      if (error.response) {
        // The request was made and the server responded with a status code
        console.error("Error response data:", error.response.data);
        console.error("Error status:", error.response.status);

        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          error.response.data?.details ||
          "Server error occurred";

        // Handle specific status codes
        if (error.response.status === 400) {
          errorMessage =
            errorMessage || "Invalid reset request. Please try again.";
        } else if (error.response.status === 404) {
          errorMessage = "Reset token not found or expired";
        } else if (error.response.status === 429) {
          errorMessage = "Too many attempts. Please try again later.";
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        errorMessage = "Network error. Please check your connection.";
      } else {
        // Something happened in setting up the request
        console.error("Request setup error:", error.message);
        errorMessage = error.message || "Request failed";
      }

      return {
        success: false,
        message: errorMessage,
        status: error.response?.status,
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
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    safeSetItem("user", JSON.stringify(updatedUser));
  };

  // Communication-related functions
  const markMessagesAsRead = async (conversationId) => {
    try {
      await axios.patch(`/communication/conversation/${conversationId}/read`);
      // Update local unread count
      loadUnreadCount();
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Clean up corrupted data on component mount
  useEffect(() => {
    const cleanupCorruptedData = () => {
      const userData = safeGetItem("user");
      const tokenData = safeGetItem("token");

      // If user data is corrupted but token exists, clear both
      if (tokenData && (!userData || userData === "undefined")) {
        console.warn("Cleaning up corrupted authentication data");
        logout();
      }
    };

    cleanupCorruptedData();
  }, []);

  const value = {
    // Original states
    user,
    loading,
    token,

    // Communication states
    unreadCount,
    isAuthenticated,

    // Original functions
    login,
    register,
    logout,
    updateProfile,
    updateUserRole,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,

    // Communication functions
    updateUnreadCount,
    markMessagesAsRead,
    loadUnreadCount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
