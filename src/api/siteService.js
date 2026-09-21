import api from "./axiosInstance";

export const siteService = {
  // List
  list: async (page = 1, limit = 10, search = "") => {
    console.log(
      `[SiteService] Fetching list: page=${page}, limit=${limit}, search="${search}"`
    );
    try {
      const response = await api.get("/sites", {
        params: { page, limit, search },
      });
      console.log("[SiteService] List success:", response.data);
      return response.data;
    } catch (error) {
      console.error("[SiteService] List error:", error);
      throw error;
    }
  },

  // Create
  create: async (data) => {
    console.log("[SiteService] Creating site:", data);
    try {
      const response = await api.post("/sites", data);
      console.log("[SiteService] Create success:", response.data);
      return response.data;
    } catch (error) {
      console.error("[SiteService] Create error:", error);
      throw error;
    }
  },

  // Update
  update: async (id, data) => {
    console.log(`[SiteService] Updating site ${id}:`, data);
    try {
      const response = await api.put(`/sites/${id}`, data);
      console.log("[SiteService] Update success:", response.data);
      return response.data;
    } catch (error) {
      console.error("[SiteService] Update error:", error);
      throw error;
    }
  },

  // Delete
  delete: async (id) => {
    console.log(`[SiteService] Deleting site ${id}`);
    try {
      const response = await api.delete(`/sites/${id}`);
      console.log("[SiteService] Delete success:", response.data);
      return response.data;
    } catch (error) {
      console.error("[SiteService] Delete error:", error);
      throw error;
    }
  },
};
