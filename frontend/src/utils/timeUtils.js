// Utility functions for time formatting (Telegram-like)

export const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'last seen recently';

    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInSeconds = Math.floor((now - lastSeenDate) / 1000);

    if (diffInSeconds < 60) {
        return 'last seen just now';
    }

    if (diffInSeconds < 3600) { // Less than 1 hour
        const minutes = Math.floor(diffInSeconds / 60);
        return `last seen ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }

    if (diffInSeconds < 86400) { // Less than 24 hours
        const hours = Math.floor(diffInSeconds / 3600);
        return `last seen ${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    if (diffInSeconds < 604800) { // Less than 7 days
        const days = Math.floor(diffInSeconds / 86400);
        return `last seen ${days} day${days > 1 ? 's' : ''} ago`;
    }

    // More than a week ago
    return `last seen ${lastSeenDate.toLocaleDateString()}`;
};

export const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();

    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // If yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }

    // If this week
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (date > weekAgo) {
        return date.toLocaleDateString([], { weekday: 'short' });
    }

    // Older messages
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const getMessageStatusIcon = (messageStatus, isOwnMessage) => {
    if (!isOwnMessage) return null;

    switch (messageStatus) {
        case 'sent':
            return '✓'; // Single check
        case 'delivered':
            return '✓✓'; // Double check
        case 'read':
            return '✓✓'; // Double check (could be blue in CSS)
        default:
            return '⏳'; // Pending
    }
};

export const isOnlineRecently = (lastSeen) => {
    if (!lastSeen) return false;
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    return diffInMinutes < 5; // Consider online if seen within 5 minutes
};