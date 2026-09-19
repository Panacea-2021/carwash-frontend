import api from "./axiosInstance";

export const configurationService = {
  // Fetch Configurations
  fetch: async () => {
    try {
      const response = await api.get("/configurations");
      // Backend returns { statusCode: 200, message: 'success', data: { ... } }
      return response.data;
    } catch (error) {
      console.error("[ConfigService] Fetch error:", error);
      throw error;
    }
  },

  // Update Configurations
  update: async (data) => {
    try {
      const response = await api.put("/configurations", data);
      return response.data;
    } catch (error) {
      console.error("[ConfigService] Update error:", error);
      throw error;
    }
  },
};
