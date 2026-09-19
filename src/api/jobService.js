import api from "./axiosInstance";

export const jobService = {
  /**
   * List Jobs (Residence)
   * Matches API: GET /api/jobs?pageNo=0&pageSize=10&search=...&startDate=...&endDate=...
   */
  list: async (page = 1, limit = 10, search = "", filters = {}) => {
    // 1. Construct the params object exactly as the backend expects
    const params = {
      pageNo: page - 1, // Frontend uses 1-based, Backend uses 0-based
      pageSize: limit, // Matches 'pageSize' in your URL
      search: search || "", // Search string

      // Spread the date filters (startDate, endDate) directly
      // Ensure these are ISO strings (e.g., 2025-12-29T18:30:00Z)
      ...filters,
    };

    // 2. Make the request
    const response = await api.get("/jobs", { params });

    // 3. Return the data (Backend returns { total, data, statusCode, message })
    return response.data;
  },

  /**
   * Create a new Job
   * Matches API: POST /api/jobs
   */
  create: async (data) => {
    const response = await api.post("/jobs", data);
    return response.data;
  },

  /**
   * Update a Job
   * Matches API: PUT /api/jobs/:id
   */
  update: async (id, data) => {
    const response = await api.put(`/jobs/${id}`, data);
    return response.data;
  },

  /**
   * Delete a Job
   * Matches API: DELETE /api/jobs/:id
   */
  delete: async (id) => {
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  },

  /**
   * Export Jobs List to Excel
   * Matches API: GET /api/jobs/export/list
   */
  exportData: async (filters = {}) => {
    const response = await api.get("/jobs/export/list", {
      params: filters,
      responseType: "blob", // Important for file downloads
    });
    return response.data;
  },

  /**
   * Export Monthly Statement
   * Matches API: GET /api/jobs/export/statement/monthly
   */
  monthlyStatement: async (year, month) => {
    const response = await api.get("/jobs/export/statement/monthly", {
      params: { year, month },
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Settle Payment
   * Matches API: PUT /payments/collect/settle
   */
  settlePayment: async (jobId) => {
    console.log(`💰 [JobService] Settling payment for job ${jobId}`);
    const response = await api.put("/payments/collect/settle", { jobId });
    console.log("✅ [JobService] Settle success:", response.data);
    return response.data;
  },

  /**
   * Run Scheduler Manually
   * Matches API: POST /api/jobs/run-scheduler
   */
  runScheduler: async (targetDate = null) => {
    const response = await api.post("/jobs/run-scheduler", { targetDate });
    return response.data;
  },
};
