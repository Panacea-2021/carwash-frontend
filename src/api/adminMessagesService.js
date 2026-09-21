import api from "./axiosInstance";

export const adminMessagesService = {
  getConversation: async (staffId) => {
    try {
      const response = await api.get(`/admin-messages/conversation/${staffId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  getUnreadCount: async (staffId) => {
    try {
      const response = await api.get(`/admin-messages/unread/${staffId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  getTotalUnread: async () => {
    try {
      const response = await api.get("/admin-messages/unread-total");
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  getAllUnreadCounts: async () => {
    try {
      const response = await api.get("/admin-messages/unread-counts");
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  sendMessage: async ({ staffId, message }) => {
    try {
      const response = await api.post(`/admin-messages/send/${staffId}`, { message });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  markAsRead: async (staffId) => {
    try {
      const response = await api.put(`/admin-messages/read/${staffId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

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
