import api from "./axiosInstance";

export const vehicleCatalogService = {
  // ============== BRANDS ==============
  listBrands: async (search = "", status = "") => {
    const params = {};
    if (search) params.search = search;
    if (status) params.status = status;
    const response = await api.get("/vehicle-catalog/brands", { params });
    return response.data;
  },

  createBrand: async (formData) => {
    const response = await api.post("/vehicle-catalog/brands", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  updateBrand: async (id, formData) => {
    const response = await api.put(`/vehicle-catalog/brands/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteBrand: async (id) => {
    const response = await api.delete(`/vehicle-catalog/brands/${id}`);
    return response.data;
  },

  // ============== MODELS ==============
  listModels: async (
    brandId = "",
    search = "",
    vehicleType = "",
    category = "",
  ) => {
    const params = {};
    if (brandId) params.brandId = brandId;
    if (search) params.search = search;
    if (vehicleType) params.vehicleType = vehicleType;
    if (category) params.category = category;
    const response = await api.get("/vehicle-catalog/models", { params });
    return response.data;
  },

  createModel: async (formData) => {
    const response = await api.post("/vehicle-catalog/models", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  updateModel: async (id, formData) => {
    const response = await api.put(`/vehicle-catalog/models/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteModel: async (id) => {
    const response = await api.delete(`/vehicle-catalog/models/${id}`);
    return response.data;
  },

  // ============== STATS ==============
  getStats: async () => {
    const response = await api.get("/vehicle-catalog/stats");
    return response.data;
  },
};
