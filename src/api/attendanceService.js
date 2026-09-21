import api from "./axiosInstance";

export const attendanceService = {
  // Get List of All Workers & Staff
  // Backend returns: { statusCode: 200, data: [...] }
  getOrgList: async () => {
    try {
      const response = await api.get("/attendance/org/list");
      return response.data;
    } catch (error) {
      console.error("[Attendance] OrgList error:", error);
      return { data: [] };
    }
  },

  // List Attendance Records
  // Backend returns: { statusCode: 200, data: [...] }
  list: async (params) => {
    try {
      const response = await api.get("/attendance", { params });
      return response.data;
    } catch (error) {
      console.error("[Attendance] List error:", error);
      throw error;
    }
  },

  // Update Attendance
  update: async (payload) => {
    try {
      const response = await api.put("/attendance", payload);
      return response.data;
    } catch (error) {
      console.error("[Attendance] Update error:", error);
      throw error;
    }
  },

  // Export Data
  exportData: async (params) => {
    try {
      const response = await api.get("/attendance/export/list", {
        params,
        responseType: "blob",
      });

      const contentType = response.headers?.["content-type"] || "";
      if (contentType.includes("application/json")) {
        const raw = await response.data.text();
        let message = "Failed to export attendance";

        try {
          const parsed = JSON.parse(raw);
          message = parsed?.message || parsed?.error || message;
        } catch (_) {
          if (raw) message = raw;
        }

        throw new Error(message);
      }

      return response.data;
    } catch (error) {
      console.error("[Attendance] Export error:", error);
      throw error;
    }
  },
};
