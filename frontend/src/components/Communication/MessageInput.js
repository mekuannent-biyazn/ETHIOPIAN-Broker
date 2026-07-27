import { useState, useRef, useEffect } from "react";
import { useCommunication } from "../../hooks/useCommunication";
import { useTranslation } from "react-i18next";

const MessageInput = ({ currentUserId }) => {
  const { t, i18n } = useTranslation();
  const [currentLanguage] = useState(i18n.language || "en");
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const { sendMessage, startTyping, stopTyping } = useCommunication();
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Emoji categories
  const emojiCategories = {
    smileys: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "🤣",
      "😂",
      "🙂",
      "🙃",
      "😉",
      "😊",
      "😇",
      "🥰",
      "😍",
      "🤩",
      "😘",
      "😗",
      "😚",
      "😙",
      "😋",
      "😛",
      "😜",
      "🤪",
      "😝",
      "🤑",
      "🤗",
      "🤭",
      "🤫",
      "🤔",
    ],
    hearts: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
    ],
    gestures: [
      "👍",
      "👎",
      "👌",
      "🤌",
      "🤏",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "🖕",
      "👇",
      "☝️",
      "👋",
      "🤚",
      "🖐️",
      "✋",
      "🖖",
      "👏",
      "🙌",
      "🤲",
      "🤝",
      "🙏",
    ],
    activities: [
      "⚽",
      "🏀",
      "🏈",
      "⚾",
      "🥎",
      "🎾",
      "🏐",
      "🏉",
      "🥏",
      "🎱",
      "🏓",
      "🏸",
      "🏒",
      "🏑",
      "🥍",
      "🏏",
      "🎯",
      "⛳",
      "🏹",
      "🎣",
      "🤿",
      "🥊",
      "🥋",
      "🎽",
    ],
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showEmojiPicker]);

  // Validate that currentUserId exists
  if (!currentUserId) {
    return (
      <div className="message-input-disabled p-4 text-center text-gray-400">
        <p>{t("communication.selectConversationToSend")}</p>
      </div>
    );
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(t("communication.fileSizeLimit"));
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
      setError(t("communication.invalidFileType"));
      return;
    }

    setSelectedFile(file);
    setError("");

    // Preview image
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    startTyping(currentUserId);

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(currentUserId);
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUserId) {
      setError(t("communication.noConversationSelected"));
      return;
    }

    if (!message.trim() && !selectedFile) {
      setError(t("communication.enterMessageOrFile"));
      return;
    }

    setIsSending(true);
    setError("");

    try {
      const messageData = {
        receiverId: currentUserId,
        content: message,
        messageType: selectedFile
          ? selectedFile.type.startsWith("image/")
            ? "image"
            : "document"
          : "text",
      };

      if (selectedFile) messageData.file = selectedFile;

      await sendMessage(messageData);

      // Reset
      setMessage("");
      setSelectedFile(null);
      setFilePreview(null);
      stopTyping(currentUserId);
    } catch (err) {
      setError(err.message || t("communication.failedToSend"));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setMessage((prev) => prev + emoji);
    }

    setShowEmojiPicker(false);
  };

  const translateCategory = (category) => {
    const categoryMap = {
      smileys: t("emoji.smileys"),
      hearts: t("emoji.hearts"),
      gestures: t("emoji.gestures"),
      activities: t("emoji.activities"),
    };
    return categoryMap[category] || category;
  };

  return (
    <div className="bg-gray-800 border-t border-gray-700 p-4">
      {error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {filePreview && (
        <div className="mb-3 relative inline-block">
          <img
            src={filePreview}
            alt={t("communication.preview")}
            className="max-w-xs max-h-32 rounded-lg"
          />
          <button
            type="button"
            onClick={removeFile}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
          >
            ×
          </button>
        </div>
      )}

      {selectedFile && !filePreview && (
        <div className="mb-3 flex items-center space-x-2 p-2 bg-gray-700 rounded-lg">
          <span className="text-gray-300">📎 {selectedFile.name}</span>
          <button
            type="button"
            onClick={removeFile}
            className="text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          className="flex-shrink-0 w-10 h-10 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full flex items-center justify-center transition-colors"
          title={t("communication.attachFile")}
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

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,application/pdf,text/plain"
          className="hidden"
          disabled={isSending}
        />

        {/* Message Input Container */}
        <div className="flex-1 relative">
          <div className="flex items-end bg-gray-700 rounded-2xl px-4 py-2">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              placeholder={t("communication.typeMessage")}
              disabled={isSending}
              rows="1"
              className={`flex-1 bg-transparent text-white placeholder-gray-400 resize-none outline-none max-h-32 py-2 ${currentLanguage === "am" ? "text-right" : "text-left"}`}
              style={{ minHeight: "24px" }}
              dir={currentLanguage === "am" ? "rtl" : "ltr"}
            />

            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="ml-2 text-gray-400 hover:text-gray-300 transition-colors"
              disabled={isSending}
              title={t("communication.addEmoji")}
            >
              😊
            </button>
          </div>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-full right-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-4 max-w-xs max-h-64 overflow-y-auto z-50"
            >
              {Object.entries(emojiCategories).map(([category, emojis]) => (
                <div key={category} className="mb-3">
                  <div className="text-xs text-gray-400 uppercase font-semibold mb-2">
                    {translateCategory(category)}
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleEmojiSelect(emoji)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded transition-colors"
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="w-full mt-2 py-1 text-xs text-gray-400 hover:text-gray-300"
              >
                {t("common.close")}
              </button>
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={isSending || (!message.trim() && !selectedFile)}
          className="flex-shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
          title={t("communication.sendMessage")}
        >
          {isSending ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
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
      </form>
    </div>
  );
};

export default MessageInput;
