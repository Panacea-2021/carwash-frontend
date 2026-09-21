import api from "./axiosInstance";

export const analyticsService = {
  // ✅ NEW: Get ALL Dashboard Data in ONE call (Super Fast!)
  getDashboardAll: async (filters = {}) => {
    const response = await api.get("/analytics/dashboard-all", {
      params: filters,
    });
    return response.data;
  },

  // Get Summary Counts (Cards)
  getAdminStats: async (filters = {}) => {
    // Hits controller.admin -> service.admin
    const response = await api.post(
      "/analytics/admin",
      {},
      { params: filters },
    );
    return response.data;
  },

  // Get Chart Data (Graphs)
  getCharts: async (filters = {}) => {
    // Hits controller.charts -> service.charts
    const response = await api.post(
      "/analytics/admin/charts",
      {},
      { params: filters },
    );
    return response.data;
  },

  // Get Revenue Trends
  getRevenueTrends: async (filters = {}) => {
    const response = await api.get("/analytics/revenue-trends", {
      params: filters,
    });
    return response.data;
  },

  // Get Top Performing Workers
  getTopWorkers: async (filters = {}) => {
    const response = await api.get("/analytics/top-workers", {
      params: filters,
    });
    return response.data;
  },

  // Get Recent Activities
  getRecentActivities: async (filters = {}) => {
    const response = await api.get("/analytics/recent-activities", {
      params: filters,
    });
    return response.data;
  },

  // Get Service Distribution
  getServiceDistribution: async (filters = {}) => {
    const response = await api.get("/analytics/service-distribution", {
      params: filters,
    });
    return response.data;
  },

  // Get Building Analytics
  getBuildingAnalytics: async (filters = {}) => {
    const response = await api.get("/analytics/building-analytics", {
      params: filters,
    });
    return response.data;
  },

  // Get Comparative Analytics (Today vs Yesterday, etc.)
  getComparativeAnalytics: async () => {
    const response = await api.get("/analytics/comparative");
    return response.data;
  },

  // ✅ Supervisor Analytics
  getSupervisorStats: async (dateFilters = {}) => {
    const response = await api.post("/analytics/supervisors", dateFilters);
    return response.data;
  },
};
