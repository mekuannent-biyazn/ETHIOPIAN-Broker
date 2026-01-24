import React from "react";
import EmojiDebug from "../components/Communication/EmojiDebug";
import TestEnhancedMessaging from "../components/Communication/TestEnhancedMessaging";

const TestEmoji = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Emoji & Enhanced Messaging Test
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Debug Component */}
          <div>
            <EmojiDebug />
          </div>

          {/* Test Messaging Component */}
          <div>
            <TestEnhancedMessaging />
          </div>
        </div>

        <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Use the debug component on the left to test emoji parsing</li>
            <li>
              Try different combinations like "Hello 😊 world!" or just "😂😂😂"
            </li>
            <li>
              Use the messaging component on the right to test the full
              experience
            </li>
            <li>
              Click the emoji button (😊) in the message input to open the
              picker
            </li>
            <li>
              Try sending emoji-only messages vs mixed text+emoji messages
            </li>
            <li>Test file uploads with emoji captions</li>
          </ol>

          <div className="mt-4 p-4 bg-yellow-50 rounded-md">
            <h3 className="font-bold text-yellow-800">Expected Behavior:</h3>
            <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
              <li>Emoji-only messages should display larger (like "😂😂😂")</li>
              <li>Mixed messages should show emojis inline with text</li>
              <li>Emoji picker should open when clicking the 😊 button</li>
              <li>Clicking outside should close the emoji picker</li>
              <li>File downloads should work with multiple fallback methods</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEmoji;
