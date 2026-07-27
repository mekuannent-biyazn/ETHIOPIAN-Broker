import React, { useState } from "react";
import {
  renderMessageContent,
  isEmojiOnly,
  hasEmojis,
  downloadFile,
  getFilePreviewUrl,
  formatFileSize,
  getFileIcon,
} from "../../utils/messageUtils";
import { formatMessageTime } from "../../utils/timeUtils";
import MessageStatus from "./MessageStatus";
import OnlineStatus from "./OnlineStatus";
import { useTranslation } from "react-i18next";

const EnhancedMessage = ({
  message,
  isOwnMessage,
  showSender = true,
  onReaction,
  onEdit,
  onDelete,
}) => {
  const { t, i18n } = useTranslation();
  const [currentLanguage] = useState(i18n.language || "en");
  const [isDownloading, setIsDownloading] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const success = await downloadFile(message);
      if (!success) {
        // Fallback: try opening in new tab
        const urls = getFileDownloadUrl(message);
        window.open(urls.view, "_blank");
      }
    } catch (error) {
      console.error("Download failed:", error);
      // Show user-friendly error
      alert(t("communication.downloadFailed"));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReaction = (emoji) => {
    if (onReaction) {
      onReaction(message._id, emoji);
    }
    setShowReactions(false);
  };

  const renderFileContent = () => {
    if (!message.fileUrl) return null;

    const isImage =
      message.messageType === "image" || message.fileType?.startsWith("image/");
    const previewUrl = getFilePreviewUrl(message);

    if (isImage && previewUrl) {
      return (
        <div className="mt-2">
          <img
            src={previewUrl}
            alt={message.fileName || t("communication.sharedImage")}
            className="max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(previewUrl, "_blank")}
            onError={(e) => {
              console.error("Image load error:", e);
              e.target.style.display = "none";
            }}
          />
          {message.content && (
            <div className="mt-2 text-sm">{renderMessageContent(message)}</div>
          )}
        </div>
      );
    }

    // Document/file
    return (
      <div className="mt-2 p-3 bg-gray-100 rounded-lg border max-w-xs">
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {getFileIcon(message.fileType, message.fileName)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {message.fileName || t("communication.unknownFile")}
            </div>
            <div className="text-xs text-gray-500">
              {formatFileSize(message.fileSize)}
            </div>
          </div>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
            title={t("communication.download")}
          >
            {isDownloading ? (
              <div className="w-4 h-4 border-2 border-blue-600 rounded-full animate-spin border-t-transparent" />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
          </button>
        </div>
        {message.content && (
          <div className="mt-2 text-sm">{renderMessageContent(message)}</div>
        )}
      </div>
    );
  };

  const renderTextContent = () => {
    if (message.fileUrl) return null; // File messages handled separately

    const content = renderMessageContent(message);
    const emojiOnly = isEmojiOnly(message);

    return (
      <div
        className={`${emojiOnly ? "text-4xl" : "text-sm"} ${emojiOnly ? "py-2" : ""}`}
      >
        {content}
      </div>
    );
  };

  const renderReactions = () => {
    if (!message.emojiReactions || message.emojiReactions.length === 0)
      return null;

    // Group reactions by emoji
    const reactionGroups = message.emojiReactions.reduce((groups, reaction) => {
      if (!groups[reaction.emoji]) {
        groups[reaction.emoji] = [];
      }
      groups[reaction.emoji].push(reaction);
      return groups;
    }, {});

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {Object.entries(reactionGroups).map(([emoji, reactions]) => (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-colors"
          >
            <span>{emoji}</span>
            <span className="text-gray-600">{reactions.length}</span>
          </button>
        ))}
      </div>
    );
  };

  const messageClasses = `
    max-w-xs lg:max-w-md px-4 py-2 rounded-lg
    ${
      isOwnMessage
        ? "bg-blue-500 text-white ml-auto"
        : "bg-gray-200 text-gray-800"
    }
    ${isEmojiOnly(message) ? "bg-transparent shadow-none px-2 py-1" : ""}
  `;

  return (
    <div
      className={`flex flex-col mb-4 ${isOwnMessage ? "items-end" : "items-start"}`}
    >
      {showSender && !isOwnMessage && (
        <div className="flex items-center gap-2 mb-1 px-2">
          <span className="text-xs font-medium text-gray-600">
            {message.sender?.fname} {message.sender?.lname}
          </span>
          <OnlineStatus user={message.sender} showText={false} size="xs" />
        </div>
      )}

      <div className={messageClasses}>
        {renderTextContent()}
        {renderFileContent()}
        {renderReactions()}

        <div
          className={`flex items-center justify-between mt-2 ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}
        >
          <span className="text-xs">
            {formatMessageTime(message.createdAt)}
            {message.isEdited && (
              <span className="ml-1">{t("communication.edited")}</span>
            )}
          </span>

          <div className="flex items-center gap-1">
            <MessageStatus message={message} isOwnMessage={isOwnMessage} />

            {/* Reaction button */}
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1 hover:bg-black hover:bg-opacity-10 rounded-full transition-colors"
                title={t("communication.addReaction")}
              >
                <span className="text-xs">😊</span>
              </button>

              {showReactions && (
                <div className="absolute bottom-full right-0 mb-2 p-2 bg-white border rounded-lg shadow-lg z-10">
                  <div className="flex gap-1">
                    {["👍", "❤️", "😂", "😮", "😢", "😡"].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="p-1 hover:bg-gray-100 rounded text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMessage;
