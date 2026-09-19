import api from "./axiosInstance";

export const locationService = {
  // Get list with pagination & search
  list: async (page = 1, limit = 10, search = "") => {
    // Endpoint becomes: http://localhost:3000/api/locations
    const response = await api.get("/locations", {
      params: { page, limit, search },
    });
    return response.data;
  },

  // Create new location
  create: async (data) => {
    const response = await api.post("/locations", data);
    return response.data;
  },

  // Update existing location
  update: async (id, data) => {
    const response = await api.put(`/locations/${id}`, data);
    return response.data;
  },

  // Delete location
  delete: async (id) => {
    const response = await api.delete(`/locations/${id}`);
    return response.data;
  },

  // Get single location details
  getById: async (id) => {
    const response = await api.get(`/locations/${id}`);
    return response.data;
  },
};
