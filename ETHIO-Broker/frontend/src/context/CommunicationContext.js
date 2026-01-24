import React, {
  createContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
} from "react";
import communicationService from "../services/communicationService";
import socketService from "../services/socketService";
import { useNotification } from "./NotificationContext";
import { useAuth } from "../hooks/useAuth";

// Create context
const CommunicationContext = createContext();

// Reducer
const communicationReducer = (state, action) => {
  switch (action.type) {
    case "SET_CONVERSATIONS":
      return { ...state, conversations: action.payload };

    case "SET_ACTIVE_CONVERSATION":
      return { ...state, activeConversation: action.payload };

    case "ADD_MESSAGE":
      const newMessage = action.payload;

      // Update conversations list
      const updatedConversations = state.conversations.map((conv) => {
        if (
          conv.user._id === newMessage.sender._id ||
          conv.user._id === newMessage.receiver._id
        ) {
          return {
            ...conv,
            lastMessage: newMessage,
            unreadCount:
              newMessage.receiver._id === state.currentUser?.id &&
                !newMessage.isRead
                ? conv.unreadCount + 1
                : conv.unreadCount,
            lastActivity: newMessage.createdAt,
          };
        }
        return conv;
      });

      // Check if conversation exists
      const conversationExists = updatedConversations.some(
        (conv) =>
          conv.user._id === newMessage.sender._id ||
          conv.user._id === newMessage.receiver._id
      );

      // Add new conversation if it doesn't exist and message is from someone else
      if (
        !conversationExists &&
        newMessage.sender._id !== state.currentUser?.id
      ) {
        updatedConversations.unshift({
          user: newMessage.sender,
          lastMessage: newMessage,
          unreadCount: 1,
          totalMessages: 1,
          lastActivity: newMessage.createdAt,
        });
      }

      // Sort conversations by last activity
      updatedConversations.sort(
        (a, b) => new Date(b.lastActivity) - new Date(a.lastActivity)
      );

      // Update active conversation if it matches
      const shouldAddToActive =
        state.activeConversation &&
        (state.activeConversation.userId === newMessage.sender._id ||
          state.activeConversation.userId === newMessage.receiver._id);

      let updatedActiveConversation = state.activeConversation;

      if (shouldAddToActive) {
        // Check if message already exists in active conversation to prevent duplicates
        const messageExists = state.activeConversation.messages.some(
          (msg) => msg._id === newMessage._id
        );

        if (!messageExists) {
          updatedActiveConversation = {
            ...state.activeConversation,
            messages: [...state.activeConversation.messages, newMessage],
          };
        } else {
          console.log("Message already exists, skipping duplicate:", newMessage._id);
          updatedActiveConversation = state.activeConversation;
        }
      }

      // Calculate unread count
      const newUnreadCount =
        newMessage.receiver._id === state.currentUser?.id && !newMessage.isRead
          ? state.unreadCount + 1
          : state.unreadCount;

      return {
        ...state,
        conversations: updatedConversations,
        activeConversation: updatedActiveConversation,
        unreadCount: newUnreadCount,
      };

    case "UPDATE_MESSAGE":
      return {
        ...state,
        activeConversation: state.activeConversation
          ? {
            ...state.activeConversation,
            messages: state.activeConversation.messages.map((msg) =>
              msg._id === action.payload.messageId
                ? { ...msg, ...action.payload.updates }
                : msg
            ),
          }
          : state.activeConversation,
        conversations: state.conversations.map((conv) => {
          if (
            conv.lastMessage &&
            conv.lastMessage._id === action.payload.messageId
          ) {
            return {
              ...conv,
              lastMessage: { ...conv.lastMessage, ...action.payload.updates },
            };
          }
          return conv;
        }),
      };

    case "DELETE_MESSAGE":
      const filteredMessages =
        state.activeConversation?.messages.filter(
          (msg) => msg._id !== action.payload
        ) || [];

      return {
        ...state,
        activeConversation: state.activeConversation
          ? {
            ...state.activeConversation,
            messages: filteredMessages,
          }
          : state.activeConversation,
      };

    case "SET_UNREAD_COUNT":
      return { ...state, unreadCount: action.payload };

    case "SET_CURRENT_USER":
      return { ...state, currentUser: action.payload };

    case "SET_TYPING_INDICATOR":
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.userId]: action.payload.isTyping,
        },
      };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_SOCKET_CONNECTED":
      return { ...state, socketConnected: action.payload };

    case "CLEAR_ACTIVE_CONVERSATION":
      return { ...state, activeConversation: null };

    default:
      return state;
  }
};

const initialState = {
  conversations: [],
  activeConversation: null,
  unreadCount: 0,
  currentUser: null,
  typingUsers: {},
  loading: false,
  error: null,
  socketConnected: false,
};

