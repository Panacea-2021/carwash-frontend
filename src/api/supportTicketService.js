import api from "./axiosInstance";

export const supportTicketService = {
  list: async (page = 1, limit = 20, filters = {}) => {
    const params = {
      pageNo: page - 1,
      pageSize: limit,
      ...(filters.status ? { status: filters.status } : null),
      ...(filters.category ? { category: filters.category } : null),
      ...(filters.startDate ? { startDate: filters.startDate } : null),
      ...(filters.endDate ? { endDate: filters.endDate } : null),
      ...(filters.search ? { search: filters.search } : null),
    };

    const response = await api.get("/support-tickets", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/support-tickets/${id}`);
    return response.data;
  },

  update: async (id, payload) => {
    const response = await api.put(`/support-tickets/${id}`, payload);
    return response.data;
  },

  listMessages: async (id) => {
    const response = await api.get(`/support-tickets/${id}/messages`);
    return response.data;
  },

  sendMessage: async (id, formData) => {
    const response = await api.post(`/support-tickets/${id}/messages`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
