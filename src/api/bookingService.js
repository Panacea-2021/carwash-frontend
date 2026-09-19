import api from "./axiosInstance";

export const bookingService = {
  list: async (page = 1, limit = 10, search = "") => {
    try {
      const params = { pageNo: page - 1, pageSize: limit, search };
      const response = await api.get("/bookings", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  assignWorker: async (id, payload) => {
    try {
      const response = await api.put(`/bookings/${id}/assign-worker`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  accept: async (id) => {
    try {
      const response = await api.put(`/bookings/${id}/accept`, {});
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