// Provider component
const CommunicationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(communicationReducer, initialState);
  const { showNotification } = useNotification();
  const { user, token } = useAuth();

  // Use refs for values that change but shouldn't trigger effects
  const showNotificationRef = useRef();
  const activeConversationRef = useRef();
  const currentUserRef = useRef();

  // Update refs on every render
  useEffect(() => {
    showNotificationRef.current = showNotification;
    activeConversationRef.current = state.activeConversation;
    currentUserRef.current = state.currentUser;
  });

  // Stable functions that don't change
  const loadConversations = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await communicationService.getMyConversations();

      // Validate and ensure all messages have IDs
      const validatedConversations = response.data.conversations.map((conv) => {
        if (conv.lastMessage && !conv.lastMessage._id) {
          console.warn("Conversation last message missing ID:", conv);
          conv.lastMessage._id = `temp-${Date.now()}-${conv.user._id}`;
        }
        return conv;
      });

      dispatch({ type: "SET_CONVERSATIONS", payload: validatedConversations });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      showNotificationRef.current?.("Failed to load conversations", "error");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await communicationService.getUnreadCount();
      dispatch({
        type: "SET_UNREAD_COUNT",
        payload: response.data.unreadCount,
      });
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  }, []);

  // Socket setup effect
  useEffect(() => {
    if (!user || !token) return;

    dispatch({ type: "SET_CURRENT_USER", payload: user });

    // Socket event handlers
    const handleNewMessage = (message) => {
      // Validate message has ID
      if (!message._id) {
        console.warn("Received message without ID:", message);
        message._id = `socket-${Date.now()}-${Math.random()}`;
      }

      // Don't add messages from current user via socket (they're already added when sent)
      if (message.sender._id === user?.id) {
        console.log("Ignoring socket message from current user to prevent duplication");
        return;
      }

      dispatch({ type: "ADD_MESSAGE", payload: message });

      // Show notification only if not in active conversation
      if (
        !activeConversationRef.current ||
        activeConversationRef.current.userId !== message.sender._id
      ) {
        showNotificationRef.current?.(
          `New message from ${message.sender.fname}`,
          "info"
        );
      }
    };

    const handleMessageReactionUpdated = (data) => {
      dispatch({
        type: "UPDATE_MESSAGE",
        payload: {
          messageId: data.messageId,
          updates: { emojiReactions: data.reactions },
        },
      });
    };

    const handleMessageEdited = (data) => {
      dispatch({
        type: "UPDATE_MESSAGE",
        payload: {
          messageId: data.messageId,
          updates: {
            content: data.message.content,
            isEdited: true,
            editedAt: data.editedAt,
          },
        },
      });
    };

    const handleMessageDeleted = (data) => {
      dispatch({ type: "DELETE_MESSAGE", payload: data.messageId });
    };

    const handleUserTyping = (data) => {
      dispatch({
        type: "SET_TYPING_INDICATOR",
        payload: {
          userId: data.userId,
          isTyping: data.isTyping,
        },
      });
    };

    // Socket connection and event setup
    socketService.connect(token);

    socketService.on("connect", () => {
      dispatch({ type: "SET_SOCKET_CONNECTED", payload: true });
    });

    socketService.on("disconnect", () => {
      dispatch({ type: "SET_SOCKET_CONNECTED", payload: false });
    });

    socketService.on("newMessage", handleNewMessage);
    socketService.on("messageReactionUpdated", handleMessageReactionUpdated);
    socketService.on("messageEdited", handleMessageEdited);
    socketService.on("messageDeleted", handleMessageDeleted);
    socketService.on("user-typing", handleUserTyping);

    // Load initial data
    const initializeData = async () => {
      try {
        await Promise.all([loadConversations(), loadUnreadCount()]);
      } catch (error) {
        console.error("Failed to initialize communication data:", error);
      }
    };

    initializeData();

    // Cleanup function
    return () => {
      socketService.off("newMessage", handleNewMessage);
      socketService.off("messageReactionUpdated", handleMessageReactionUpdated);
      socketService.off("messageEdited", handleMessageEdited);
      socketService.off("messageDeleted", handleMessageDeleted);
      socketService.off("user-typing", handleUserTyping);
      socketService.disconnect();
    };
  }, [user, token, loadConversations, loadUnreadCount]);

  // Action functions
  const loadConversation = useCallback(
    async (userId, page = 1) => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        const response = await communicationService.getConversation(
          userId,
          page
        );

        // Validate and ensure all messages have IDs
        const validatedMessages = response.data.map((message, index) => {
          if (!message._id) {
            console.warn("Message missing ID:", message);
            message._id = `temp-${Date.now()}-${index}`;
            message.hasTempId = true;
          }
          return message;
        });

        dispatch({
          type: "SET_ACTIVE_CONVERSATION",
          payload: {
            userId,
            messages: validatedMessages,
            pagination: response.pagination,
          },
        });

        // Mark conversation as read
        await communicationService.markConversationAsRead(userId);
        await loadUnreadCount();
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: error.message });
        showNotificationRef.current?.("Failed to load conversation", "error");
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [loadUnreadCount]
  );

  // UPDATED: sendMessage function with better file handling and ID validation
  const sendMessage = useCallback(
    async (messageData) => {
      try {
        // Send message directly to server without optimistic updates
        const response = await communicationService.sendMessage(messageData);

        // Validate response has ID
        if (!response.data._id) {
          console.error("Server response missing message ID:", response.data);
          response.data._id = `server-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        }

        // Add the real message from server
        dispatch({ type: "ADD_MESSAGE", payload: response.data });

        showNotificationRef.current?.("Message sent successfully", "success");
        return response.data;
      } catch (error) {
        console.error("Send message error:", error);

        showNotificationRef.current?.(
          error.response?.data?.error || "Failed to send message",
          "error"
        );
        throw error;
      }
    },
    [user]
  );

  const addReaction = useCallback(
    async (messageId, emoji) => {
      try {
        // Validate message ID
        if (!messageId || messageId.startsWith("temp-")) {
          showNotificationRef.current?.(
            "Cannot react to temporary message",
            "warning"
          );
          return;
        }

        const response = await communicationService.addReaction(
          messageId,
          emoji
        );
        dispatch({
          type: "UPDATE_MESSAGE",
          payload: {
            messageId,
            updates: { emojiReactions: response.data },
          },
        });

        // Emit socket event
        const message = state.activeConversation?.messages.find(
          (m) => m._id === messageId
        );
        if (message && socketService.getConnectionStatus()) {
          const targetUserId =
            message.sender._id === user?.id
              ? message.receiver._id
              : message.sender._id;
          socketService.emit("messageReactionUpdated", {
            messageId,
            reactions: response.data,
            targetUserId,
          });
        }
      } catch (error) {
        showNotificationRef.current?.("Failed to add reaction", "error");
      }
    },
    [state.activeConversation, user]
  );

  const editMessage = useCallback(
    async (messageId, content) => {
      try {
        // Validate message ID
        if (!messageId || messageId.startsWith("temp-")) {
          showNotificationRef.current?.(
            "Cannot edit temporary message",
            "warning"
          );
          return;
        }

        const response = await communicationService.editMessage(
          messageId,
          content
        );
        dispatch({
          type: "UPDATE_MESSAGE",
          payload: {
            messageId,
            updates: response.data,
          },
        });

        // Emit socket event
        const message = state.activeConversation?.messages.find(
          (m) => m._id === messageId
        );
        if (message && socketService.getConnectionStatus()) {
          const targetUserId =
            message.sender._id === user?.id
              ? message.receiver._id
              : message.sender._id;
          socketService.emit("messageEdited", {
            messageId,
            message: response.data,
            targetUserId,
          });
        }

        showNotificationRef.current?.(
          "Message updated successfully",
          "success"
        );
      } catch (error) {
        showNotificationRef.current?.("Failed to edit message", "error");
        throw error;
      }
    },
    [state.activeConversation, user]
  );

  const deleteMessage = useCallback(
    async (messageId) => {
      try {
        // Validate message ID
        if (!messageId || messageId.startsWith("temp-")) {
          showNotificationRef.current?.(
            "Cannot delete temporary message",
            "warning"
          );
          return;
        }

        await communicationService.deleteMessage(messageId);
        dispatch({ type: "DELETE_MESSAGE", payload: messageId });

        // Emit socket event
        const message = state.activeConversation?.messages.find(
          (m) => m._id === messageId
        );
        if (message && socketService.getConnectionStatus()) {
          const targetUserId =
            message.sender._id === user?.id
              ? message.receiver._id
              : message.sender._id;
          socketService.emit("messageDeleted", {
            messageId,
            targetUserId,
            deletedBy: user?.id,
          });
        }

        showNotificationRef.current?.(
          "Message deleted successfully",
          "success"
        );
      } catch (error) {
        showNotificationRef.current?.("Failed to delete message", "error");
      }
    },
    [state.activeConversation, user]
  );

  const startTyping = useCallback((receiverId) => {
    if (socketService.getConnectionStatus()) {
      socketService.emit("start-typing", { receiverId });
    }
  }, []);

  const stopTyping = useCallback((receiverId) => {
    if (socketService.getConnectionStatus()) {
      socketService.emit("stop-typing", { receiverId });
    }
  }, []);

  const clearActiveConversation = useCallback(() => {
    dispatch({ type: "CLEAR_ACTIVE_CONVERSATION" });
  }, []);

  // Stable context value
  const contextValue = React.useMemo(
    () => ({
      ...state,
      sendMessage,
      loadConversation,
      loadConversations,
      addReaction,
      editMessage,
      deleteMessage,
      loadUnreadCount,
      startTyping,
      stopTyping,
      clearActiveConversation,
    }),
    [
      state,
      sendMessage,
      loadConversation,
      loadConversations,
      addReaction,
      editMessage,
      deleteMessage,
      loadUnreadCount,
      startTyping,
      stopTyping,
      clearActiveConversation,
    ]
  );

  return (
    <CommunicationContext.Provider value={contextValue}>
      {children}
    </CommunicationContext.Provider>
  );
};

// Custom hook to use communication context
export const useCommunication = () => {
  const context = React.useContext(CommunicationContext);
  if (context === undefined) {
    throw new Error(
      "useCommunication must be used within a CommunicationProvider"
    );
  }
  return context;
};

// Export the provider and context
export { CommunicationProvider, CommunicationContext };
