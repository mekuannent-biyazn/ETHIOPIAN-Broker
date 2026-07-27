import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PaymentVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const propertyId = searchParams.get("property_id");
  const txRef = searchParams.get("tx_ref");
  const amount = searchParams.get("amount");
  const paymentId = searchParams.get("payment_id");

  useEffect(() => {
    // If no parameters, redirect to dashboard
    if (!propertyId && !txRef) {
      navigate("/client");
    }
  }, [propertyId, txRef, navigate]);

  const handleOkClick = () => {
    // Redirect to manual verification page with parameters
    const verificationUrl = `/properties/${propertyId}/verify?tx_ref=${txRef}&amount=${amount}&payment_id=${paymentId}`;
    navigate(verificationUrl);
  };

  return (
    <div className="min-h-screen bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 text-center">
        {/* Icon */}
        <div className="text-6xl mb-6">✅</div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Completed
        </h2>
        
        {/* Message */}
        <p className="text-gray-600 mb-8 text-lg">
          Please verify your payment to complete the transaction.
        </p>
        
        {/* OK Button */}
        <button
          onClick={handleOkClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-semibold text-lg transition duration-200 shadow-md hover:shadow-lg"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default PaymentVerify;