import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { analyticsService } from "../../api/analyticsService";

// Async Thunks
export const fetchAdminStats = createAsyncThunk(
  "analytics/fetchAdminStats",
  async (_, { rejectWithValue }) => {
    console.log("📊 [ANALYTICS SLICE] Fetch Admin Stats API Call");
    try {
      const response = await analyticsService.getAdminStats();
      console.log("✅ [ANALYTICS SLICE] Fetch Admin Stats Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [ANALYTICS SLICE] Fetch Admin Stats Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const fetchCharts = createAsyncThunk(
  "analytics/fetchCharts",
  async (_, { rejectWithValue }) => {
    console.log("📈 [ANALYTICS SLICE] Fetch Charts API Call");
    try {
      const response = await analyticsService.getCharts();
      console.log("✅ [ANALYTICS SLICE] Fetch Charts Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [ANALYTICS SLICE] Fetch Charts Error:", error);
      return rejectWithValue(error);
    }
  }
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState: {
    stats: null,
    charts: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Admin Stats
    builder
      .addCase(fetchAdminStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.data;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Charts
    builder
      .addCase(fetchCharts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCharts.fulfilled, (state, action) => {
        state.loading = false;
        state.charts = action.payload.data;
      })
      .addCase(fetchCharts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = analyticsSlice.actions;
export default analyticsSlice.reducer;
