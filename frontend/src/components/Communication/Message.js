import React, { useState, useEffect } from "react";
import { useCommunication } from "../../hooks/useCommunication";
import { useNotification } from "../../context/NotificationContext";
import { useTranslation } from "react-i18next";
import { formatMessageTime } from "../../utils/timeUtils";
import {
  getFileIcon,
  formatFileSize,
  renderMessageContent,
} from "../../utils/messageUtils";
import MessageStatus from "./MessageStatus";
import OnlineStatus from "./OnlineStatus";

const Message = ({ message, currentUser }) => {
  const { addReaction, editMessage, deleteMessage } = useCommunication();
  const { showNotification } = useNotification();
  const { t, i18n } = useTranslation();
  const [currentLanguage] = useState(i18n.language || "en");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showReactions, setShowReactions] = useState(false);
  const [localReactions, setLocalReactions] = useState(
    message.emojiReactions || [],
  );
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Common reactions array
  const commonReactions = ["👍", "❤️", "😄", "😮", "😢", "🙏"];

  // Enhanced emoji support functions
  const isEmojiOnlyMessage = (content) => {
    if (!content) return false;
    const emojiRegex = /^[\p{Emoji_Presentation}\p{Emoji}\uFE0F\s]+$/u;
    return emojiRegex.test(content.trim());
  };

  // SAFE message ID access with fallback
  const getMessageId = () => {
    return message._id || message.id || null;
  };

  const isOwnMessage =
    message.sender?._id === currentUser.id ||
    message.sender?.id === currentUser.id;
  const isTextMessage = message.messageType === "text";
  const isImageMessage = message.messageType === "image";
  const isDocumentMessage = message.messageType === "document";
  const messageId = getMessageId();

  // ✅ Check if this is a temporary message (optimistic update)
  const isTempMessage = messageId && messageId.startsWith("temp-");
  const isSending = message.isSending || isTempMessage;

  useEffect(() => {
    setLocalReactions(message.emojiReactions || []);
  }, [message.emojiReactions]);

  const handleReaction = async (emoji) => {
    if (!messageId || isTempMessage) {
      showNotification(t("communication.cannotReactTemp"), "warning");
      return;
    }

    try {
      await addReaction(messageId, emoji);
      setShowReactions(false);
    } catch (error) {
      showNotification(t("communication.failedToAddReaction"), "error");
    }
  };

  const handleEdit = async () => {
    if (!messageId || isTempMessage) {
      showNotification(t("communication.cannotEditTemp"), "warning");
      return;
    }

    if (!editContent.trim()) {
      showNotification(t("communication.messageEmpty"), "error");
      return;
    }

    if (editContent === message.content) {
      setIsEditing(false);
      return;
    }

    try {
      await editMessage(messageId, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error("❌ Edit failed:", error);
      showNotification(t("communication.failedToEdit"), "error");
    }
  };

  const handleDelete = async () => {
    if (!messageId || isTempMessage) {
      showNotification(t("communication.cannotDeleteTemp"), "warning");
      return;
    }

    if (!window.confirm(t("communication.confirmDelete"))) {
      return;
    }

    try {
      await deleteMessage(messageId);
    } catch (error) {
      showNotification(t("communication.failedToDelete"), "error");
    }
  };

  const handleFileDownload = async () => {
    if (!messageId) {
      showNotification(t("communication.cannotDownload"), "error");
      return;
    }

    // ✅ Prevent download for temporary messages
    if (isTempMessage) {
      showNotification(t("communication.fileUploading"), "info");
      return;
    }

    try {
      // Import the communication service dynamically
      const communicationService =
        await import("../../services/communicationService");

      // Try enhanced download method first
      const success = await communicationService.default.downloadFileEnhanced(
        messageId,
        message.fileName,
      );

      if (success) {
        showNotification(t("communication.downloadStarted"), "success");
      } else {
        // Fallback to direct URL method
        if (message.fileUrl) {
          const fileUrl = message.fileUrl.startsWith("http")
            ? message.fileUrl
            : `${process.env.REACT_APP_API_URL || "http://localhost:9000"}${message.fileUrl}`;

          console.log("📥 Fallback: Downloading file from:", fileUrl);

          const link = document.createElement("a");
          link.href = fileUrl;
          link.setAttribute(
            "download",
            message.fileName || t("communication.download"),
          );
          link.setAttribute("target", "_blank");
          document.body.appendChild(link);
          link.click();
          link.remove();

          showNotification(t("communication.downloadStarted"), "success");
        } else {
          showNotification(t("communication.noFileAvailable"), "error");
        }
      }
    } catch (error) {
      console.error("Download failed:", error);
      showNotification(t("communication.failedToDownload"), "error");
    }
  };

  // DEFINE getFilePreview function - UPDATED with temp message handling
  const getFilePreview = () => {
    if (isImageMessage && message.fileUrl) {
      const imageUrl = message.fileUrl.startsWith("http")
        ? message.fileUrl
        : `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}${
            message.fileUrl
          }`;

      return (
        <div className="relative group">
          {/* Image Preview */}
          <div
            className={`relative rounded-lg overflow-hidden cursor-pointer bg-gray-600 min-h-[120px] flex items-center justify-center ${
              isSending ? "opacity-60" : ""
            }`}
            onClick={() => !isSending && setShowImageModal(true)}
          >
            {isSending && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="bg-black bg-opacity-50 rounded-lg px-3 py-2 text-white text-sm">
                  {t("communication.uploading")}
                </div>
              </div>
            )}

            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse bg-gray-500 w-full h-full flex items-center justify-center">
                  <span className="text-gray-300">{t("common.loading")}</span>
                </div>
              </div>
            )}

            <img
              src={imageUrl}
              alt={message.content || t("communication.sharedImage")}
              className={`max-w-full max-h-64 object-contain transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                console.error("❌ Failed to load image:", imageUrl);
                setImageLoaded(true);
                e.target.style.display = "none";
              }}
            />

            {/* Download button overlay - only for non-temp messages */}
            {!isSending && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileDownload();
                  }}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-200"
                  title={t("communication.download")}
                >
                  <svg
                    className="w-5 h-5 text-gray-700"
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
                </button>
              </div>
            )}
          </div>

          {/* Image info */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>
              🖼️ {t("communication.image")}{" "}
              {isSending && `(${t("communication.uploading")})`}
            </span>
            {message.fileSize && (
              <span>{formatFileSize(message.fileSize)}</span>
            )}
          </div>
        </div>
      );
    } else if (isDocumentMessage && (message.fileUrl || message.fileName)) {
      return (
        <div
          className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer group ${
            isSending
              ? "bg-gray-600 border-gray-500 opacity-60"
              : "bg-gray-600 border-gray-500 hover:bg-gray-500"
          }`}
          onClick={!isSending ? handleFileDownload : undefined}
        >
          <div className="flex-shrink-0">
            <span className="text-2xl">
              {getFileIcon(message.fileType, message.fileName)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate text-gray-200">
              {message.fileName || t("communication.document")}{" "}
              {isSending && `(${t("communication.uploading")})`}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
              {message.fileSize && (
                <span>{formatFileSize(message.fileSize)}</span>
              )}
              <span>•</span>
              <span>
                {isSending
                  ? t("communication.uploading")
                  : t("communication.clickToDownload")}
              </span>
            </div>
          </div>

          {!isSending && (
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg
                className="w-5 h-5 text-gray-300"
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
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Image Modal Component
  const ImageModal = () => {
    if (!showImageModal || !isImageMessage || isSending) return null;

    const imageUrl = message.fileUrl.startsWith("http")
      ? message.fileUrl
      : `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}${
          message.fileUrl
        }`;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
        <div className="relative max-w-4xl max-h-full">
          {/* Close button */}
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Image */}
          <img
            src={imageUrl}
            alt={message.content || t("communication.sharedImage")}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />

          {/* Download button */}
          <div className="absolute bottom-4 right-4">
            <button
              onClick={handleFileDownload}
              className="bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 rounded-lg flex items-center space-x-2 shadow-lg transition-colors"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>{t("communication.download")}</span>
            </button>
          </div>

          {/* Image info */}
          <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 rounded-lg px-3 py-2">
            <div className="text-sm">
              {message.fileName && (
                <div className="font-medium">{message.fileName}</div>
              )}
              {message.fileSize && (
                <div className="text-xs opacity-75">
                  {formatFileSize(message.fileSize)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className={`flex ${
          isOwnMessage ? "justify-end" : "justify-start"
        } mb-4`}
        dir={currentLanguage === "am" ? "rtl" : "ltr"}
      >
        <div
          className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl px-5 py-4 backdrop-blur-sm ${
            isOwnMessage
              ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-br-md shadow-lg ring-1 ring-white/20"
              : "bg-gray-700 text-gray-100 rounded-bl-md border border-gray-600 shadow-lg"
          } ${isSending ? "opacity-70 animate-pulse" : ""} transition-all duration-300 hover:shadow-xl`}
        >
          {/* Message Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium ${
                  isOwnMessage ? "text-blue-100" : "text-gray-300"
                }`}
              >
                {isOwnMessage
                  ? t("communication.you")
                  : `${message.sender?.fname || ""} ${
                      message.sender?.lname || ""
                    }`}
              </span>

              {/* Online Status for other users */}
              {!isOwnMessage && message.sender && (
                <OnlineStatus
                  user={message.sender}
                  showText={false}
                  size="xs"
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs ${
                  isOwnMessage ? "text-blue-200" : "text-gray-400"
                }`}
              >
                {formatMessageTime(message.createdAt)}
                {message.isEdited && (
                  <span className="italic ml-1">
                    • {t("communication.edited")}
                  </span>
                )}
                {isSending && (
                  <span className="italic ml-1">
                    • {t("communication.sending")}
                  </span>
                )}
              </span>

              {/* Message Status Indicators */}
              {isOwnMessage && !isSending && (
                <MessageStatus message={message} isOwnMessage={isOwnMessage} />
              )}
            </div>
          </div>

          {/* Message Content */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleEdit();
                  }
                  if (e.key === "Escape") {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }
                }}
                rows="3"
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 resize-none ${currentLanguage === "am" ? "text-right" : "text-left"}`}
                autoFocus
                maxLength={2000}
                dir={currentLanguage === "am" ? "rtl" : "ltr"}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {editContent.length}/2000
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={handleEdit}
                    disabled={
                      !editContent.trim() || !messageId || isTempMessage
                    }
                    className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("common.save")}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(message.content);
                    }}
                    className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* File Preview */}
              {getFilePreview()}

              {/* Enhanced Text Content with Emoji Support */}
              {message.content && (
                <div
                  className={`whitespace-pre-wrap mt-2 ${
                    isEmojiOnlyMessage(message.content) ? "text-3xl" : "text-sm"
                  } ${currentLanguage === "am" ? "text-right" : "text-left"}`}
                >
                  {renderMessageContent(message)}
                </div>
              )}
            </div>
          )}

          {/* Reactions */}
          {localReactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {localReactions.map((reaction, index) => (
                <span
                  key={`reaction-${messageId}-${index}-${reaction.emoji}`}
                  className={`text-xs px-2 py-1 rounded-full ${
                    isOwnMessage
                      ? "bg-blue-400 text-white"
                      : "bg-gray-600 text-gray-200"
                  }`}
                  title={reaction.userId?.fname}
                >
                  {reaction.emoji}
                </span>
              ))}
            </div>
          )}

          {/* Message Actions - Disabled for temp messages */}
          {!isEditing && (
            <div className="flex items-center space-x-2 mt-2">
              <button
                onClick={() => setShowReactions(!showReactions)}
                disabled={!messageId || isTempMessage}
                className={`text-xs p-1 rounded ${
                  isOwnMessage
                    ? "text-blue-200 hover:text-white hover:bg-blue-400"
                    : "text-gray-300 hover:text-gray-100 hover:bg-gray-600"
                } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                title={
                  isTempMessage
                    ? t("communication.cannotReactTemp")
                    : t("communication.addReaction")
                }
              >
                😊
              </button>

              {isOwnMessage && (
                <>
                  {isTextMessage && (
                    <button
                      onClick={() => {
                        if (!messageId || isTempMessage) {
                          showNotification(
                            t("communication.cannotEditTemp"),
                            "warning",
                          );
                          return;
                        }
                        setIsEditing(true);
                      }}
                      disabled={!messageId || isTempMessage}
                      className={`text-xs p-1 rounded ${
                        isOwnMessage
                          ? "text-blue-200 hover:text-white hover:bg-blue-400"
                          : "text-gray-300 hover:text-gray-100 hover:bg-gray-600"
                      } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={
                        isTempMessage
                          ? t("communication.cannotEditTemp")
                          : t("common.edit")
                      }
                    >
                      {t("common.edit")}
                    </button>
                  )}

                  {/* Download button for files */}
                  {(isImageMessage || isDocumentMessage) && !isTempMessage && (
                    <button
                      onClick={handleFileDownload}
                      disabled={!messageId}
                      className={`text-xs p-1 rounded ${
                        isOwnMessage
                          ? "text-blue-200 hover:text-white hover:bg-blue-400"
                          : "text-gray-300 hover:text-gray-100 hover:bg-gray-600"
                      } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={t("communication.download")}
                    >
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
                    </button>
                  )}

                  <button
                    onClick={handleDelete}
                    disabled={!messageId || isTempMessage}
                    className={`text-xs p-1 rounded ${
                      isOwnMessage
                        ? "text-blue-200 hover:text-white hover:bg-blue-400"
                        : "text-gray-300 hover:text-gray-100 hover:bg-gray-600"
                    } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={
                      isTempMessage
                        ? t("communication.cannotDeleteTemp")
                        : t("common.delete")
                    }
                  >
                    {t("common.delete")}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Reaction Picker */}
          {showReactions && (
            <div className="flex flex-wrap gap-1 mt-2 p-2 bg-gray-800 rounded-lg border border-gray-600 shadow-lg">
              {commonReactions.map((emoji) => (
                <button
                  key={`emoji-${emoji}`}
                  onClick={() => handleReaction(emoji)}
                  className="text-lg p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal />
    </>
  );
};

export default Message;
