import api from "./axiosInstance";

export const pricingService = {
  // List with pagination
  list: async (page = 1, limit = 10, search = "") => {
    // Backend expects pageNo (0-based) and pageSize
    const params = { pageNo: page - 1, pageSize: limit, search };
    const response = await api.get("/pricing", { params });
    return response.data;
  },

  // Create
  create: async (data) => {
    const response = await api.post("/pricing", data);
    return response.data;
  },

  // Update
  update: async (id, data) => {
    const response = await api.put(`/pricing/${id}`, data);
    return response.data;
  },

  // Delete
  delete: async (id) => {
    const response = await api.delete(`/pricing/${id}`);
    return response.data;
  },

  // Get Single Info
  getById: async (id) => {
    const response = await api.get(`/pricing/${id}`);
    return response.data;
  },

  // Get Pricing by Mall ID
  getByMall: async (mallId) => {
    const response = await api.get(`/pricing/mall/${mallId}`);
    return response.data;
  },
};
