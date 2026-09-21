import api from "./axiosInstance";

export const authService = {
  // Login
  login: async (credentials) => {
    // credentials should be { number: "...", password: "..." }
    try {
      // Removes /api from string because axiosInstance baseURL already has it
      const response = await api.post("/auth/signin", credentials);
      return response.data;
    } catch (error) {
      // Return a clean error object
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Signup
  signup: async (userData) => {
    try {
      const response = await api.post("/auth/signup", userData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: "Network Error" };
    }
  },

  // Helper: Logout
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  },

  // Helper: Check Auth
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
};
