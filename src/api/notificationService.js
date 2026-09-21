import axios from "./axiosInstance";

/**
 * Notification Service for Admin Panel
 * Handles all in-app notification operations
 */

const notificationService = {
  /**
   * Get unread notification count
   * @returns {Promise<number>} Unread count
   */
  getUnreadCount: async () => {
    try {
      const response = await axios.get("/staff/notifications/in-app/count");
      return response.data.data || 0;
    } catch (error) {
      console.error("Error fetching notification count:", error);
      throw error;
    }
  },

  /**
   * Get all unread notifications and mark them as read
   * @returns {Promise<Array>} Array of notifications
   */
  getNotifications: async () => {
    try {
      const response = await axios.get("/staff/notifications/in-app/all");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  /**
   * Format notification for display
   * @param {Object} notification - Raw notification from backend
   * @returns {Object} Formatted notification
   */
  formatNotification: (notification) => {
    const getIcon = (message) => {
      if (!message) return "Bell";
      const msg = message.toLowerCase();
      if (msg.includes("worker") || msg.includes("staff")) return "Users";
      if (msg.includes("payment")) return "CreditCard";
      if (msg.includes("wash")) return "Droplets";
      if (msg.includes("attendance")) return "Calendar";
      if (msg.includes("booking")) return "BookOpen";
      if (msg.includes("deleted")) return "Trash2";
      if (msg.includes("updated")) return "Edit";
      if (msg.includes("created")) return "Plus";
      return "Bell";
    };

    const getColor = (message) => {
      if (!message) return "blue";
      const msg = message.toLowerCase();
      if (msg.includes("deleted")) return "red";
      if (msg.includes("created")) return "green";
      if (msg.includes("updated")) return "amber";
      if (msg.includes("payment")) return "emerald";
      if (msg.includes("wash")) return "cyan";
      return "blue";
    };

    const timeAgo = (date) => {
      if (!date) return "Just now";
      const seconds = Math.floor((new Date() - new Date(date)) / 1000);

      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + " years ago";

      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + " months ago";

      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + " days ago";

      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + " hours ago";

      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + " minutes ago";

      return "Just now";
    };

    return {
      id: notification._id,
      icon: getIcon(notification.message),
      color: getColor(notification.message),
      title: notification.message || "New Notification",
      time: timeAgo(notification.createdAt),
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      createdBy: notification.createdBy,
      worker: notification.worker,
    };
  },

  /**
   * Mark all notifications as read
   * @returns {Promise<void>}
   */
  markAllAsRead: async () => {
    try {
      await axios.put("/staff/notifications/in-app/mark-all-read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      throw error;
    }
  },
};

export default notificationService;
