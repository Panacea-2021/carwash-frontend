import api from "./axiosInstance";

export const enquiryService = {
  // Update list to accept a filters object
  list: async (page = 1, limit = 10, filters = {}) => {
    const params = {
      pageNo: page - 1,
      pageSize: limit,
      // Spread accepted backend filters if they exist
      ...(filters.status && { status: filters.status }),
      ...(filters.worker && { worker: filters.worker }),
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
    };

    // Note: We are NOT sending the general 'search' term here,
    // because the backend controller doesn't handle it.

    const response = await api.get("/enquiry", { params });
    return response.data;
  },

  // ... keep other methods (create, update, delete, getById) unchanged
  create: async (data) => {
    const response = await api.post("/enquiry", data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/enquiry/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/enquiry/${id}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/enquiry/${id}`);
    return response.data;
  },
};
