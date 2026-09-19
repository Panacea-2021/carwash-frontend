import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supervisorService } from "../../api/supervisorService";

// Async thunks
export const fetchSupervisors = createAsyncThunk(
  "supervisor/fetchSupervisors",
  async ({ page = 1, limit = 10, search = "" }, { rejectWithValue }) => {
    try {
      const response = await supervisorService.list(page, limit, search);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch supervisors"
      );
    }
  }
);

export const createSupervisor = createAsyncThunk(
  "supervisor/createSupervisor",
  async (supervisorData, { rejectWithValue }) => {
    try {
      const response = await supervisorService.create(supervisorData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create supervisor"
      );
    }
  }
);

export const updateSupervisor = createAsyncThunk(
  "supervisor/updateSupervisor",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await supervisorService.update(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update supervisor"
      );
    }
  }
);

export const deleteSupervisor = createAsyncThunk(
  "supervisor/deleteSupervisor",
  async (id, { rejectWithValue }) => {
    try {
      await supervisorService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete supervisor"
      );
    }
  }
);

const supervisorSlice = createSlice({
  name: "supervisor",
  initialState: {
    supervisors: [],
    total: 0,
    currentPage: 1,
    totalPages: 0,
    loading: false,
    error: null,
    selectedSupervisor: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedSupervisor: (state, action) => {
      state.selectedSupervisor = action.payload;
    },
    clearSelectedSupervisor: (state) => {
      state.selectedSupervisor = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Supervisors
      .addCase(fetchSupervisors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSupervisors.fulfilled, (state, action) => {
        state.loading = false;
        state.supervisors = action.payload.data || [];
        state.total = action.payload.total || 0;
        state.currentPage = action.payload.page || 1;
        state.totalPages = action.payload.totalPages || 0;
      })
      .addCase(fetchSupervisors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Supervisor
      .addCase(createSupervisor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSupervisor.fulfilled, (state, action) => {
        state.loading = false;
        state.supervisors.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createSupervisor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Supervisor
      .addCase(updateSupervisor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSupervisor.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.supervisors.findIndex(
          (s) => s._id === action.payload._id
        );
        if (index !== -1) {
          state.supervisors[index] = action.payload;
        }
      })
      .addCase(updateSupervisor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Supervisor
      .addCase(deleteSupervisor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSupervisor.fulfilled, (state, action) => {
        state.loading = false;
        state.supervisors = state.supervisors.filter(
          (s) => s._id !== action.payload
        );
        state.total -= 1;
      })
      .addCase(deleteSupervisor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setSelectedSupervisor, clearSelectedSupervisor } =
  supervisorSlice.actions;
export default supervisorSlice.reducer;
