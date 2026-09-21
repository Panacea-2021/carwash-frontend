import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { workerService } from "../../api/workerService";

export const fetchWorkers = createAsyncThunk(
  "worker/fetchWorkers",
  async (
    { page = 1, limit = 50, search = "", status = 1 },
    { rejectWithValue },
  ) => {
    console.log("👷 [WORKER SLICE] Fetch Workers API Call:", {
      page,
      limit,
      search,
      status,
    });
    try {
      const response = await workerService.list(page, limit, search, status);
      console.log("✅ [WORKER SLICE] Fetch Workers Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [WORKER SLICE] Fetch Workers Error:", error);
      return rejectWithValue(error);
    }
  },
);

export const createWorker = createAsyncThunk(
  "worker/createWorker",
  async (data, { rejectWithValue }) => {
    console.log("➕ [WORKER SLICE] Create Worker API Call:", data);
    try {
      const response = await workerService.create(data);
      console.log("✅ [WORKER SLICE] Create Worker Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [WORKER SLICE] Create Worker Error:", error);
      return rejectWithValue(error);
    }
  },
);

export const updateWorker = createAsyncThunk(
  "worker/updateWorker",
  async ({ id, data }, { rejectWithValue }) => {
    console.log("✏️ [WORKER SLICE] Update Worker API Call:", { id, data });
    try {
      const response = await workerService.update(id, data);
      console.log("✅ [WORKER SLICE] Update Worker Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [WORKER SLICE] Update Worker Error:", error);
      return rejectWithValue(error);
    }
  },
);

export const deleteWorker = createAsyncThunk(
  "worker/deleteWorker",
  async (id, { rejectWithValue }) => {
    console.log("🗑️ [WORKER SLICE] Delete Worker API Call:", id);
    try {
      const response = await workerService.delete(id);
      console.log("✅ [WORKER SLICE] Delete Worker Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [WORKER SLICE] Delete Worker Error:", error);
      return rejectWithValue(error);
    }
  },
);

export const undoDeleteWorker = createAsyncThunk(
  "worker/undoDeleteWorker",
  async (id, { rejectWithValue }) => {
    console.log("♻️ [WORKER SLICE] Undo Delete Worker API Call:", id);
    try {
      const response = await workerService.undoDelete(id);
      console.log("✅ [WORKER SLICE] Undo Delete Worker Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [WORKER SLICE] Undo Delete Worker Error:", error);
      return rejectWithValue(error);
    }
  },
);

export const deactivateWorker = createAsyncThunk(
  "worker/deactivateWorker",
  async ({ id, payload }, { rejectWithValue }) => {
    console.log("⏸️ [WORKER SLICE] Deactivate Worker API Call:", {
      id,
      payload,
    });
    try {
      const response = await workerService.deactivate(id, payload);
      console.log("✅ [WORKER SLICE] Deactivate Worker Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [WORKER SLICE] Deactivate Worker Error:", error);
      return rejectWithValue(error);
    }
  },
);

export const fetchWorkerInfo = createAsyncThunk(
  "worker/fetchWorkerInfo",
  async (id, { rejectWithValue }) => {
    console.log("📋 [WORKER SLICE] Fetch Worker Info API Call:", id);
    try {
      const response = await workerService.info(id);
      console.log("✅ [WORKER SLICE] Fetch Worker Info Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [WORKER SLICE] Fetch Worker Info Error:", error);
      return rejectWithValue(error);
    }
  },
);

export const fetchWorkerCustomers = createAsyncThunk(
  "worker/fetchWorkerCustomers",
  async (id, { rejectWithValue }) => {
    console.log("👥 [WORKER SLICE] Fetch Worker Customers API Call:", id);
    try {
      const response = await workerService.customers(id);
      console.log(
        "✅ [WORKER SLICE] Fetch Worker Customers Success:",
        response,
      );
      return response;
    } catch (error) {
      console.error("❌ [WORKER SLICE] Fetch Worker Customers Error:", error);
      return rejectWithValue(error);
    }
  },
);

export const fetchWorkerPayments = createAsyncThunk(
  "worker/fetchWorkerPayments",
  async ({ id, params = {} }, { rejectWithValue }) => {
    console.log("💰 [WORKER SLICE] Fetch Worker Payments API Call:", {
      id,
      params,
    });
    try {
      const response = await workerService.payments(id, params);
      console.log("✅ [WORKER SLICE] Fetch Worker Payments Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [WORKER SLICE] Fetch Worker Payments Error:", error);
      return rejectWithValue(error);
    }
  },
);

const workerSlice = createSlice({
  name: "worker",
  initialState: {
    workers: [],
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
      .addCase(fetchWorkers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWorkers.fulfilled, (state, action) => {
        state.loading = false;
        // Backend returns { statusCode, message, total, data }
        state.workers = action.payload.data || [];
      })
      .addCase(fetchWorkers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = workerSlice.actions;
export default workerSlice.reducer;
