import api from "./axiosInstance";

const staffNotificationService = {
  checkHealth: async () => {
    const response = await api.get("/staff-notifications/health");
    return response.data;
  },

  sendCampaign: async (payload) => {
    const response = await api.post("/staff-notifications/send", payload);
    return response.data;
  },

  getCampaignHistory: async (params = {}) => {
    const response = await api.get("/staff-notifications/history", { params });
    return response.data;
  },

  getCampaignStats: async (params = {}) => {
    const response = await api.get("/staff-notifications/stats", { params });
    return response.data;
  },

  uploadCampaignImage: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      "/staff-notifications/upload-image",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return response.data;
  },
};

export default staffNotificationService;
