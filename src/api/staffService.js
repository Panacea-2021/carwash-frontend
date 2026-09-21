import api from "./axiosInstance";

export const staffService = {
  list: async (page = 1, limit = 100, search = "") => {
    try {
      const response = await api.get("/admin/staff", {
        params: { page, limit, search },
      });
      return response.data;
    } catch (error) {
      console.error("[StaffService] List Error:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await api.post("/admin/staff", data);
      return response.data;
    } catch (error) {
      console.error("[StaffService] Create Error:", error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/admin/staff/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("[StaffService] Update Error:", error);
      throw error;
    }
  },

  delete: async (id, reason = "") => {
    try {
      const response = await api.delete(`/admin/staff/${id}`, {
        data: { reason },
      });
      return response.data;
    } catch (error) {
      console.error("[StaffService] Delete Error:", error);
      throw error;
    }
  },

  uploadDocument: async (id, file, documentType) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      const response = await api.post(
        `/admin/staff/${id}/upload-document`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data;
    } catch (error) {
      console.error("[StaffService] Upload Document Error:", error);
      throw error;
    }
  },

  deleteDocument: async (id, documentType) => {
    try {
      const response = await api.delete(`/admin/staff/${id}/document`, {
        data: { documentType },
      });
      return response.data;
    } catch (error) {
      console.error("[StaffService] Delete Document Error:", error);
      throw error;
    }
  },

  exportData: async () => {
    try {
      const response = await api.get("/admin/staff/export", {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("[StaffService] Export Data Error:", error);
      throw error;
    }
  },

  importData: async (formData) => {
    try {
      const response = await api.post("/admin/staff/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      console.error("[StaffService] Import Data Error:", error);
      throw error;
    }
  },

  getExpiringDocuments: async () => {
    try {
      const response = await api.get("/admin/staff/expiring");
      return response.data;
    } catch (error) {
      console.error("[StaffService] Get Expiring Error:", error);
      throw error;
    }
  },

  uploadProfileImage: async (id, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post(
        `/admin/staff/${id}/profile-image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data;
    } catch (error) {
      console.error("[StaffService] Profile Image Error:", error);
      throw error;
    }
  },
};
