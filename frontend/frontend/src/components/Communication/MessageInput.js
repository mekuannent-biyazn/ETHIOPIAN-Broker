import React, { useState, useRef } from "react";
import { useCommunication } from "../../context/CommunicationContext";
import "./MessageInput.css";

const MessageInput = ({ currentUserId }) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const { sendMessage, startTyping, stopTyping } = useCommunication();
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Validate that currentUserId exists
  if (!currentUserId) {
    return (
      <div className="message-input-disabled">
        <p>Please select a conversation to send messages</p>
      </div>
    );
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "text/plain",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Please select a valid file type (JPEG, PNG, GIF, PDF, TXT)");
        return;
      }

      setSelectedFile(file);
      setError("");

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTyping = () => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start typing
    startTyping(currentUserId);

    // Set timeout to stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(currentUserId);
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ FIXED: Validate currentUserId exists
    if (!currentUserId) {
      setError("No conversation selected");
      return;
    }

    if (!message.trim() && !selectedFile) {
      setError("Please enter a message or select a file");
      return;
    }

    setIsSending(true);
    setError("");

    try {
      const messageData = {
        receiverId: currentUserId, // ✅ This should now be defined
        content: message,
        messageType: selectedFile
          ? selectedFile.type.startsWith("image/")
            ? "image"
            : "document"
          : "text",
      };

      if (selectedFile) {
        messageData.file = selectedFile;
      }

      console.log("📤 Sending message to:", currentUserId, {
        hasFile: !!selectedFile,
        contentLength: message.length,
      });

      await sendMessage(messageData);

      // Clear form
      setMessage("");
      setSelectedFile(null);
      setFilePreview(null);

      // Stop typing
      stopTyping(currentUserId);
    } catch (error) {
      console.error("❌ Failed to send message:", error);
      setError(error.message || "Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    handleTyping();
  };

  return (
    <div className="message-input-container">
      {error && <div className="error-message">{error}</div>}

      {filePreview && (
        <div className="file-preview">
          <img src={filePreview} alt="Preview" />
          <button
            type="button"
            onClick={removeFile}
            className="remove-file-btn"
          >
            ×
          </button>
        </div>
      )}

      {selectedFile && !filePreview && (
        <div className="file-preview">
          <span>📎 {selectedFile.name}</span>
          <button
            type="button"
            onClick={removeFile}
            className="remove-file-btn"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="message-form">
        <div className="input-group">
          <button
            type="button"
            className="file-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
          >
            📎
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,application/pdf,text/plain"
            style={{ display: "none" }}
            disabled={isSending}
          />

          <textarea
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isSending}
            rows="1"
            className="message-textarea"
          />

          <button
            type="submit"
            disabled={isSending || (!message.trim() && !selectedFile)}
            className="send-btn"
          >
            {isSending ? "⏳" : "➤"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
