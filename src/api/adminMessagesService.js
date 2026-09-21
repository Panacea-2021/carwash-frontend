import api from "./axiosInstance";

export const adminMessagesService = {
  // Send a message
  sendMessage: async (data) => {
    try {
      const response = await api.post("/admin-messages/send", data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Get conversation messages
  getConversation: async (staffId, limit = 100) => {
    try {
      const response = await api.get(
        `/admin-messages/conversation/${staffId}`,
        {
          params: { limit },
        },
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Get unread count for a specific conversation
  getUnreadCount: async (staffId) => {
    try {
      const response = await api.get(`/admin-messages/unread/${staffId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Get all unread counts (admin only)
  getAllUnreadCounts: async () => {
    try {
      const response = await api.get("/admin-messages/unread-all");
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Get total unread for admin
  getTotalUnread: async () => {
    try {
      const response = await api.get("/admin-messages/total-unread");
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Mark messages as read
  markAsRead: async (staffId) => {
    try {
      const response = await api.put(`/admin-messages/mark-read/${staffId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/admin-messages/${messageId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },
};

export default adminMessagesService;
