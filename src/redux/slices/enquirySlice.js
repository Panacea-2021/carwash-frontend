import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { enquiryService } from "../../api/enquiryService";

// Async Thunks
export const fetchEnquiries = createAsyncThunk(
  "enquiry/fetchEnquiries",
  async ({ page = 1, limit = 50, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await enquiryService.list(page, limit, filters);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch enquiries"
      );
    }
  }
);

export const createEnquiry = createAsyncThunk(
  "enquiry/createEnquiry",
  async (data, { rejectWithValue }) => {
    try {
      const response = await enquiryService.create(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create enquiry"
      );
    }
  }
);

export const updateEnquiry = createAsyncThunk(
  "enquiry/updateEnquiry",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await enquiryService.update(id, data);
      return { id, response };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update enquiry"
      );
    }
  }
);

export const deleteEnquiry = createAsyncThunk(
  "enquiry/deleteEnquiry",
  async (id, { rejectWithValue }) => {
    try {
      await enquiryService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete enquiry"
      );
    }
  }
);

const enquirySlice = createSlice({
  name: "enquiry",
  initialState: {
    enquiries: [],
    total: 0,
    currentPage: 1,
    totalPages: 1,
    loading: false,
    error: null,
    selectedEnquiry: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedEnquiry: (state, action) => {
      state.selectedEnquiry = action.payload;
    },
    clearSelectedEnquiry: (state) => {
      state.selectedEnquiry = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Enquiries
    builder.addCase(fetchEnquiries.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchEnquiries.fulfilled, (state, action) => {
      state.loading = false;
      state.enquiries = action.payload.data || [];
      state.total = action.payload.total || 0;
      state.currentPage = action.payload.page || 1;
      state.totalPages = Math.ceil(
        (action.payload.total || 0) / (action.payload.limit || 50)
      );
    });
    builder.addCase(fetchEnquiries.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Create Enquiry
    builder.addCase(createEnquiry.fulfilled, (state, action) => {
      state.enquiries.unshift(action.payload);
      state.total += 1;
    });
    builder.addCase(createEnquiry.rejected, (state, action) => {
      state.error = action.payload;
    });

    // Update Enquiry
    builder.addCase(updateEnquiry.fulfilled, (state, action) => {
      const index = state.enquiries.findIndex(
        (e) => e._id === action.payload.id
      );
      if (index !== -1) {
        state.enquiries[index] = action.payload.response;
      }
    });
    builder.addCase(updateEnquiry.rejected, (state, action) => {
      state.error = action.payload;
    });

    // Delete Enquiry
    builder.addCase(deleteEnquiry.fulfilled, (state, action) => {
      state.enquiries = state.enquiries.filter((e) => e._id !== action.payload);
      state.total -= 1;
    });
    builder.addCase(deleteEnquiry.rejected, (state, action) => {
      state.error = action.payload;
    });
  },
});

export const { clearError, setSelectedEnquiry, clearSelectedEnquiry } =
  enquirySlice.actions;
export default enquirySlice.reducer;
