import api from "./axiosInstance";

export const accessRequestService = {
<<<<<<< HEAD
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
=======
>>>>>>> origin/main
  list: async (params = {}) => {
    try {
      const response = await api.get("/access-requests", { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

<<<<<<< HEAD
  // Get pending request count
  pendingCount: async () => {
    try {
      const response = await api.get("/access-requests/pending-count");
=======
  approve: async (id, note = "") => {
    try {
      const response = await api.put(`/access-requests/${id}/approve`, { note });
>>>>>>> origin/main
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

<<<<<<< HEAD
  // Admin approves
  approve: async (id, adminResponse = "") => {
    try {
      const response = await api.put(`/access-requests/${id}/approve`, {
        adminResponse,
      });
=======
  reject: async (id, note = "") => {
    try {
      const response = await api.put(`/access-requests/${id}/reject`, { note });
>>>>>>> origin/main
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

<<<<<<< HEAD
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
=======
>>>>>>> origin/main
  delete: async (id) => {
    try {
      const response = await api.delete(`/access-requests/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },
};
