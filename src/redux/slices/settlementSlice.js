import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { paymentService } from "../../api/paymentService";

// Async thunks
export const fetchSettlements = createAsyncThunk(
  "settlements/fetchSettlements",
  async ({ page, limit }, { rejectWithValue }) => {
    try {
      const response = await paymentService.getSettlements(page, limit);
      return { ...response, currentPage: page };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const approveSettlement = createAsyncThunk(
  "settlements/approveSettlement",
  async (id, { rejectWithValue }) => {
    try {
      await paymentService.updateSettlement(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const settlementSlice = createSlice({
  name: "settlements",
  initialState: {
    settlements: [],
    total: 0,
    currentPage: 1,
    totalPages: 1,
    loading: false,
    error: null,
    selectedSettlement: null,
  },
  reducers: {
    setSelectedSettlement: (state, action) => {
      state.selectedSettlement = action.payload;
    },
    clearSelectedSettlement: (state) => {
      state.selectedSettlement = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch settlements
      .addCase(fetchSettlements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettlements.fulfilled, (state, action) => {
        state.loading = false;
        state.settlements = action.payload.data || [];
        state.total = action.payload.total || 0;
        state.currentPage = action.payload.currentPage || 1;
        state.totalPages = Math.ceil(action.payload.total / 50) || 1;
      })
      .addCase(fetchSettlements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch settlements";
      })
      // Approve settlement
      .addCase(approveSettlement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveSettlement.fulfilled, (state, action) => {
        state.loading = false;
        // Update the settlement status in the list
        const settlement = state.settlements.find(
          (s) => s._id === action.payload
        );
        if (settlement) {
          settlement.status = "completed";
        }
      })
      .addCase(approveSettlement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to approve settlement";
      });
  },
});

export const { setSelectedSettlement, clearSelectedSettlement, clearError } =
  settlementSlice.actions;

export default settlementSlice.reducer;
