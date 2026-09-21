import { createSlice } from "@reduxjs/toolkit";

const importLogsSlice = createSlice({
  name: "importLogs",
  initialState: {
    logs: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { clearError } = importLogsSlice.actions;
export default importLogsSlice.reducer;
