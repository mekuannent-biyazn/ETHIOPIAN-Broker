// utils/paymentHelper.js - Frontend helper for payment integration
import axios from "../api/axios";

export const initializePropertyPayment = async (
  propertyId,
  paymentType = "full_payment"
) => {
  try {
    console.log("🔄 Initializing payment for property:", propertyId);

    const response = await axios.post("/api/payments/initialize", {
      propertyId,
      paymentType,
    });

    if (response.data.success) {
      console.log(
        "✅ Payment initialized successfully:",
        response.data.data.paymentUrl
      );
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      throw new Error(response.data.message || "Failed to initialize payment");
    }
  } catch (error) {
    console.error("❌ Payment initialization error:", error);

    // Handle specific error cases
    let errorMessage = "Payment initialization failed";

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message.includes("Network Error")) {
      errorMessage = "Network error. Please check your connection.";
    } else if (error.message.includes("timeout")) {
      errorMessage = "Request timeout. Please try again.";
    }

    return {
      success: false,
      error: errorMessage,
      details: error.response?.data,
    };
  }
};

export const checkPaymentStatus = async (paymentId) => {
  try {
    const response = await axios.get(`/api/payments/${paymentId}/status`);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      throw new Error(
        response.data.message || "Failed to check payment status"
      );
    }
  } catch (error) {
    console.error("❌ Payment status check error:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to check payment status",
    };
  }
};
