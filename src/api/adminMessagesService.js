import api from "./axiosInstance";

export const adminMessagesService = {
<<<<<<< HEAD
  // Send a message
  sendMessage: async (data) => {
    try {
      const response = await api.post("/admin-messages/send", data);
=======
  getConversation: async (staffId) => {
    try {
      const response = await api.get(`/admin-messages/conversation/${staffId}`);
>>>>>>> origin/main
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

<<<<<<< HEAD
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
=======
>>>>>>> origin/main
  getUnreadCount: async (staffId) => {
    try {
      const response = await api.get(`/admin-messages/unread/${staffId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

<<<<<<< HEAD
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
=======
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
>>>>>>> origin/main
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

<<<<<<< HEAD
  // Mark messages as read
  markAsRead: async (staffId) => {
    try {
      const response = await api.put(`/admin-messages/mark-read/${staffId}`);
=======
  markAsRead: async (staffId) => {
    try {
      const response = await api.put(`/admin-messages/read/${staffId}`);
>>>>>>> origin/main
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

<<<<<<< HEAD
  // Delete a message
=======
>>>>>>> origin/main
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
