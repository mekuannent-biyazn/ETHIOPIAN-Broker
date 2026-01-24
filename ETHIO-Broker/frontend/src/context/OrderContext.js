import React, { createContext, useContext, useReducer } from "react";
import axios from "../api/axios";

const OrderContext = createContext();

const orderReducer = (state, action) => {
  switch (action.type) {
    case "ORDER_REQUEST":
      return { ...state, loading: true, error: null };
    case "ORDER_SUCCESS":
      return {
        ...state,
        loading: false,
        error: null,
        order: action.payload,
        successMessage: action.payload.message,
      };
    case "ORDER_FAIL":
      return {
        ...state,
        loading: false,
        error: action.payload,
        successMessage: null,
      };
    case "CLEAR_MESSAGES":
      return { ...state, error: null, successMessage: null };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "CLEAR_SUCCESS":
      return { ...state, successMessage: null };
    default:
      return state;
  }
};

const initialState = {
  loading: false,
  error: null,
  order: null,
  successMessage: null,
};

export const OrderProvider = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, initialState);

  const orderProperty = async (propertyId, orderData) => {
    try {
      dispatch({ type: "ORDER_REQUEST" });

      const response = await axios.post(
        `/api/properties/${propertyId}/order`,
        orderData
      );

      dispatch({ type: "ORDER_SUCCESS", payload: response.data });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || "Order failed";
      dispatch({ type: "ORDER_FAIL", payload: message });
      throw error;
    }
  };

  const getMyOrders = async () => {
    try {
      const response = await axios.get("/api/properties/my-orders");
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const clearSuccess = () => {
    dispatch({ type: "CLEAR_SUCCESS" });
  };

  const clearMessages = () => {
    dispatch({ type: "CLEAR_MESSAGES" });
  };

  return (
    <OrderContext.Provider
      value={{
        ...state,
        orderProperty,
        getMyOrders,
        clearError,
        clearSuccess,
        clearMessages,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
};
