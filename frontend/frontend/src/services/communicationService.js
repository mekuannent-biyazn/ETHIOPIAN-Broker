import axios from "../api/axios";

const communicationService = {
  sendMessage: async (messageData) => {
    try {
      const formData = new FormData();

      // Append all required fields
      if (messageData.receiverId)
        formData.append("receiverId", messageData.receiverId);
      if (messageData.content) formData.append("content", messageData.content);
      if (messageData.propertyId)
        formData.append("propertyId", messageData.propertyId);
      if (messageData.parentMessageId)
        formData.append("parentMessageId", messageData.parentMessageId);
      if (messageData.messageType)
        formData.append("messageType", messageData.messageType);

      // Handle file upload
      if (messageData.file) {
        formData.append("file", messageData.file);
      }

      console.log("📤 Sending message with data:", {
        receiverId: messageData.receiverId,
        hasFile: !!messageData.file,
        fileType: messageData.file?.type,
        contentLength: messageData.content?.length,
      });

      // ✅ FIXED: Add /api prefix since baseURL doesn't have it
      const response = await axios.post("/api/communication/send", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      });

      console.log("✅ Message sent successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Send message error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
      });

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  getConversation: async (userId, page = 1, limit = 50) => {
    try {
      // ✅ FIXED: Add /api prefix
      const response = await axios.get(
        `/api/communication/conversation/${userId}`,
        {
          params: { page, limit },
        }
      );

      // Validate response data
      if (response.data && Array.isArray(response.data.data)) {
        response.data.data = response.data.data.map((message, index) => {
          if (!message._id) {
            console.warn(
              `Message at index ${index} missing ID, generating temporary ID`
            );
            message._id = `temp-conversation-${Date.now()}-${index}`;
          }
          return message;
        });
      }

      return response.data;
    } catch (error) {
      console.error("Get conversation error:", error);
      throw error;
    }
  },

  getMyConversations: async () => {
    try {
      // ✅ FIXED: Add /api prefix
      const response = await axios.get("/api/communication/conversations");

      // Validate conversations data
      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data.conversations)
      ) {
        response.data.data.conversations = response.data.data.conversations.map(
          (conv) => {
            if (conv.lastMessage && !conv.lastMessage._id) {
              console.warn(
                "Conversation last message missing ID:",
                conv.user?._id
              );
              conv.lastMessage._id = `temp-last-${Date.now()}-${
                conv.user?._id || "unknown"
              }`;
            }
            return conv;
          }
        );
      }

      return response.data;
    } catch (error) {
      console.error("Get conversations error:", error);
      throw error;
    }
  },

  markAsRead: async (messageId) => {
    try {
      // ✅ FIXED: Add /api prefix
      const response = await axios.patch(
        `/api/communication/message/${messageId}/read`
      );
      return response.data;
    } catch (error) {
      console.error("Mark as read error:", error);
      throw error;
    }
  },

  markConversationAsRead: async (userId) => {
    try {
      // ✅ FIXED: Add /api prefix
      const response = await axios.patch(
        `/api/communication/conversation/${userId}/read`
      );
      return response.data;
    } catch (error) {
      console.error("Mark conversation as read error:", error);
      throw error;
    }
  },

  getUnreadCount: async () => {
    try {
      // ✅ FIXED: Add /api prefix
      const response = await axios.get("/api/communication/unread-count");
      return response.data;
    } catch (error) {
      console.error("Get unread count error:", error);
      throw error;
    }
  },

  addReaction: async (messageId, emoji) => {
    try {
      // ✅ FIXED: Add /api prefix
      const response = await axios.patch(
        `/api/communication/message/${messageId}/reaction`,
        {
          emoji,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Add reaction error:", error);
      throw error;
    }
  },

  editMessage: async (messageId, content) => {
    try {
      // ✅ FIXED: Add /api prefix
      const response = await axios.put(
        `/api/communication/messages/${messageId}/edit`,
        {
          content,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Edit message error:", error);
      throw error;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      // ✅ FIXED: Add /api prefix
      const response = await axios.delete(
        `/api/communication/messages/${messageId}/delete`
      );
      return response.data;
    } catch (error) {
      console.error("Delete message error:", error);
      throw error;
    }
  },

  getMessageStats: async () => {
    try {
      // ✅ FIXED: Add /api prefix
      const response = await axios.get("/api/communication/stats");
      return response.data;
    } catch (error) {
      console.error("Get message stats error:", error);
      throw error;
    }
  },

  searchMessages: async (query) => {
    try {
      // ✅ FIXED: Add /api prefix
      const response = await axios.get("/api/communication/search", {
        params: { query },
      });
      return response.data;
    } catch (error) {
      console.error("Search messages error:", error);
      throw error;
    }
  },

  downloadFile: async (messageId) => {
    try {
      // ✅ FIXED: Add /api prefix
      const response = await axios.get(
        `/api/communication/message/${messageId}/download`
      );
      return response.data;
    } catch (error) {
      console.error("Download file error:", error);
      throw error;
    }
  },

  serveFile: async (messageId) => {
    try {
      // ✅ FIXED: Add /api prefix
      const response = await axios.get(
        `/api/communication/download/${messageId}/file`,
        {
          responseType: "blob",
        }
      );
      return response;
    } catch (error) {
      console.error("Serve file error:", error);
      throw error;
    }
  },

  // ✅ ADDED: Test API connection
  testConnection: async () => {
    try {
      const response = await axios.get("/api/communication/test");
      return response.data;
    } catch (error) {
      console.error("Test connection error:", error);
      throw error;
    }
  },

  // ✅ ADDED: Get available users for messaging
  getAvailableUsers: async () => {
    try {
      const response = await axios.get("/api/users/available");
      return response.data;
    } catch (error) {
      console.error("Get available users error:", error);
      throw error;
    }
  },
};

export default communicationService;
