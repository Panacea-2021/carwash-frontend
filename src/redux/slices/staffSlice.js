import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { staffService } from "../../api/staffService";

// ==========================================
// 🚀 ASYNC THUNKS
// ==========================================

// 1. Fetch Staff List
export const getStaffList = createAsyncThunk(
  "staff/getStaffList",
  async ({ page, limit, search }, { rejectWithValue }) => {
    try {
      const response = await staffService.list(page, limit, search);
      return response; // Expected: { total: number, data: [] }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch staff"
      );
    }
  }
);

// 2. Create Staff
export const createStaff = createAsyncThunk(
  "staff/createStaff",
  async (staffData, { rejectWithValue }) => {
    try {
      const response = await staffService.create(staffData);
      return response.data; // The created staff object
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create staff"
      );
    }
  }
);

// 3. Update Staff
export const updateStaff = createAsyncThunk(
  "staff/updateStaff",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await staffService.update(id, data);
      return { id, ...data }; // Return updated data to update state
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update staff"
      );
    }
  }
);

// 4. Delete Staff
export const deleteStaff = createAsyncThunk(
  "staff/deleteStaff",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      await staffService.delete(id, reason);
      return id; // Return ID to filter out from state
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete staff"
      );
    }
  }
);

// 5. Upload Profile Image
export const uploadStaffImage = createAsyncThunk(
  "staff/uploadImage",
  async ({ id, file }, { rejectWithValue }) => {
    try {
      const response = await staffService.uploadProfileImage(id, file);
      return { id, profileImage: response }; // Return new image data to update state
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to upload image"
      );
    }
  }
);

// ==========================================
// ⚡ SLICE
// ==========================================

const staffSlice = createSlice({
  name: "staff",
  initialState: {
    staff: [], // List of staff
    total: 0, // Total count for pagination
    loading: false, // Global loading state
    actionLoading: false, // Specific loading for create/update/delete
    error: null, // Error messages
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- FETCH LIST ---
      .addCase(getStaffList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStaffList.fulfilled, (state, action) => {
        state.loading = false;
        state.staff = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(getStaffList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- CREATE ---
      .addCase(createStaff.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createStaff.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.staff.unshift(action.payload); // Add new staff to top of list
        state.total += 1;
      })
      .addCase(createStaff.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // --- UPDATE ---
      .addCase(updateStaff.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.staff.findIndex((s) => s._id === action.payload.id);
        if (index !== -1) {
          state.staff[index] = { ...state.staff[index], ...action.payload };
        }
      })
      .addCase(updateStaff.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // --- DELETE ---
      .addCase(deleteStaff.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.staff = state.staff.filter((s) => s._id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteStaff.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // --- UPLOAD IMAGE ---
      .addCase(uploadStaffImage.fulfilled, (state, action) => {
        const index = state.staff.findIndex((s) => s._id === action.payload.id);
        if (index !== -1) {
          state.staff[index].profileImage = action.payload.profileImage;
        }
      });
  },
});

export const { clearError } = staffSlice.actions;
export default staffSlice.reducer;
