const axios = require("axios");
require("dotenv").config();

console.log("🔄 Chapa Utility Loading...");

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const CHAPA_BASE_URL = process.env.CHAPA_BASE_URL;

exports.generateChapaPaymentUrl = async (data) => {
  try {
    console.log("💰 Chapa Payment Initialization Started...");
    console.log("📦 Received data:", JSON.stringify(data, null, 2));

    // Check environment variables
    console.log("🔑 Environment Check:", {
      hasChapaKey: !!CHAPA_SECRET_KEY,
      hasServerUrl: !!process.env.SERVER_URL,
      hasClientUrl: !!process.env.CLIENT_URL,
      chapaBaseUrl: CHAPA_BASE_URL,
    });

    if (!CHAPA_SECRET_KEY) {
      throw new Error("Chapa secret key is not configured");
    }

    // ✅ Generate unique transaction reference
    const tx_ref = `ethio_broker_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Process amount
    let amount = parseFloat(data.amount);
    if (isNaN(amount)) {
      throw new Error("Invalid amount provided");
    }
    
    console.log("🔢 Amount processing:", {
      original: data.amount,
      parsed: amount,
      rounded: amount.toFixed(2),
    });

    const payload = {
      amount: amount.toFixed(2),
      currency: data.currency || "ETB",
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      tx_ref: tx_ref,
      callback_url: process.env.CHAPA_CALLBACK_URL || `${process.env.SERVER_URL}/api/payments/verify`,
      return_url: `${process.env.CLIENT_URL}/payment/success`,
      customization: {
        title: "ETHIO Broker",
        description: `Payment for ${data.propertyTitle || "property"}`,
      },
    };

    console.log("📤 Final Chapa Request Payload:");
    console.log(JSON.stringify(payload, null, 2));

    console.log("🌐 Sending request to Chapa...");
    const response = await axios.post(
      `${CHAPA_BASE_URL}/transaction/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
        httpsAgent: new (require("https").Agent)({
          rejectUnauthorized: false,
        }),
      }
    );

    console.log("✅ Chapa API Response:");
    console.log("Status:", response.data.status);
    console.log("Message:", response.data.message);

    if (
      response.data.status === "success" &&
      response.data.data?.checkout_url
    ) {
      console.log("🎉 Payment URL generated successfully!");
      return {
        checkout_url: response.data.data.checkout_url,
        tx_ref: tx_ref,
      };
    } else {
      throw new Error(response.data.message || "Chapa initialization failed");
    }
  } catch (err) {
    console.error("❌ Chapa API Call Failed:");

    let errorMessage = "Chapa payment failed: ";

    if (err.response) {
      console.error("🔍 Chapa API Error Response:");
      console.error("Status Code:", err.response.status);
      console.error("Error Data:", JSON.stringify(err.response.data, null, 2));

      if (err.response.data) {
        if (typeof err.response.data === "string") {
          errorMessage += err.response.data;
        } else if (err.response.data.message) {
          errorMessage += JSON.stringify(err.response.data.message);
        } else if (err.response.data.errors) {
          errorMessage += JSON.stringify(err.response.data.errors);
        } else {
          errorMessage += JSON.stringify(err.response.data);
        }
      } else {
        errorMessage += `HTTP ${err.response.status}`;
      }
    } else if (err.request) {
      console.error("🔍 No response received:", err.request);
      errorMessage += "No response from Chapa API - Network issue";
    } else {
      console.error("🔍 Setup error:", err.message);
      errorMessage += err.message;
    }

    console.error("🔍 Final Error Message:", errorMessage);
    throw new Error(errorMessage);
  }
};

// ✅ Verify Chapa Transaction
exports.verifyChapaTransaction = async (tx_ref) => {
  try {
    console.log(`🔍 Verifying Chapa transaction: ${tx_ref}`);
    
    const response = await axios.get(
      `${CHAPA_BASE_URL}/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        },
        httpsAgent: new (require("https").Agent)({
          rejectUnauthorized: false,
        }),
      }
    );
    
    console.log("✅ Chapa verification response:", response.data);
    return response.data;
  } catch (err) {
    console.error("❌ Chapa Verification Error:");
    
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else if (err.request) {
      console.error("No response received:", err.request);
    } else {
      console.error("Error:", err.message);
    }
    
    throw err;
  }
};