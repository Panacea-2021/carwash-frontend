import api from "./axiosInstance";

export const staffProfileService = {
  getProfile: async () => {
    const response = await api.get("/staff/profile");
    return response.data;
  },

  updateAttendanceSheetPreferences: async (preferences) => {
    const response = await api.patch(
      "/staff/profile/attendance-sheet-preferences",
      preferences,
    );
    return response.data;
  },
};

export default staffProfileService;
