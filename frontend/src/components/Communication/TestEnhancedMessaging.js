import React, { useState } from 'react';
import MessageInput from './MessageInput';
import Message from './Message';

const TestEnhancedMessaging = () => {
    const [messages, setMessages] = useState([
        {
            _id: '1',
            content: 'Hello! 😊 How are you doing today? 👋',
            messageType: 'mixed',
            contentParts: [
                { type: 'text', value: 'Hello! ', position: 0 },
                { type: 'emoji', value: '😊', position: 1 },
                { type: 'text', value: ' How are you doing today? ', position: 2 },
                { type: 'emoji', value: '👋', position: 3 }
            ],
            sender: { _id: '2', fname: 'John', lname: 'Doe' },
            createdAt: new Date().toISOString(),
            messageStatus: 'read'
        },
        {
            _id: '2',
            content: '😂😂😂',
            messageType: 'emoji',
            sender: { _id: '1', fname: 'You', lname: '' },
            createdAt: new Date().toISOString(),
            messageStatus: 'delivered'
        },
        {
            _id: '3',
            content: 'Here is a test document 📄',
            messageType: 'document',
            fileUrl: '/uploads/messages/test-doc.pdf',
            fileName: 'test-document.pdf',
            fileSize: 1024000,
            fileType: 'application/pdf',
            sender: { _id: '2', fname: 'John', lname: 'Doe' },
            createdAt: new Date().toISOString(),
            messageStatus: 'read'
        }
    ]);

    const currentUser = { id: '1', fname: 'You', lname: '' };

    const handleSendMessage = (messageData) => {
        console.log('📤 Sending message:', messageData);

        // Simulate message sending
        const newMessage = {
            _id: Date.now().toString(),
            content: messageData.content,
            messageType: messageData.messageType || 'text',
            sender: currentUser,
            createdAt: new Date().toISOString(),
            messageStatus: 'sent'
        };

        if (messageData.file) {
            newMessage.fileUrl = URL.createObjectURL(messageData.file);
            newMessage.fileName = messageData.file.name;
            newMessage.fileSize = messageData.file.size;
            newMessage.fileType = messageData.file.type;
            newMessage.messageType = messageData.file.type.startsWith('image/') ? 'image' : 'document';
        }

        setMessages(prev => [...prev, newMessage]);
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-600 text-white p-4">
                <h2 className="text-xl font-bold">Enhanced Messaging Test</h2>
                <p className="text-blue-100 text-sm">Testing emoji interactions and file downloads</p>
            </div>

            <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <Message
                        key={message._id}
                        message={message}
                        currentUser={currentUser}
                    />
                ))}
            </div>

            <MessageInput
                currentUserId="test-user"
                onSendMessage={handleSendMessage}
            />

            <div className="p-4 bg-gray-50 border-t">
                <h3 className="font-bold text-sm mb-2">Test Features:</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                    <li>✅ Mixed emoji/text messages (like "Hello 😊 world!")</li>
                    <li>✅ Emoji-only messages display larger</li>
                    <li>✅ Emoji picker in message input</li>
                    <li>✅ Enhanced file download with fallbacks</li>
                    <li>✅ File preview and type icons</li>
                    <li>✅ Real-time message status indicators</li>
                </ul>
            </div>
        </div>
    );
};

export default TestEnhancedMessaging;