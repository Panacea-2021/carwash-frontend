import api from "./axiosInstance";

export const paymentService = {
  // --- EXISTING METHODS ---

  // List Payments
  list: async (page = 1, limit = 10, search = "", filters = {}) => {
    const params = {
      pageNo: page - 1,
      pageSize: limit,
      search: search || "",
      ...filters,
    };
    const response = await api.get("/payments", { params });
    return response.data;
  },

  // Export Data
  exportData: async (filters = {}) => {
    const response = await api.get("/payments/export/list", {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  },

  // Update Payment (Generic)
  updatePayment: async (id, data) => {
    console.log("🔵 [API] Calling PUT /payments/:id", {
      id,
      data,
      url: `/payments/${id}`,
    });
    const response = await api.put(`/payments/${id}`, data);
    console.log("✅ [API] PUT /payments/:id Response:", response.data);
    return response.data;
  },

  // Collect Payment
  collect: async (id, amount, mode, date, receipt_no) => {
    const payload = {
      amount: Number(amount),
      payment_mode: mode,
      payment_date: date,
    };
    if (receipt_no) {
      payload.receipt_no = receipt_no;
    }
    const response = await api.put(`/payments/${id}/collect`, payload);
    return response.data;
  },

  // Edit Payment Amount (with reason)
  editAmount: async (id, new_total_amount, reason) => {
    const response = await api.put(`/payments/${id}/edit-amount`, {
      new_total_amount: Number(new_total_amount),
      reason,
    });
    return response.data;
  },

  // Get edit history
  getEditHistory: async (page = 1, limit = 20, type = "") => {
    const params = { pageNo: page - 1, pageSize: limit };
    if (type) params.type = type;
    const response = await api.get("/payments/edit-history", { params });
    return response.data;
  },

  // Settle Payment
  settlePayment: async (payload) => {
    const response = await api.put("/payments/collect/settle", payload);
    return response.data;
  },

  // Delete Payment
  deletePayment: async (id) => {
    console.log("🔵 [API] Calling DELETE /payments/:id", {
      id,
      url: `/payments/${id}`,
    });
    const response = await api.delete(`/payments/${id}`);
    console.log("✅ [API] DELETE /payments/:id Response:", response.data);
    return response.data;
  },
  // 1. Download Excel (Needs Blob)
  downloadCollectionSheet: async ({
    serviceType,
    year,
    month,
    building,
    worker,
  }) => {
    const adjustedMonth = parseInt(month, 10) - 1;
    const response = await api.get("/payments/export/statement/monthly", {
      params: {
        service_type: serviceType,
        year: year,
        month: adjustedMonth,
        building: building || "all",
        worker: worker || "all",
      },
      responseType: "blob", // ✅ Correct for Excel
    });
    return response.data;
  },

  // 2. Fetch Data for Rich PDF (Needs JSON)
  // ✅ UPDATED: Removed 'responseType: blob' so it parses as JSON
  getCollectionData: async ({ serviceType, year, month, building, worker }) => {
    const adjustedMonth = parseInt(month, 10) - 1;
    const response = await api.get("/payments/export/statement/monthly", {
      params: {
        service_type: serviceType,
        year: year,
        month: adjustedMonth,
        building: building || "all",
        worker: worker || "all",
        format: "json", // ✅ Tells backend to return JSON
      },
      // ❌ DO NOT add responseType: 'blob' here
    });
    return response.data;
  },
  // --- NEW: SETTLEMENTS API ---

  // 1. Get List of Settlements
  // Hits: GET /payments/settlements/list
  // 1. Get List of Settlements
  // --- NEW: SETTLEMENTS API ---

  // 1. Get List of Settlements
  getSettlements: async (page = 1, limit = 10) => {
    // Backend uses 0-based pagination: page 1 should send pageNo: 0
    const params = {
      pageNo: page - 1,
      pageSize: limit,
    };
    const response = await api.get("/payments/settlements/list", { params });
    return response.data;
  },

  bulkStatus: async (ids, status) => {
    const response = await api.put("/payments/bulk/status", { ids, status });
    return response.data;
  },

  // 2. Approve/Update Settlement
  updateSettlement: async (id) => {
    const response = await api.put(`/payments/settlements/${id}`, {});
    return response.data;
  },

  // Get months with pending bills
  getMonthsWithPending: async () => {
    const response = await api.get("/payments/months-with-pending");
    return response.data;
  },

  // Close month
  closeMonth: async (month, year) => {
    const response = await api.post("/payments/close-month", { month, year });
    return response.data;
  },

  // Export PDF (all records)
  exportPDF: async (filters = {}) => {
    const response = await api.get("/payments/export/pdf", {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  },

  // Run invoice generation manually
  runInvoice: async (month, year, mode) => {
    const response = await api.post("/payments/run-invoice", {
      month,
      year,
      mode,
    });
    return response.data;
  },

  // Check if invoices already exist for a month
  checkInvoice: async (month, year) => {
    const response = await api.get("/payments/check-invoice", {
      params: { month, year },
    });
    return response.data;
  },

  // Get payment history (amount edits + transactions)
  getPaymentHistory: async (id) => {
    const response = await api.get(`/payments/${id}/history`);
    return response.data;
  },
};
