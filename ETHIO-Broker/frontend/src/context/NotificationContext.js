import React, { createContext, useContext, useReducer } from 'react';

const NotificationContext = createContext();

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'SHOW_NOTIFICATION':
      return {
        ...state,
        notification: {
          message: action.payload.message,
          type: action.payload.type || 'info',
          visible: true
        }
      };
    case 'HIDE_NOTIFICATION':
      return {
        ...state,
        notification: {
          ...state.notification,
          visible: false
        }
      };
    default:
      return state;
  }
};

const initialState = {
  notification: {
    message: '',
    type: 'info',
    visible: false
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const showNotification = (message, type = 'info') => {
    dispatch({
      type: 'SHOW_NOTIFICATION',
      payload: { message, type }
    });

   
    setTimeout(() => {
      dispatch({ type: 'HIDE_NOTIFICATION' });
    }, 5000);
  };

  const hideNotification = () => {
    dispatch({ type: 'HIDE_NOTIFICATION' });
  };

  const value = {
    ...state,
    showNotification,
    hideNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};