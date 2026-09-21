import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { oneWashService } from "../../api/oneWashService";

// Async thunk for fetching oneWash jobs
export const fetchOneWash = createAsyncThunk(
  "oneWash/fetchOneWash",
  async (
    { page = 1, limit = 50, search = "", filters = {} },
    { rejectWithValue },
  ) => {
    try {
      const response = await oneWashService.list(page, limit, search, filters);
      return { ...response, currentPage: page };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Async thunk for deleting oneWash job
export const deleteOneWash = createAsyncThunk(
  "oneWash/deleteOneWash",
  async (id, { rejectWithValue }) => {
    try {
      await oneWashService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Async thunk for creating oneWash job
export const createOneWash = createAsyncThunk(
  "oneWash/createOneWash",
  async (jobData, { rejectWithValue }) => {
    try {
      const response = await oneWashService.create(jobData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

const oneWashSlice = createSlice({
  name: "oneWash",
  initialState: {
    oneWashJobs: [],
    stats: {
      totalAmount: 0,
      totalJobs: 0,
      cash: 0,
      card: 0,
      bank: 0,
      tips: 0,
      outsideCount: 0,
      insideOutsideCount: 0,
      residenceCount: 0,
      outsideAmount: 0,
      insideOutsideAmount: 0,
      residenceAmount: 0,
    },
    total: 0,
    currentPage: 1,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOneWash.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOneWash.fulfilled, (state, action) => {
        state.loading = false;
        state.oneWashJobs = action.payload.data || [];
        state.stats = action.payload.counts || state.stats;
        state.total = action.payload.total || 0;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchOneWash.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch oneWash jobs";
      })
      // Delete OneWash - remove from list immediately
      .addCase(deleteOneWash.fulfilled, (state, action) => {
        state.oneWashJobs = state.oneWashJobs.filter(
          (job) => job._id !== action.payload,
        );
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteOneWash.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete oneWash job";
      });
  },
});

export const { clearError } = oneWashSlice.actions;
export default oneWashSlice.reducer;
