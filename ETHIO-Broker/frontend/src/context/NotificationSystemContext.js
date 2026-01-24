import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from '../api/axios';

const NotificationSystemContext = createContext();

const notificationReducer = (state, action) => {
    switch (action.type) {
        case 'SET_NOTIFICATIONS':
            return {
                ...state,
                notifications: action.payload,
                unreadCount: action.payload.filter(n => !n.read).length
            };
        case 'ADD_NOTIFICATION':
            const newNotifications = [action.payload, ...state.notifications];
            return {
                ...state,
                notifications: newNotifications,
                unreadCount: newNotifications.filter(n => !n.read).length
            };
        case 'MARK_AS_READ':
            const updatedNotifications = state.notifications.map(n =>
                n._id === action.payload ? { ...n, read: true } : n
            );
            return {
                ...state,
                notifications: updatedNotifications,
                unreadCount: updatedNotifications.filter(n => !n.read).length
            };
        case 'MARK_ALL_AS_READ':
            const allReadNotifications = state.notifications.map(n => ({ ...n, read: true }));
            return {
                ...state,
                notifications: allReadNotifications,
                unreadCount: 0
            };
        case 'DELETE_NOTIFICATION':
            const filteredNotifications = state.notifications.filter(n => n._id !== action.payload);
            return {
                ...state,
                notifications: filteredNotifications,
                unreadCount: filteredNotifications.filter(n => !n.read).length
            };
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload
            };
        default:
            return state;
    }
};

const initialState = {
    notifications: [],
    unreadCount: 0,
    loading: false
};

export const NotificationSystemProvider = ({ children }) => {
    const [state, dispatch] = useReducer(notificationReducer, initialState);
    const { user, isAuthenticated } = useAuth();

    // Load notifications when user is authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            loadNotifications();
        }
    }, [isAuthenticated, user]);

    const loadNotifications = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await axios.get('/api/notifications');

            if (response.data.success) {
                // Map backend notification format to frontend format
                const notifications = (response.data.data.notifications || []).map(notification => ({
                    _id: notification._id,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    read: notification.isRead,
                    createdAt: notification.createdAt,
                    icon: getNotificationIcon(notification.type),
                    actionUrl: getNotificationActionUrl(notification.type, user?.role)
                }));

                dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
            } else {
                // If API call succeeds but returns no data, set empty array
                dispatch({ type: 'SET_NOTIFICATIONS', payload: [] });
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            // ✅ REMOVED MOCK DATA - Only show real notifications from database
            // If API fails, show empty notifications instead of mock data
            dispatch({ type: 'SET_NOTIFICATIONS', payload: [] });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const getNotificationIcon = (type) => {
        // Use the same bell icon for all notification types (Facebook style)
        return (
            <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
        );
    };

    const getNotificationActionUrl = (type, userRole) => {
        const urlMap = {
            'property_order': userRole === 'client' ? '/client/orders' : '/broker/properties',
            'payment_completed': userRole === 'broker' ? '/broker/commissions' : '/client/orders',
            'payment_failed': '/client/orders',
            'property_assigned': '/broker/properties',
            'commission_earned': '/broker/commissions',
            'message_received': `/${userRole}/communication`,
            'property_approved': userRole === 'client' ? '/client/my-properties' : '/admin/properties',
            'property_rejected': userRole === 'client' ? '/client/my-properties' : '/admin/properties',
            'user_registered': '/admin/users',
            'system_update': `/${userRole}`,
            'general': `/${userRole}`
        };
        return urlMap[type] || `/${userRole}`;
    };

    const markAsRead = async (notificationId) => {
        try {
            await axios.patch(`/api/notifications/${notificationId}/read`);
            dispatch({ type: 'MARK_AS_READ', payload: notificationId });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Still update UI even if API fails
            dispatch({ type: 'MARK_AS_READ', payload: notificationId });
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.patch('/api/notifications/mark-all-read');
            dispatch({ type: 'MARK_ALL_AS_READ' });
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            // Still update UI even if API fails
            dispatch({ type: 'MARK_ALL_AS_READ' });
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await axios.delete(`/api/notifications/${notificationId}`);
            dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId });
        } catch (error) {
            console.error('Error deleting notification:', error);
            // Still update UI even if API fails
            dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId });
        }
    };

    const addNotification = (notification) => {
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}m ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days}d ago`;
        }
    };

    const value = {
        ...state,
        loadNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification,
        getTimeAgo
    };

    return (
        <NotificationSystemContext.Provider value={value}>
            {children}
        </NotificationSystemContext.Provider>
    );
};

export const useNotificationSystem = () => {
    const context = useContext(NotificationSystemContext);
    if (!context) {
        throw new Error('useNotificationSystem must be used within a NotificationSystemProvider');
    }
    return context;
};