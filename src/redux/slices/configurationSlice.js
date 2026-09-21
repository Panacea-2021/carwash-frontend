import { createSlice } from "@reduxjs/toolkit";

const configurationSlice = createSlice({
  name: "configuration",
  initialState: {
    settings: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { clearError } = configurationSlice.actions;
export default configurationSlice.reducer;
