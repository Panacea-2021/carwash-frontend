import api from "./axiosInstance";

export const staffAppUpdateService = {
  list: async () => {
    const response = await api.get("/staff-app-updates");
    return response.data;
  },
  latest: async () => {
    const response = await api.get("/staff-app-updates/latest");
    return response.data;
  },
  upload: async (formData) => {
    const response = await api.post("/staff-app-updates", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
