import api from "./axiosInstance";

const customerNotificationService = {
  checkHealth: async () => {
    const response = await api.get("/customer-notifications/health");
    return response.data;
  },

  sendCampaign: async (payload) => {
    const response = await api.post("/customer-notifications/send", payload);
    return response.data;
  },

  getCampaignHistory: async (params = {}) => {
    const response = await api.get("/customer-notifications/history", {
      params,
    });
    return response.data;
  },

  getCampaignStats: async (params = {}) => {
    const response = await api.get("/customer-notifications/stats", {
      params,
    });
    return response.data;
  },

  uploadCampaignImage: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      "/customer-notifications/upload-image",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return response.data;
  },
};

export default customerNotificationService;
