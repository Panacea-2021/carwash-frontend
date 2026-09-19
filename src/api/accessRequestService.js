import api from "./axiosInstance";

export const accessRequestService = {
  list: async (params = {}) => {
    try {
      const response = await api.get("/access-requests", { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  approve: async (id, note = "") => {
    try {
      const response = await api.put(`/access-requests/${id}/approve`, { note });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  reject: async (id, note = "") => {
    try {
      const response = await api.put(`/access-requests/${id}/reject`, { note });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/access-requests/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },
};
