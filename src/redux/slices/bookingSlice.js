import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { bookingService } from "../../api/bookingService";

export const fetchBookings = createAsyncThunk(
  "booking/fetchBookings",
  async ({ page = 1, limit = 10, search = "" }, { rejectWithValue }) => {
    try {
      const response = await bookingService.list(page, limit, search);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch bookings"
      );
    }
  }
);

export const assignWorker = createAsyncThunk(
  "booking/assignWorker",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await bookingService.assignWorker(id, payload);
      return { id, response };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign worker"
      );
    }
  }
);

export const acceptBooking = createAsyncThunk(
  "booking/acceptBooking",
  async (id, { rejectWithValue }) => {
    try {
      const response = await bookingService.accept(id);
      return { id, response };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to accept booking"
      );
    }
  }
);

export const deleteBooking = createAsyncThunk(
  "booking/deleteBooking",
  async (id, { rejectWithValue }) => {
    try {
      await bookingService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete booking"
      );
    }
  }
);

const bookingSlice = createSlice({
  name: "booking",
  initialState: {
    bookings: [],
    total: 0,
    currentPage: 1,
    totalPages: 0,
    loading: false,
    error: null,
    selectedBooking: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedBooking: (state, action) => {
      state.selectedBooking = action.payload;
    },
    clearSelectedBooking: (state) => {
      state.selectedBooking = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Bookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload.data || [];
        state.total = action.payload.total || 0;
        state.currentPage = action.payload.page || 1;
        state.totalPages = action.payload.totalPages || 0;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Assign Worker
      .addCase(assignWorker.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignWorker.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.bookings.findIndex(
          (b) => b._id === action.payload.id
        );
        if (index !== -1) {
          state.bookings[index] = {
            ...state.bookings[index],
            worker: action.payload.response.worker,
          };
        }
      })
      .addCase(assignWorker.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Accept Booking
      .addCase(acceptBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acceptBooking.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.bookings.findIndex(
          (b) => b._id === action.payload.id
        );
        if (index !== -1) {
          state.bookings[index] = {
            ...state.bookings[index],
            status: "accepted",
          };
        }
      })
      .addCase(acceptBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Booking
      .addCase(deleteBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = state.bookings.filter((b) => b._id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setSelectedBooking, clearSelectedBooking } =
  bookingSlice.actions;
export default bookingSlice.reducer;
