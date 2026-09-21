import api from "./axiosInstance";

export const aiAssistantService = {
  getDomains: async () => {
    const response = await api.get("/ai/domains");
    return response.data?.data || [];
  },

  askPrompt: async (prompt, limit = 20) => {
    const response = await api.post("/ai/search", {
      prompt,
      limit,
    });

    return response.data;
  },

  getPersonPayments: async ({
    person,
    period,
    startDate,
    endDate,
    limit = 500,
  } = {}) => {
    const payload = {
      action: "personPayments",
      person,
      limit,
    };

    if (period) {
      payload.period = period;
    }

    if (startDate) {
      payload.startDate = startDate;
    }

    if (endDate) {
      payload.endDate = endDate;
    }

    const response = await api.post("/ai/search", payload);
    return response.data;
  },

  search: async ({
    domain,
    query = "",
    filters = {},
    page = 1,
    limit = 25,
    sort,
  } = {}) => {
    const payload = {
      domain,
      query,
      filters,
      page,
      limit,
    };

    if (sort && typeof sort === "object" && !Array.isArray(sort)) {
      payload.sort = sort;
    }

    const response = await api.post("/ai/search", payload);
    return response.data;
  },

  getPaymentsPage: async ({
    serviceCategory,
    search = "",
    filters = {},
    page = 1,
    limit = 25,
  } = {}) => {
    const payload = {
      action: "paymentsPage",
      serviceCategory,
      search,
      filters,
      page,
      limit,
    };

    const response = await api.post("/ai/search", payload);
    return response.data;
  },
};
