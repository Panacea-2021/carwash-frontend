import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { buildingService } from "../../api/buildingService";

export const fetchBuildings = createAsyncThunk(
  "building/fetchBuildings",
  async ({ page = 1, limit = 10, search = "" }, { rejectWithValue }) => {
    console.log("🏢 [BUILDING SLICE] Fetch Buildings API Call:", {
      page,
      limit,
      search,
    });
    try {
      const response = await buildingService.list(page, limit, search);
      console.log("✅ [BUILDING SLICE] Fetch Buildings Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [BUILDING SLICE] Fetch Buildings Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const createBuilding = createAsyncThunk(
  "building/createBuilding",
  async (data, { rejectWithValue }) => {
    console.log("➕ [BUILDING SLICE] Create Building API Call:", data);
    try {
      const response = await buildingService.create(data);
      console.log("✅ [BUILDING SLICE] Create Building Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [BUILDING SLICE] Create Building Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const updateBuilding = createAsyncThunk(
  "building/updateBuilding",
  async ({ id, data }, { rejectWithValue }) => {
    console.log("✏️ [BUILDING SLICE] Update Building API Call:", { id, data });
    try {
      const response = await buildingService.update(id, data);
      console.log("✅ [BUILDING SLICE] Update Building Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [BUILDING SLICE] Update Building Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const deleteBuilding = createAsyncThunk(
  "building/deleteBuilding",
  async (id, { rejectWithValue }) => {
    console.log("🗑️ [BUILDING SLICE] Delete Building API Call:", id);
    try {
      const response = await buildingService.delete(id);
      console.log("✅ [BUILDING SLICE] Delete Building Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [BUILDING SLICE] Delete Building Error:", error);
      return rejectWithValue(error);
    }
  }
);

const buildingSlice = createSlice({
  name: "building",
  initialState: {
    buildings: [],
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
      .addCase(fetchBuildings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBuildings.fulfilled, (state, action) => {
        state.loading = false;
        state.buildings = action.payload.data || [];
      })
      .addCase(fetchBuildings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = buildingSlice.actions;
export default buildingSlice.reducer;
