import React from 'react';
import { getMessageStatusIcon } from '../../utils/timeUtils';

const MessageStatus = ({ message, isOwnMessage }) => {
    if (!isOwnMessage) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'sent':
                return 'text-gray-400';
            case 'delivered':
                return 'text-gray-600';
            case 'read':
                return 'text-blue-500';
            default:
                return 'text-gray-300';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'sent':
                return (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                );
            case 'delivered':
                return (
                    <div className="flex -space-x-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                );
            case 'read':
                return (
                    <div className="flex -space-x-1 text-blue-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full animate-spin border-t-transparent" />
                );
        }
    };

    const status = message.messageStatus || 'sent';

    return (
        <div className={`flex items-center ${getStatusColor(status)}`} title={`Message ${status}`}>
            {getStatusIcon(status)}
        </div>
    );
};

export default MessageStatus;