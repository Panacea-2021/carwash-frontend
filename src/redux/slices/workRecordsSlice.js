import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { workRecordsService } from "../../api/workRecordsService";

// Async thunk for downloading work records statement
export const downloadWorkRecordsStatement = createAsyncThunk(
  "workRecords/downloadStatement",
  async (
    {
      serviceType,
      month,
      year,
      workerId = "",
      workers = null,
      buildingWise = false,
      buildingId = "",
      buildingName = "",
    },
    { rejectWithValue },
  ) => {
    try {
      const blob = await workRecordsService.downloadStatement(
        serviceType,
        month,
        year,
        workerId,
        workers,
        { buildingWise, buildingId, buildingName },
      );
      return {
        blob,
        serviceType,
        month,
        year,
        workerId,
        workers,
        buildingWise,
        buildingId,
        buildingName,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Async thunk for fetching work records data (for preview/PDF)
export const fetchWorkRecordsData = createAsyncThunk(
  "workRecords/fetchData",
  async (
    { serviceType, month, year, workerId = "", buildingId = "" },
    { rejectWithValue },
  ) => {
    try {
      const data = await workRecordsService.getStatementData(
        year,
        month,
        serviceType,
        workerId,
        null,
        { buildingId },
      );
      return { data, serviceType, month, year, workerId, buildingId };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

const workRecordsSlice = createSlice({
  name: "workRecords",
  initialState: {
    workRecords: [],
    viewData: null,
    downloading: false,
    loading: false,
    error: null,
    lastDownload: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearViewData: (state) => {
      state.viewData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(downloadWorkRecordsStatement.pending, (state) => {
        state.downloading = true;
        state.error = null;
      })
      .addCase(downloadWorkRecordsStatement.fulfilled, (state, action) => {
        state.downloading = false;
        state.lastDownload = new Date().toISOString();
      })
      .addCase(downloadWorkRecordsStatement.rejected, (state, action) => {
        state.downloading = false;
        state.error =
          action.payload || "Failed to download work records statement";
      })
      .addCase(fetchWorkRecordsData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkRecordsData.fulfilled, (state, action) => {
        state.loading = false;
        state.viewData = action.payload.data;
      })
      .addCase(fetchWorkRecordsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch work records data";
      });
  },
});

export const { clearError, clearViewData } = workRecordsSlice.actions;
export default workRecordsSlice.reducer;
