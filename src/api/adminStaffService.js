import api from "./axiosInstance";

export const adminStaffService = {
  // List all admin staff (managers)
  list: async (params = {}) => {
    try {
      const response = await api.get("/admin-staff", { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Get single admin staff by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/admin-staff/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Create a new admin staff
  create: async (data) => {
    try {
      const response = await api.post("/admin-staff", data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Update admin staff
  update: async (id, data) => {
    try {
      const response = await api.put(`/admin-staff/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Update permissions
  updatePermissions: async (id, permissions) => {
    try {
      const response = await api.put(`/admin-staff/${id}/permissions`, {
        permissions,
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Update page-level granular permissions
  updatePagePermissions: async (id, pagePermissions) => {
    try {
      const response = await api.put(`/admin-staff/${id}/page-permissions`, {
        pagePermissions,
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Delete admin staff
  delete: async (id) => {
    try {
      const response = await api.delete(`/admin-staff/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },
};
