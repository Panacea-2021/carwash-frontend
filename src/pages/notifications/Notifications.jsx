import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import notificationService from "../../api/notificationService";
import {
  Bell,
  Users,
  CreditCard,
  Droplets,
  Calendar,
  BookOpen,
  Trash2,
  Edit,
  Plus,
  Clock,
  Check,
  Loader2,
  Filter,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import usePagePermissions from "../../utils/usePagePermissions";

const Notifications = () => {
  const pp = usePagePermissions("notifications");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, read

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      const formatted = data.map(notificationService.formatNotification);
      setNotifications(formatted);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      toast.success("All notifications marked as read");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const getNotificationIcon = (iconName, color) => {
    const iconClass = `w-5 h-5 ${getColor(color)}`;
    const icons = {
      Users: <Users className={iconClass} />,
      CreditCard: <CreditCard className={iconClass} />,
      Droplets: <Droplets className={iconClass} />,
      Calendar: <Calendar className={iconClass} />,
      BookOpen: <BookOpen className={iconClass} />,
      Trash2: <Trash2 className={iconClass} />,
      Edit: <Edit className={iconClass} />,
      Plus: <Plus className={iconClass} />,
      Bell: <Bell className={iconClass} />,
    };
    return icons[iconName] || <Bell className={iconClass} />;
  };

  const getColor = (color) => {
    const colors = {
      red: "text-red-600",
      green: "text-green-600",
      amber: "text-amber-600",
      emerald: "text-emerald-600",
      cyan: "text-cyan-600",
      blue: "text-blue-600",
      purple: "text-purple-600",
    };
    return colors[color] || "text-blue-600";
  };

  const getBgColor = (color) => {
    const colors = {
      red: "bg-red-50 border-red-200",
      green: "bg-green-50 border-green-200",
      amber: "bg-amber-50 border-amber-200",
      emerald: "bg-emerald-50 border-emerald-200",
      cyan: "bg-cyan-50 border-cyan-200",
      blue: "bg-blue-50 border-blue-200",
      purple: "bg-purple-50 border-purple-200",
    };
    return colors[color] || "bg-blue-50 border-blue-200";
  };

  const getDubaiTime = (date) => {
    if (!date) return "N/A";
    const options = {
      timeZone: "Asia/Dubai",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return new Date(date).toLocaleString("en-US", options);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-main flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            Notifications
          </h1>
          <p className="text-text-muted mt-1">
            Stay updated with all your activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-sm text-text-muted">Unread:</span>
              <span className="text-xl font-bold text-red-600 ml-2">
                {unreadCount}
              </span>
            </div>
          )}
          {unreadCount > 0 && pp.isToolbarVisible("markAllRead") && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
            >
              <Check className="w-5 h-5" />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {pp.isToolbarVisible("filterTabs") && (
      <div className="flex gap-3">
        {["all", "unread", "read"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              filter === f
                ? "bg-primary text-white shadow-md"
                : "bg-card border border-border text-text-muted hover:bg-page"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "unread" && unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>
      )}

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-xl">
          <Bell className="w-20 h-20 text-text-muted mx-auto mb-4 opacity-30" />
          <p className="text-xl font-semibold text-text-main mb-2">
            No notifications
          </p>
          <p className="text-text-muted">
            {filter === "unread"
              ? "You're all caught up!"
              : "No notifications to display"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-card border rounded-xl p-6 transition-all hover:shadow-lg ${
                  !notification.isRead
                    ? "border-primary/50 bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div
                    className={`p-3 rounded-xl border ${getBgColor(notification.color)} shrink-0`}
                  >
                    {getNotificationIcon(notification.icon, notification.color)}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-base font-bold text-text-main">
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Dubai Time */}
                    <div className="flex items-center gap-4 text-sm text-text-muted">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{notification.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">
                          {getDubaiTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Notifications;
