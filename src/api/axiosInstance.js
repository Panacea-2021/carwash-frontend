import axios from "axios";
import toast from "react-hot-toast";

// HARDCODED BASE URL
// This forces the request to be relative (e.g., https://your-site.scom/api/...)
// It relies entirely on your proxy configuration (vercel.json or vite.config.js)
<<<<<<< HEAD
const baseURL = import.meta.env.VITE_API_URL;
=======
const baseURL = import.meta.env.VITE_API_BASE_URL;
>>>>>>> 04c7292 (Update car wash frontend)

const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // Enhanced logging with timestamp and page context
    const timestamp = new Date().toLocaleTimeString();
    const currentPage = window.location.pathname;

    console.group(`🚀 [API Request] ${timestamp}`);
    console.log(`📄 Page: ${currentPage}`);
    console.log(`🔗 Method: ${config.method?.toUpperCase()}`);
    console.log(`🌐 URL: ${config.baseURL}${config.url}`);
    if (config.params) {
      console.log(`📝 Params:`, config.params);
    }
    if (config.data && config.headers["Content-Type"] === "application/json") {
      console.log(`📦 Data:`, config.data);
    }
    console.groupEnd();

    if (token) {
      // IMPORTANT — Preserving your logic: RAW token (No Bearer prefix)
      config.headers.Authorization = token;
    }

    return config;
  },
  (error) => {
    console.error("[❌ Request Error]", error);
    return Promise.reject(error);
  },
);

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => {
    // Enhanced success logging
    const timestamp = new Date().toLocaleTimeString();
    const duration = response.config.metadata?.startTime
      ? Date.now() - response.config.metadata.startTime
      : "N/A";

    console.group(`✅ [API Response] ${timestamp}`);
    console.log(`🔗 Method: ${response.config.method?.toUpperCase()}`);
    console.log(`🌐 URL: ${response.config.url}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️ Duration: ${duration}ms`);
    if (response.data) {
      console.log(`📦 Response Data:`, response.data);
    }
    console.groupEnd();

    return response;
  },

  (error) => {
    const timestamp = new Date().toLocaleTimeString();

    console.group(`❌ [API Error] ${timestamp}`);
    console.error(`🔗 URL: ${error.config?.url}`);
    console.error(`📊 Status: ${error.response?.status}`);
    console.error(`💬 Message: ${error.message}`);
    if (error.response?.data) {
      console.error(`📦 Error Data:`, error.response.data);
    }
    console.groupEnd();

    // Logout ONLY when API returns 401
    if (error.response?.status === 401) {
      console.warn("⚠️ 401 Unauthorized — Logging Out");

      if (window.location.pathname !== "/login") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
