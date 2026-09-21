import api from "./axiosInstance";

export const accessRequestService = {
  // Staff creates a new access request
  create: async (data) => {
    try {
      const response = await api.post("/access-requests", data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Admin lists all requests
  list: async (params = {}) => {
    try {
      const response = await api.get("/access-requests", { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Get pending request count
  pendingCount: async () => {
    try {
      const response = await api.get("/access-requests/pending-count");
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Admin approves
  approve: async (id, adminResponse = "") => {
    try {
      const response = await api.put(`/access-requests/${id}/approve`, {
        adminResponse,
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Admin rejects
  reject: async (id, adminResponse = "") => {
    try {
      const response = await api.put(`/access-requests/${id}/reject`, {
        adminResponse,
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Admin deletes
  delete: async (id) => {
    try {
      const response = await api.delete(`/access-requests/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },
};
