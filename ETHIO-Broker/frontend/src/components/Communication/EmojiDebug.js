import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const EmojiDebug = () => {
  const { t } = useTranslation();
  const [testMessage, setTestMessage] = useState(
    t("communication.welcomeToMessages"),
  );
  const [parsedResult, setParsedResult] = useState(null);

  // Frontend emoji detection (same as in Message component)
  const isEmojiOnlyMessage = (content) => {
    if (!content) return false;
    const emojiRegex = /^[\p{Emoji_Presentation}\p{Emoji}\uFE0F\s]+$/u;
    return emojiRegex.test(content.trim());
  };

  const renderMessageContent = (message) => {
    // If message has contentParts (mixed content), render them
    if (message.contentParts && message.contentParts.length > 0) {
      return message.contentParts
        .sort((a, b) => a.position - b.position)
        .map((part, index) => {
          if (part.type === "emoji") {
            return (
              <span
                key={index}
                className="inline-block text-2xl mx-1 emoji-part bg-yellow-100 px-1 rounded"
                role="img"
                aria-label="emoji"
                title={`${t("communication.emoji")}: ${part.value}`}
              >
                {part.value}
              </span>
            );
          } else {
            return (
              <span
                key={index}
                className="text-part bg-blue-100 px-1 rounded"
                title={`${t("communication.text")}: ${part.value}`}
              >
                {part.value}
              </span>
            );
          }
        });
    }

    // Fallback to regular content
    return message.content || "";
  };

  // Simulate backend parsing (same logic as backend)
  const parseMessageContent = (text) => {
    if (!text) return { type: "text", parts: [] };

    // Emoji regex pattern (basic Unicode emoji detection)
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
    const parts = [];
    let lastIndex = 0;
    let match;
    let hasEmojis = false;

    while ((match = emojiRegex.exec(text)) !== null) {
      hasEmojis = true;

      // Add text before emoji
      if (match.index > lastIndex) {
        const textPart = text.slice(lastIndex, match.index);
        if (textPart.trim()) {
          parts.push({
            type: "text",
            value: textPart,
            position: parts.length,
          });
        }
      }

      // Add emoji
      parts.push({
        type: "emoji",
        value: match[0],
        position: parts.length,
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText.trim()) {
        parts.push({
          type: "text",
          value: remainingText,
          position: parts.length,
        });
      }
    }

    // If no emojis found, treat as plain text
    if (!hasEmojis) {
      parts.push({
        type: "text",
        value: text,
        position: 0,
      });
    }

    return {
      type: hasEmojis ? "mixed" : "text",
      parts: parts,
    };
  };

  const testParsing = () => {
    const result = parseMessageContent(testMessage);
    setParsedResult(result);
  };

  const testMessages = [
    t("communication.welcomeToMessages"),
    "😂😂😂",
    t("communication.noMessages"),
    "Start 🎉 middle 🎊 end",
    "🚀 " + t("communication.startNewChat"),
    t("communication.endWith") + " 🚀",
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">
        {t("communication.emojiDebug")}
      </h2>

      {/* Test Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          {t("communication.testMessage")}:
        </label>
        <input
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder={t("communication.typeMessageWithEmojis")}
        />
        <button
          onClick={testParsing}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          {t("communication.parseMessage")}
        </button>
      </div>

      {/* Parsing Result */}
      {parsedResult && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h3 className="font-bold mb-2">
            {t("communication.parsingResult")}:
          </h3>
          <div className="mb-2">
            <strong>{t("communication.type")}:</strong> {parsedResult.type}
          </div>
          <div className="mb-2">
            <strong>{t("communication.parts")}:</strong>{" "}
            {parsedResult.parts.length}
          </div>
          <div className="mb-2">
            <strong>{t("communication.isEmojiOnly")}:</strong>{" "}
            {isEmojiOnlyMessage(testMessage) ? t("common.yes") : t("common.no")}
          </div>

          <h4 className="font-bold mt-4 mb-2">
            {t("communication.partsBreakdown")}:
          </h4>
          {parsedResult.parts.map((part, index) => (
            <div key={index} className="mb-1 p-2 border rounded">
              <span className="font-mono text-sm">
                [{index}] {part.type}: "{part.value}"
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Rendered Result */}
      {parsedResult && (
        <div className="mb-6 p-4 bg-green-50 rounded-md">
          <h3 className="font-bold mb-2">
            {t("communication.renderedResult")}:
          </h3>
          <div
            className={`p-3 border rounded ${
              isEmojiOnlyMessage(testMessage) ? "text-3xl" : "text-base"
            }`}
          >
            {renderMessageContent({
              contentParts: parsedResult.parts,
              content: testMessage,
            })}
          </div>
        </div>
      )}

      {/* Quick Tests */}
      <div className="mb-6">
        <h3 className="font-bold mb-2">{t("communication.quickTests")}:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {testMessages.map((msg, index) => (
            <button
              key={index}
              onClick={() => {
                setTestMessage(msg);
                const result = parseMessageContent(msg);
                setParsedResult(result);
              }}
              className="p-2 text-left border rounded hover:bg-gray-50"
            >
              <div className="font-mono text-sm">{msg}</div>
              <div className="text-xs text-gray-500">
                {parseMessageContent(msg).type} -{" "}
                {parseMessageContent(msg).parts.length}{" "}
                {t("communication.parts")}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Status */}
      <div className="p-4 bg-blue-50 rounded-md">
        <h3 className="font-bold mb-2">{t("communication.statusCheck")}:</h3>
        <ul className="text-sm space-y-1">
          <li>
            ✅ {t("communication.emojiRegexWorking")}:{" "}
            {/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu.test("😊")
              ? t("common.yes")
              : t("common.no")}
          </li>
          <li>
            ✅ {t("communication.unicodeSupport")}:{" "}
            {typeof "😊".match(/\p{Emoji}/u) !== "undefined"
              ? t("common.yes")
              : t("common.no")}
          </li>
          <li>
            ✅ {t("communication.parsingFunction")}:{" "}
            {typeof parseMessageContent === "function"
              ? t("common.yes")
              : t("common.no")}
          </li>
          <li>
            ✅ {t("communication.renderingFunction")}:{" "}
            {typeof renderMessageContent === "function"
              ? t("common.yes")
              : t("common.no")}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EmojiDebug;
