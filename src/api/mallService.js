import api from "./axiosInstance";

export const mallService = {
  // List
  list: async (page = 1, limit = 10, search = "") => {
    console.log(
      `[MallService] Fetching list: page=${page}, limit=${limit}, search="${search}"`
    );
    try {
      const response = await api.get("/malls", {
        params: { page, limit, search },
      });
      console.log("[MallService] List success:", response.data);
      return response.data;
    } catch (error) {
      console.error("[MallService] List error:", error);
      throw error;
    }
  },

  // Create
  create: async (data) => {
    console.log("[MallService] Creating mall:", data);
    try {
      const response = await api.post("/malls", data);
      console.log("[MallService] Create success:", response.data);
      return response.data;
    } catch (error) {
      console.error("[MallService] Create error:", error);
      throw error;
    }
  },

  // Update
  update: async (id, data) => {
    console.log(`[MallService] Updating mall ${id}:`, data);
    try {
      const response = await api.put(`/malls/${id}`, data);
      console.log("[MallService] Update success:", response.data);
      return response.data;
    } catch (error) {
      console.error("[MallService] Update error:", error);
      throw error;
    }
  },

  // Delete
  delete: async (id) => {
    console.log(`[MallService] Deleting mall ${id}`);
    try {
      const response = await api.delete(`/malls/${id}`);
      console.log("[MallService] Delete success:", response.data);
      return response.data;
    } catch (error) {
      console.error("[MallService] Delete error:", error);
      throw error;
    }
  },
};
