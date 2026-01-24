import React from 'react';


export const renderMessageContent = (message) => {
    // If message has contentParts (mixed content), render them
    if (message.contentParts && message.contentParts.length > 0) {
        return message.contentParts
            .sort((a, b) => a.position - b.position)
            .map((part, index) => {
                if (part.type === 'emoji') {
                    return (
                        <span
                            key={index}
                            className="inline-block text-2xl mx-1 emoji-part"
                            role="img"
                            aria-label="emoji"
                        >
                            {part.value}
                        </span>
                    );
                } else {
                    return (
                        <span key={index} className="text-part">
                            {part.value}
                        </span>
                    );
                }
            });
    }

    // Fallback to regular content
    return message.content || '';
};

export const isEmojiOnly = (message) => {
    if (message.messageType === 'emoji') return true;

    if (message.contentParts && message.contentParts.length > 0) {
        return message.contentParts.every(part => part.type === 'emoji');
    }

    // Simple emoji detection for fallback
    const emojiRegex = /^[\p{Emoji_Presentation}\p{Emoji}\uFE0F\s]+$/u;
    return emojiRegex.test(message.content || '');
};

export const hasEmojis = (message) => {
    if (message.messageType === 'emoji' || message.messageType === 'mixed') return true;

    if (message.contentParts && message.contentParts.length > 0) {
        return message.contentParts.some(part => part.type === 'emoji');
    }

    // Simple emoji detection for fallback
    const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/u;
    return emojiRegex.test(message.content || '');
};

export const getFileDownloadUrl = (message, baseUrl = '') => {
    if (!message.fileUrl) return null;

    // Try different URL formats for better compatibility
    const urls = {
        // Authenticated download
        download: `${baseUrl}/api/communication/download/${message._id}/file`,
        // Direct file access (authenticated)
        view: `${baseUrl}/api/communication/file/${message._id}`,
        // Static file access (if available)
        static: `${baseUrl}${message.fileUrl}`,
        // Alternative static access
        uploads: `${baseUrl}/uploads/messages/${message.fileName}`
    };

    return urls;
};

export const downloadFile = async (message, filename = null) => {
    try {
        const urls = getFileDownloadUrl(message);

        // Try authenticated download first
        const response = await fetch(urls.download, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || message.fileName || 'download';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            return true;
        } else {
            console.error('Download failed:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('Download error:', error);
        return false;
    }
};

export const getFilePreviewUrl = (message) => {
    if (!message.fileUrl) return null;

    // For images, return view URL for preview
    if (message.messageType === 'image' || message.fileType?.startsWith('image/')) {
        return `/api/communication/file/${message._id}`;
    }

    return null;
};

export const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';

    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export const getFileIcon = (fileType, fileName) => {
    if (!fileType && fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return '📄';
            case 'doc':
            case 'docx': return '📝';
            case 'xls':
            case 'xlsx': return '📊';
            case 'ppt':
            case 'pptx': return '📋';
            case 'zip':
            case 'rar': return '🗜️';
            case 'mp3':
            case 'wav': return '🎵';
            case 'mp4':
            case 'avi': return '🎬';
            default: return '📎';
        }
    }

    if (fileType?.startsWith('image/')) return '🖼️';
    if (fileType?.startsWith('video/')) return '🎬';
    if (fileType?.startsWith('audio/')) return '🎵';
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('word')) return '📝';
    if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return '📊';
    if (fileType?.includes('powerpoint') || fileType?.includes('presentation')) return '📋';
    if (fileType?.includes('zip') || fileType?.includes('compressed')) return '🗜️';

    return '📎';
};