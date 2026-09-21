import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getTracker } from "../utils/getTracker";
import {
  Menu,
  Moon,
  Sun,
  LogOut,
  Bell,
  Search,
  Settings,
  User,
  ChevronDown,
  Shield,
  Activity,
  Zap,
  TrendingUp,
  Clock,
  Command,
  X,
  Check,
  AlertCircle,
  Info,
  Sparkles,
  Home,
  ChevronRight,
  Users,
  CreditCard,
  Droplets,
  Calendar,
  BookOpen,
  Trash2,
  Edit,
  Plus,
  MessageCircle,
  Headphones,
} from "lucide-react";
import toast from "react-hot-toast";
import { routes } from "../routes";
import notificationService from "../api/notificationService";
import { adminMessagesService } from "../api/adminMessagesService";
import AdminChatModal from "../components/modals/AdminChatModal";

const Header = ({ onMenuClick, theme, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // State Management
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statusIndicator, setStatusIndicator] = useState("online");

  // Chat for staff
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);

  // Refs for click outside detection
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  const currentRoute = routes.find((route) => route.path === location.pathname);
  const pageTitle = currentRoute ? currentRoute.title : "Dashboard Overview";

  // --- User Data Logic ---
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : {};
  const userName = user.name || user.firstName || "Admin";
  const userRole = user.role || "Manager";
  const userInitial = userName.charAt(0).toUpperCase();
  const userEmail = user.email || "admin@babacarwash.com";
  const isStaff = userRole === "manager";
  const isAdmin = userRole === "admin";

  // Fetch unread message count for staff or admin
  const fetchMessageUnreadCount = async () => {
    if (!user._id) return;

    try {
      if (isStaff) {
        const response = await adminMessagesService.getUnreadCount(user._id);
        setMessageUnreadCount(response.count || 0);
      } else if (isAdmin) {
        const response = await adminMessagesService.getTotalUnread();
        setMessageUnreadCount(response.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch message unread count:", error);
    }
  };

  // dsjdkFetch notificationeds from backend
  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      const formatted = data.map(notificationService.formatNotification);
      setNotifications(formatted);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  };

  // Initialize enotifications
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    if (isStaff || isAdmin) {
      fetchMessageUnreadCount();
    }

    // Poll for new notifications every 30 seconds
    const pollInterval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
      if (isStaff || isAdmin) {
        fetchMessageUnreadCount();
      }
    }, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
      // Escape to close modals
      if (e.key === "Escape") {
        setShowSearch(false);
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  const handleLogout = () => {
    // Track logout and dispose tracker before clearing auth
    const tracker = getTracker();
    tracker.trackLogout();
    tracker.dispose();

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    toast.success("All notifications marked as read");
  };

  const getNotificationIcon = (iconName, color) => {
    const iconMap = {
      Users: Users,
      CreditCard: CreditCard,
      Droplets: Droplets,
      Calendar: Calendar,
      BookOpen: BookOpen,
      Trash2: Trash2,
      Edit: Edit,
      Plus: Plus,
      Bell: Bell,
      Check: Check,
      AlertCircle: AlertCircle,
      Info: Info,
      X: X,
    };

    const IconComponent = iconMap[iconName] || Bell;
    const colorMap = {
      red: "text-red-400",
      green: "text-emerald-400",
      amber: "text-amber-400",
      emerald: "text-emerald-400",
      cyan: "text-cyan-400",
      blue: "text-blue-400",
    };

    return (
      <IconComponent
        className={`w-4 h-4 ${colorMap[color] || "text-blue-400"}`}
      />
    );
  };

  const getNotificationBgColor = (color) => {
    const bgColorMap = {
      red: "bg-red-500/10 border-red-500/30",
      green: "bg-emerald-500/10 border-emerald-500/30",
      amber: "bg-amber-500/10 border-amber-500/30",
      emerald: "bg-emerald-500/10 border-emerald-500/30",
      cyan: "bg-cyan-500/10 border-cyan-500/30",
      blue: "bg-blue-500/10 border-blue-500/30",
    };

    return bgColorMap[color] || "bg-blue-500/10 border-blue-500/30";
  };

  // ✅ Role-based route filtering for search
  const filteredRoutes = routes.filter((route) => {
    // Must have a title to be searchable
    if (!route.title) return false;

    // Check if matches search query
    const matchesSearch = route.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Filter based on user role
    const isSupervisorRoute = route.path?.startsWith("/supervisor/");

    if (userRole === "supervisor") {
      // Supervisors only see supervisor routes
      return isSupervisorRoute;
    } else {
      // Admins/Managers only see non-supervisor routes
      return !isSupervisorRoute;
    }
  });

  const getRoleColor = () => {
    switch (userRole?.toLowerCase()) {
      case "admin":
        return "from-red-500 to-pink-600";
      case "supervisor":
        return "from-purple-500 to-indigo-600";
      case "manager":
        return "from-blue-500 to-cyan-600";
      default:
        return "from-indigo-500 to-purple-600";
    }
  };

  return (
    <>
      {/* Main Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between h-14 md:h-header-h px-4 md:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          {/* Mobile Hamburger */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMenuClick}
            className="p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 rounded-lg transition-colors lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </motion.button>

          {/* Page Title with Breadcrumb */}
          <div className="hidden md:block">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Home className="w-3 h-3" />
              <ChevronRight className="w-3 h-3" />
              <span className="text-xs font-medium">
                {pageTitle ? pageTitle.split(" ")[0] : "Dashboard"}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white transition-all duration-300 tracking-tight flex items-center gap-2">
              {pageTitle || "Dashboard"}
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5 text-indigo-500" />
              </motion.span>
            </h2>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Search Bar */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShowSearch(true)}
            className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50 transition-all shadow-sm hover:shadow-md min-w-[280px] lg:min-w-[340px]"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 dark:text-slate-400 flex-1 text-left font-medium">
              Search anything...
            </span>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 text-[10px] font-semibold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded shadow-sm border border-slate-300 dark:border-slate-600">
                <Command className="w-3 h-3 inline" />K
              </kbd>
            </div>
          </motion.button>

          {/* Contact Admin Button (Staff Only) */}
          {isStaff && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsChatOpen(true)}
              className="relative p-2 md:p-2.5 rounded-full text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 transition-all"
              title="Contact Admin"
            >
              <Headphones className="w-5 h-5" />
              {messageUnreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-0 right-0 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900"
                >
                  {messageUnreadCount}
                </motion.span>
              )}
            </motion.button>
          )}

          {/* Staff Messages Button (Admin Only) */}
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/admin-staff")}
              className="relative p-2 md:p-2.5 rounded-full text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 transition-all"
              title="Staff Messages"
            >
              <MessageCircle className="w-5 h-5" />
              {messageUnreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-0 right-0 w-5 h-5 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900"
                >
                  {messageUnreadCount > 99 ? "99+" : messageUnreadCount}
                </motion.span>
              )}
            </motion.button>
          )}

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 md:p-2.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
          >
            <AnimatePresence mode="wait">
              {theme === "dark" ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 180, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Sun className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -180, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Moon className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 md:p-2.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 transition-all"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900"
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          whileHover={{
                            backgroundColor: "rgba(99, 102, 241, 0.05)",
                          }}
                          className={`p-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-all ${
                            !notification.isRead
                              ? "bg-indigo-50/50 dark:bg-indigo-900/10"
                              : ""
                          }`}
                        >
                          <div className="flex gap-3">
                            <div
                              className={`p-2 rounded-lg ${getNotificationBgColor(
                                notification.color,
                              )} border`}
                            >
                              {getNotificationIcon(
                                notification.icon,
                                notification.color,
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
                                {notification.title}
                              </h4>
                              <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 text-center border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <button
                      onClick={() => {
                        navigate("/notifications");
                        setShowNotifications(false);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="h-6 md:h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

          {/* User Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 md:gap-3 group cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <div
                className={`w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br ${getRoleColor()} rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-md group-hover:shadow-lg transition-all transform group-hover:scale-105 relative`}
              >
                {userInitial}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
              </div>

              <div className="hidden lg:block leading-tight text-left">
                <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">
                  {userName}
                </p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {userRole}
                </p>
              </div>

              <ChevronDown className="w-4 h-4 text-slate-500 hidden lg:block" />
            </motion.button>

            {/* User Menu Dropdown */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
                >
                  {/* User Info */}
                  <div
                    className={`p-4 bg-gradient-to-br ${getRoleColor()} text-white`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white/30">
                        {userInitial}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{userName}</p>
                        <p className="text-xs opacity-90">{userEmail}</p>
                        <p className="text-[10px] font-semibold uppercase mt-1 opacity-75 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {userRole}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <UserMenuItem
                      icon={Settings}
                      label="Settings"
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate("/settings");
                      }}
                    />
                  </div>

                  {/* Logout */}
                  <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all font-semibold text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearch(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
            />
            <motion.div
              ref={searchRef}
              initial={{ opacity: 0, scale: 0.95, y: -30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Search className="w-5 h-5 text-indigo-500" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search pages, features, settings..."
                    autoFocus
                    className="flex-1 bg-transparent text-slate-800 dark:text-white placeholder-slate-400 outline-none text-base font-medium"
                  />
                  <kbd className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    ESC
                  </kbd>
                </div>

                {/* Search Results */}
                <div className="max-h-[420px] overflow-y-auto">
                  {searchQuery === "" ? (
                    <div className="p-12 text-center text-slate-500">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center">
                        <Search className="w-8 h-8 text-indigo-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Start typing to search
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Find pages, features, and more
                      </p>
                    </div>
                  ) : filteredRoutes.length > 0 ? (
                    <div className="p-2">
                      {filteredRoutes.map((route, index) => (
                        <motion.button
                          key={route.path}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => {
                            navigate(route.path);
                            setShowSearch(false);
                            setSearchQuery("");
                          }}
                          className="w-full flex items-center gap-4 p-4 rounded-xl text-left hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/10 dark:hover:to-purple-900/10 transition-all group border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/20"
                        >
                          {route.icon && (
                            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md group-hover:shadow-lg transition-all">
                              <route.icon className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {route.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5 font-mono">
                              {route.path}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-500">
                      <div className="w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-900/10 rounded-2xl flex items-center justify-center">
                        <X className="w-8 h-8 text-red-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        No results found
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try searching with different keywords
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Contact Admin Chat Modal (Staff Only) */}
      {isStaff && (
        <AdminChatModal
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            fetchMessageUnreadCount(); // Refresh unread count after closing chat
          }}
          staff={{ _id: user._id, name: "Admin", number: "" }}
          currentUser={user}
        />
      )}
    </>
  );
};

/* ---------- HELPER COMPONENTS ---------- */

const QuickStat = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    emerald: "text-emerald-500 bg-emerald-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    blue: "text-blue-500 bg-blue-500/10",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
    >
      <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="text-[10px] text-slate-500 font-medium">{label}</p>
        <p className="text-xs font-bold text-slate-800 dark:text-white">
          {value}
        </p>
      </div>
    </motion.div>
  );
};

const UserMenuItem = ({ icon: Icon, label, onClick }) => (
  <motion.button
    whileHover={{ x: 4 }}
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all text-sm font-medium"
  >
    <Icon className="w-4 h-4" />
    {label}
  </motion.button>
);

export default Header;
