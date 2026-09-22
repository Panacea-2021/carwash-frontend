import api from "./axiosInstance";

export const authService = {
  // Login
  login: async (credentials) => {
    try {
      const response = await api.post("/auth/signin", credentials);
      return response.data;
    } catch (error) {
      if (error.code === "ECONNABORTED") {
        throw new Error(
          "The server took too long to respond. Please try again.",
        );
      }
      if (error.response?.data) {
        throw error.response.data;
      }
      throw new Error(
        error.message || "Network Error: the website could not reach the backend.",
      );
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
