import React from 'react';
import { formatLastSeen, isOnlineRecently } from '../../utils/timeUtils';

const OnlineStatus = ({ user, showText = true, size = 'sm' }) => {
    if (!user) return null;

    const isOnline = user.isOnline || isOnlineRecently(user.lastSeen);

    const sizeClasses = {
        xs: 'w-2 h-2',
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    return (
        <div className="flex items-center gap-1">
            <div className="relative">
                <div
                    className={`${sizeClasses[size]} rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'
                        } ${isOnline ? 'animate-pulse' : ''}`}
                />
                {isOnline && (
                    <div
                        className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-green-500 animate-ping opacity-75`}
                    />
                )}
            </div>

            {showText && (
                <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                    {isOnline ? 'online' : formatLastSeen(user.lastSeen)}
                </span>
            )}
        </div>
    );
};

export default OnlineStatus;