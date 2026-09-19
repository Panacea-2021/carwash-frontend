import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { mallService } from "../../api/mallService";

export const fetchMalls = createAsyncThunk(
  "mall/fetchMalls",
  async ({ page = 1, limit = 50, search = "" }, { rejectWithValue }) => {
    console.log("🏬 [MALL SLICE] Fetch Malls API Call:", {
      page,
      limit,
      search,
    });
    try {
      const response = await mallService.list(page, limit, search);
      console.log("✅ [MALL SLICE] Fetch Malls Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [MALL SLICE] Fetch Malls Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const createMall = createAsyncThunk(
  "mall/createMall",
  async (data, { rejectWithValue }) => {
    console.log("➕ [MALL SLICE] Create Mall API Call:", data);
    try {
      const response = await mallService.create(data);
      console.log("✅ [MALL SLICE] Create Mall Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [MALL SLICE] Create Mall Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const updateMall = createAsyncThunk(
  "mall/updateMall",
  async ({ id, data }, { rejectWithValue }) => {
    console.log("✏️ [MALL SLICE] Update Mall API Call:", { id, data });
    try {
      const response = await mallService.update(id, data);
      console.log("✅ [MALL SLICE] Update Mall Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [MALL SLICE] Update Mall Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const deleteMall = createAsyncThunk(
  "mall/deleteMall",
  async (id, { rejectWithValue }) => {
    console.log("🗑️ [MALL SLICE] Delete Mall API Call:", id);
    try {
      const response = await mallService.delete(id);
      console.log("✅ [MALL SLICE] Delete Mall Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [MALL SLICE] Delete Mall Error:", error);
      return rejectWithValue(error);
    }
  }
);

const mallSlice = createSlice({
  name: "mall",
  initialState: {
    malls: [],
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
      .addCase(fetchMalls.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMalls.fulfilled, (state, action) => {
        state.loading = false;
        state.malls = action.payload.data || [];
      })
      .addCase(fetchMalls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = mallSlice.actions;
export default mallSlice.reducer;
