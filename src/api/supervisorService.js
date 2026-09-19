import api from "./axiosInstance";

export const supervisorService = {
  // List
  list: async (page = 1, limit = 10, search = "") => {
    console.log(
      `[SupervisorService] Fetching list: page=${page}, limit=${limit}, search="${search}"`,
    );
    try {
      const response = await api.get("/supervisors", {
        params: { page, limit, search },
      });
      console.log("[SupervisorService] List success:", response.data);
      return response.data;
    } catch (error) {
      console.error("[SupervisorService] List error:", error);
      throw error;
    }
  },

  // Create
  create: async (data) => {
    // data: { name, number, password, role: 'supervisor', buildings: [], mall: "" }
    console.log("[SupervisorService] Creating:", data);
    try {
      const response = await api.post("/supervisors", data);
      console.log("[SupervisorService] Create success:", response.data);
      return response.data;
    } catch (error) {
      console.error("[SupervisorService] Create error:", error);
      throw error;
    }
  },

  // Update
  update: async (id, data) => {
    console.log(`[SupervisorService] Updating ${id}:`, data);
    try {
      const response = await api.put(`/supervisors/${id}`, data);
      console.log("[SupervisorService] Update success:", response.data);
      return response.data;
    } catch (error) {
      console.error("[SupervisorService] Update error:", error);
      throw error;
    }
  },

  // Delete
  delete: async (id) => {
    console.log(`[SupervisorService] Deleting ${id}`);
    try {
      const response = await api.delete(`/supervisors/${id}`);
      console.log("[SupervisorService] Delete success:", response.data);
      return response.data;
    } catch (error) {
      console.error("[SupervisorService] Delete error:", error);
      throw error;
    }
  },

  // Get Team List (Specific to supervisors endpoint)
  getTeam: async (params = {}) => {
    console.log("[SupervisorService] Fetching team list", params);
    try {
      const response = await api.get("/supervisors/team/list", { params });
      console.log("[SupervisorService] Team list success:", response.data);
      return response.data;
    } catch (error) {
      console.error("[SupervisorService] Get Team error:", error);
      throw error;
    }
  },

  // Get Worker History (washes for a team member)
  getWorkerHistory: async (workerId, params = {}) => {
    console.log(`[SupervisorService] Fetching history for ${workerId}`, params);
    try {
      const response = await api.get(`/supervisors/team/${workerId}/history`, {
        params,
      });
      console.log("[SupervisorService] History success:", response.data);
      return response.data;
    } catch (error) {
      console.error("[SupervisorService] History error:", error);
      throw error;
    }
  },
};
