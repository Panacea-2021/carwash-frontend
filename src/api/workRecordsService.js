import api from "./axiosInstance";

export const workRecordsService = {
  // 1. Standard Excel Download (Blob)
  downloadStatement: async (
    serviceType,
    month,
    year,
    workerId = "",
    workers = null,
    options = {},
  ) => {
    const baseUrl =
      serviceType === "onewash" || serviceType === "mall"
        ? "/onewash"
        : "/jobs";
    // Frontend (1-12) to Backend (0-11)
    const adjustedMonth = parseInt(month, 10) - 1;

    const params = {
      service_type: serviceType,
      year: year,
      month: adjustedMonth,
    };

    if (workerId) {
      params.workerId = workerId;
    }

    if (workers && workers.length > 0) {
      params.workers = workers;
    }

    if (options?.buildingWise) {
      params.buildingWise = 1;
    }

    if (options?.buildingId) {
      params.building = options.buildingId;
    }

    if (options?.buildingName) {
      params.buildingName = options.buildingName;
    }

    const response = await api.get(`${baseUrl}/export/statement/monthly`, {
      params,
      responseType: "blob",
    });

    return response.data;
  },

  // 2. JSON Data Fetch for Rich PDF (Corrected Route)
  getStatementData: async (
    year,
    month,
    serviceType,
    workerId = "",
    workers = null,
    options = {},
  ) => {
    const baseUrl =
      serviceType === "onewash" || serviceType === "mall"
        ? "/onewash"
        : "/jobs";
    const adjustedMonth = parseInt(month, 10) - 1;

    const params = {
      year: year,
      month: adjustedMonth,
      service_type: serviceType,
      format: "json", // \u2705 Triggers JSON response from backend
    };

    if (workerId) {
      params.workerId = workerId;
    }

    if (workers && workers.length > 0) {
      params.workers = workers;
    }

    if (options?.buildingId) {
      params.building = options.buildingId;
    }

    // Hits the SAME endpoint but asks for JSON format
    const response = await api.get(`${baseUrl}/export/statement/monthly`, {
      params,
    });
    return response.data;
  },
};
