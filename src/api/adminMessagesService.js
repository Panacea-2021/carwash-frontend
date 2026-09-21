import api from "./axiosInstance";

export const adminMessagesService = {
<<<<<<< HEAD
  getConversation: async (staffId) => {
    try {
      const response = await api.get(`/admin-messages/conversation/${staffId}`);
=======
  // Send a message
  sendMessage: async (data) => {
    try {
      const response = await api.post("/admin-messages/send", data);
>>>>>>> 04c7292 (Update car wash frontend)
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

<<<<<<< HEAD
=======
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
>>>>>>> 04c7292 (Update car wash frontend)
  getUnreadCount: async (staffId) => {
    try {
      const response = await api.get(`/admin-messages/unread/${staffId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

<<<<<<< HEAD
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
=======
  // Get all unread counts (admin only)
  getAllUnreadCounts: async () => {
    try {
      const response = await api.get("/admin-messages/unread-all");
>>>>>>> 04c7292 (Update car wash frontend)
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

<<<<<<< HEAD
  sendMessage: async ({ staffId, message }) => {
    try {
      const response = await api.post(`/admin-messages/send/${staffId}`, { message });
=======
  // Get total unread for admin
  getTotalUnread: async () => {
    try {
      const response = await api.get("/admin-messages/total-unread");
>>>>>>> 04c7292 (Update car wash frontend)
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

<<<<<<< HEAD
  markAsRead: async (staffId) => {
    try {
      const response = await api.put(`/admin-messages/read/${staffId}`);
=======
  // Mark messages as read
  markAsRead: async (staffId) => {
    try {
      const response = await api.put(`/admin-messages/mark-read/${staffId}`);
>>>>>>> 04c7292 (Update car wash frontend)
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

<<<<<<< HEAD
=======
  // Delete a message
>>>>>>> 04c7292 (Update car wash frontend)
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
