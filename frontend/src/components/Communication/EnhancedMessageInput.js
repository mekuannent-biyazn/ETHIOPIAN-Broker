import React, { useState, useRef, useEffect } from "react";
import EmojiPicker from "./EmojiPicker";
import { useTranslation } from "react-i18next";

const EnhancedMessageInput = ({
  onSendMessage,
  onTyping,
  onStopTyping,
  placeholder = "",
  disabled = false,
}) => {
  const { t, i18n } = useTranslation();
  const [currentLanguage] = useState(i18n.language || "en");
  const defaultPlaceholder = placeholder || t("communication.typeMessage");
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Handle typing indicators
  useEffect(() => {
    if (message.trim() && !isTyping) {
      setIsTyping(true);
      onTyping?.();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onStopTyping?.();
      }
    }, 1000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, onTyping, onStopTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if ((!message.trim() && !selectedFile) || disabled) return;

    const messageData = {
      content: message.trim(),
      messageType: "text",
    };

    if (selectedFile) {
      messageData.file = selectedFile;
      messageData.messageType = selectedFile.type.startsWith("image/")
        ? "image"
        : "document";
    }

    onSendMessage(messageData);

    // Reset form
    setMessage("");
    setSelectedFile(null);
    setFilePreview(null);
    setIsTyping(false);
    onStopTyping?.();

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);

      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setMessage((prev) => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert(t("communication.fileSizeLimit"));
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isEmojiOnly = (text) => {
    const emojiRegex = /^[\p{Emoji_Presentation}\p{Emoji}\uFE0F\s]+$/u;
    return emojiRegex.test(text.trim());
  };

  return (
    <div className="border-t bg-white p-4">
      {/* File preview */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {filePreview ? (
                <img
                  src={filePreview}
                  alt={t("communication.preview")}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  📎
                </div>
              )}
              <div>
                <div className="font-medium text-sm">{selectedFile.name}</div>
                <div className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                </div>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="text-red-500 hover:text-red-700 p-1"
              title={t("common.remove")}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-2">
          {/* File upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title={t("communication.attachFile")}
            disabled={disabled}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>

          {/* Message input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={defaultPlaceholder}
              disabled={disabled}
              className={`w-full px-4 py-2 border rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 overflow-y-auto ${currentLanguage === "am" ? "text-right" : "text-left"}`}
              rows={1}
              dir={currentLanguage === "am" ? "rtl" : "ltr"}
            />

            {/* Emoji picker */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded-full transition-colors"
                title={t("communication.addEmoji")}
                disabled={disabled}
              >
                😊
              </button>

              <EmojiPicker
                isVisible={showEmojiPicker}
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={(!message.trim() && !selectedFile) || disabled}
            className={`p-2 rounded-full transition-colors ${
              (message.trim() || selectedFile) && !disabled
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            } ${isEmojiOnly(message) ? "text-2xl" : ""}`}
            title={t("communication.sendMessage")}
          >
            {isEmojiOnly(message) && message.trim() ? (
              <span className="text-2xl">🚀</span>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.rar"
        />
      </form>
    </div>
  );
};

export default EnhancedMessageInput;
