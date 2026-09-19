import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { paymentService } from "../../api/paymentService";

// Async thunk for fetching residence payments
export const fetchResidencePayments = createAsyncThunk(
  "residencePayment/fetchResidencePayments",
  async (
    { page = 1, limit = 10, search = "", filters = {} },
    { rejectWithValue },
  ) => {
    try {
      // Add onewash: false to filter for residence payments only
      const residenceFilters = { ...filters, onewash: "false" };
      const response = await paymentService.list(
        page,
        limit,
        search,
        residenceFilters,
      );
      return { ...response, currentPage: page };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Async thunk for deleting residence payment
export const deleteResidencePayment = createAsyncThunk(
  "residencePayment/deleteResidencePayment",
  async (id, { rejectWithValue }) => {
    try {
      await paymentService.deletePayment(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

const residencePaymentSlice = createSlice({
  name: "residencePayment",
  initialState: {
    payments: [],
    stats: {
      totalAmount: 0,
      totalJobs: 0,
      cash: 0,
      card: 0,
      bank: 0,
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
      .addCase(fetchResidencePayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResidencePayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.data || [];
        state.stats = action.payload.counts || state.stats;
        state.total = action.payload.total || 0;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchResidencePayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch residence payments";
      })
      // Delete Payment - remove from list immediately
      .addCase(deleteResidencePayment.fulfilled, (state, action) => {
        state.payments = state.payments.filter(
          (payment) => payment._id !== action.payload,
        );
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteResidencePayment.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete residence payment";
      });
  },
});

export const { clearError } = residencePaymentSlice.actions;
export default residencePaymentSlice.reducer;
