import api from "./axiosInstance";

export const salaryService = {
  // Get slip data (preview or existing)
  getSlip: async (workerId, year, month) => {
    const response = await api.get(
      `/salary/slip?workerId=${workerId}&year=${year}&month=${month}`,
    );
    return response.data;
  },

  // Save/Update slip
  saveSlip: async (payload) => {
    const response = await api.post("/salary/slip", payload);
    return response.data;
  },
};
