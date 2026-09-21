import api from "./axiosInstance";

export const importLogsService = {
  // List Import Logs
  list: async (page = 1, limit = 10) => {
    try {
      // Backend uses CommonHelper which expects pageNo (0-indexed) and pageSize
      const params = {
        pageNo: page - 1,
        pageSize: limit,
      };

      // Route based on your backend structure (likely /import-logs based on previous patterns)
      const response = await api.get("/import-logs", { params });
      return response.data; // Expected { statusCode: 200, message: 'success', total: X, data: [...] }
    } catch (error) {
      console.error("[ImportLogs] List error:", error);
      throw error;
    }
  },

  // Get Single Log Details
  info: async (id) => {
    try {
      const response = await api.get(`/import-logs/${id}`);
      return response.data;
    } catch (error) {
      console.error("[ImportLogs] Info error:", error);
      throw error;
    }
  },
};
