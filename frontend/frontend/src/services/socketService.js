import io from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(process.env.REACT_APP_API_URL || "http://localhost:9000", {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on("connect", () => {
      console.log("Connected to server");
      this.isConnected = true;
      this.emit("user-online");
      this.notifyListeners("connect", { connected: true });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from server:", reason);
      this.isConnected = false;
      this.notifyListeners("disconnect", { reason });
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      this.notifyListeners("connect_error", { error });
    });

    this.socket.on("newMessage", (message) => {
      this.notifyListeners("newMessage", message);
    });

    this.socket.on("messageReactionUpdated", (data) => {
      this.notifyListeners("messageReactionUpdated", data);
    });

    this.socket.on("messageEdited", (data) => {
      this.notifyListeners("messageEdited", data);
    });

    this.socket.on("messageDeleted", (data) => {
      this.notifyListeners("messageDeleted", data);
    });

    this.socket.on("user-typing", (data) => {
      this.notifyListeners("user-typing", data);
    });

    this.socket.on("message-delivered", (data) => {
      this.notifyListeners("message-delivered", data);
    });

    this.socket.on("user-status-changed", (data) => {
      this.notifyListeners("user-status-changed", data);
    });
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for ${event}:`, error);
        }
      });
    }
  }

  startTyping(receiverId) {
    this.emit("typing-start", { receiverId });
  }

  stopTyping(receiverId) {
    this.emit("typing-stop", { receiverId });
  }

  markMessageDelivered(messageId, senderId) {
    this.emit("message-delivered", { messageId, senderId });
  }

  sendMessageReaction(messageId, receiverId, reactions) {
    this.emit("message-reaction", { messageId, receiverId, reactions });
  }

  sendMessageEdit(messageId, receiverId, newContent, editedAt) {
    this.emit("message-edit", { messageId, receiverId, newContent, editedAt });
  }

  sendMessageDelete(messageId, receiverId) {
    this.emit("message-delete", { messageId, receiverId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

const socketService = new SocketService();
export default socketService;
