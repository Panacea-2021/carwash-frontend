import api from "./axiosInstance";

export const customerService = {
  // List
  list: async (page = 1, limit = 10, search = "", status = 1) => {
    const params = {
      pageNo: page - 1,
      pageSize: limit,
      search,
      status, // 1 = Active, 2 = Inactive
    };
    const response = await api.get("/customers", { params });
    return response.data;
  },

  // Create
  create: async (data) => {
    const response = await api.post("/customers", data);
    return response.data;
  },

  // Update
  update: async (id, data) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  deactivateCustomer: async (id, deactivationData) => {
    const response = await api.put(
      `/customers/${id}/deactivate`,
      deactivationData,
    );
    return response.data;
  },

  activateCustomer: async (id, activationData) => {
    const response = await api.put(`/customers/${id}/activate`, activationData);
    return response.data;
  },

  // Delete Customer
  delete: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  // Toggle Vehicle Status
  toggleVehicle: async (
    vehicleId,
    currentStatus,
    reason = "",
    reactivateDate = null,
  ) => {
    if (currentStatus === 1) {
      const payload = {
        deactivateReason: reason || "Stopped",
        deactivateDate: new Date().toISOString(),
      };
      const response = await api.put(
        `/customers/vehicle/${vehicleId}/deactivate`,
        payload,
      );
      return response.data;
    } else {
      const payload = {
        start_date: reactivateDate
          ? new Date(reactivateDate).toISOString()
          : new Date().toISOString(),
        restart_date: reactivateDate
          ? new Date(reactivateDate).toISOString()
          : new Date().toISOString(),
      };
      const response = await api.put(
        `/customers/vehicle/${vehicleId}/activate`,
        payload,
      );
      return response.data;
    }
  },

  // Deactivate Vehicle with dates and reason
  deactivateVehicle: async (vehicleId, deactivationData) => {
    const response = await api.put(
      `/customers/vehicle/${vehicleId}/deactivate`,
      deactivationData,
    );
    return response.data;
  },

  // Check vehicle pending dues
  checkVehiclePendingDues: async (vehicleId) => {
    const response = await api.get(
      `/customers/vehicle/${vehicleId}/pending-dues`,
    );
    return response.data;
  },

  // Archive Customer
  archive: async (id) => {
    const response = await api.put(`/customers/${id}/archive`, {});
    return response.data;
  },

  getHistory: async (
    id,
    page = 1,
    limit = 10,
    startDate = "",
    endDate = "",
  ) => {
    const params = {
      pageNo: page - 1,
      pageSize: limit,
      startDate,
      endDate,
    };
    const response = await api.get(`/customers/${id}/history`, { params });
    return response.data;
  },

  // Export History CSV (Still Server-Side blob download for history if needed)
  exportHistory: async (id, startDate = "", endDate = "") => {
    const params = { startDate, endDate };
    const response = await api.get(`/customers/${id}/history/export/list`, {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  // ✅ UPDATED: Export List Data (Returns JSON)
  exportData: async (status = 1) => {
    const response = await api.get("/customers/export/list", {
      params: { status },
    });
    return response.data; // Returns { data: [...] }
  },

  // Download Import Template
  downloadTemplate: async () => {
    const response = await api.get("/customers/import/template", {
      responseType: "blob",
    });
    return response.data;
  },

  // Import Data
  importData: async (formData) => {
    const response = await api.post("/customers/import/list", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  getSOA: async (id, options = {}) => {
    const params = {};

    if (options.vehicleId) {
      params.vehicleId = options.vehicleId;
    }

    if (options.fromMonth) {
      params.fromMonth = options.fromMonth;
    }

    if (options.toMonth) {
      params.toMonth = options.toMonth;
    }

    const response = await api.get(`/customers/${id}/soa`, { params });
    return response.data;
  },
};
