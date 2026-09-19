import api from "./axiosInstance";

export const oneWashService = {
  // List with extensive filtering
  list: async (page = 1, limit = 10, search = "", filters = {}) => {
    const params = {
      pageNo: page - 1,
      pageSize: limit,
      search,
      ...filters, // Spread filters like startDate, endDate, service_type, worker
    };
    const response = await api.get("/onewash", { params });
    return response.data;
  },

  // Create
  create: async (data) => {
    const response = await api.post("/onewash", data);
    return response.data;
  },

  // Update
  update: async (id, data) => {
    const response = await api.put(`/onewash/${id}`, data);
    return response.data;
  },

  // Delete
  delete: async (id) => {
    const response = await api.delete(`/onewash/${id}`);
    return response.data;
  },

  // Export Data (Excel)
  exportData: async (filters = {}) => {
    const response = await api.get("/onewash/export/list", {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  },

  // Monthly Statement
  monthlyStatement: async (year, month) => {
    const response = await api.get("/onewash/export/statement/monthly", {
      params: { year, month },
      responseType: "blob",
    });
    return response.data;
  },
};
