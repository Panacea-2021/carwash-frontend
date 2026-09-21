import api from "./axiosInstance";

export const buildingService = {
  // List with pagination and search
  list: async (page = 1, limit = 10, search = "") => {
    const response = await api.get("/buildings", {
      params: { page, limit, search },
    });
    return response.data;
  },

  // Create
  create: async (data) => {
    // data should be { name: "Building Name", location_id: "mongo_id" }
    const response = await api.post("/buildings", data);
    return response.data;
  },

  // Update
  update: async (id, data) => {
    const response = await api.put(`/buildings/${id}`, data);
    return response.data;
  },

  // Delete
  delete: async (id) => {
    const response = await api.delete(`/buildings/${id}`);
    return response.data;
  },

  // Undo Delete (Optional, if you want a restore button later)
  undoDelete: async (id) => {
    const response = await api.delete(`/buildings/${id}/undo`);
    return response.data;
  },
};
