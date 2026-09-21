import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { paymentService } from "../../api/paymentService";

// Async thunk for downloading collection sheet
export const downloadCollectionSheet = createAsyncThunk(
  "collectionSheet/download",
  async (filters, { rejectWithValue }) => {
    try {
      const blob = await paymentService.downloadCollectionSheet(filters);
      return { blob, filters };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const collectionSheetSlice = createSlice({
  name: "collectionSheet",
  initialState: {
    downloading: false,
    error: null,
    lastDownload: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(downloadCollectionSheet.pending, (state) => {
        state.downloading = true;
        state.error = null;
      })
      .addCase(downloadCollectionSheet.fulfilled, (state, action) => {
        state.downloading = false;
        state.lastDownload = new Date().toISOString();
      })
      .addCase(downloadCollectionSheet.rejected, (state, action) => {
        state.downloading = false;
        state.error = action.payload || "Failed to download collection sheet";
      });
  },
});

export const { clearError } = collectionSheetSlice.actions;

export default collectionSheetSlice.reducer;
