import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { attendanceService } from "../../api/attendanceService";

export const fetchOrgList = createAsyncThunk(
  "attendance/fetchOrgList",
  async (_, { rejectWithValue }) => {
    console.log("👥 [ATTENDANCE SLICE] Fetch Org List API Call");
    try {
      const response = await attendanceService.getOrgList();
      console.log("✅ [ATTENDANCE SLICE] Fetch Org List Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [ATTENDANCE SLICE] Fetch Org List Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const fetchAttendanceList = createAsyncThunk(
  "attendance/fetchAttendanceList",
  async (params, { rejectWithValue }) => {
    console.log(
      "📋 [ATTENDANCE SLICE] Fetch Attendance List API Call:",
      params
    );
    try {
      const response = await attendanceService.list(params);
      console.log(
        "✅ [ATTENDANCE SLICE] Fetch Attendance List Success:",
        response
      );
      return response;
    } catch (error) {
      console.error(
        "❌ [ATTENDANCE SLICE] Fetch Attendance List Error:",
        error
      );
      return rejectWithValue(error);
    }
  }
);

export const updateAttendance = createAsyncThunk(
  "attendance/updateAttendance",
  async (payload, { rejectWithValue }) => {
    console.log("✏️ [ATTENDANCE SLICE] Update Attendance API Call:", payload);
    try {
      const response = await attendanceService.update(payload);
      console.log("✅ [ATTENDANCE SLICE] Update Attendance Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [ATTENDANCE SLICE] Update Attendance Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const exportAttendance = createAsyncThunk(
  "attendance/exportAttendance",
  async (params, { rejectWithValue }) => {
    console.log("📤 [ATTENDANCE SLICE] Export Attendance API Call:", params);
    try {
      const response = await attendanceService.exportData(params);
      console.log("✅ [ATTENDANCE SLICE] Export Attendance Success");
      return response;
    } catch (error) {
      console.error("❌ [ATTENDANCE SLICE] Export Attendance Error:", error);
      return rejectWithValue(error);
    }
  }
);

const attendanceSlice = createSlice({
  name: "attendance",
  initialState: {
    orgList: [],
    attendanceList: [],
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
      .addCase(fetchOrgList.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrgList.fulfilled, (state, action) => {
        state.loading = false;
        state.orgList = action.payload.data || [];
      })
      .addCase(fetchOrgList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAttendanceList.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAttendanceList.fulfilled, (state, action) => {
        state.loading = false;
        state.attendanceList = action.payload.data || [];
      })
      .addCase(fetchAttendanceList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = attendanceSlice.actions;
export default attendanceSlice.reducer;
