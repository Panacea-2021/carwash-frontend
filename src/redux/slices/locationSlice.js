import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { locationService } from "../../api/locationService";

export const fetchLocations = createAsyncThunk(
  "location/fetchLocations",
  async ({ page = 1, limit = 50, search = "" }, { rejectWithValue }) => {
    console.log("📍 [LOCATION SLICE] Fetch Locations API Call:", {
      page,
      limit,
      search,
    });
    try {
      const response = await locationService.list(page, limit, search);
      console.log("✅ [LOCATION SLICE] Fetch Locations Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [LOCATION SLICE] Fetch Locations Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const createLocation = createAsyncThunk(
  "location/createLocation",
  async (data, { rejectWithValue }) => {
    console.log("➕ [LOCATION SLICE] Create Location API Call:", data);
    try {
      const response = await locationService.create(data);
      console.log("✅ [LOCATION SLICE] Create Location Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [LOCATION SLICE] Create Location Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const updateLocation = createAsyncThunk(
  "location/updateLocation",
  async ({ id, data }, { rejectWithValue }) => {
    console.log("✏️ [LOCATION SLICE] Update Location API Call:", { id, data });
    try {
      const response = await locationService.update(id, data);
      console.log("✅ [LOCATION SLICE] Update Location Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [LOCATION SLICE] Update Location Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const deleteLocation = createAsyncThunk(
  "location/deleteLocation",
  async (id, { rejectWithValue }) => {
    console.log("🗑️ [LOCATION SLICE] Delete Location API Call:", id);
    try {
      const response = await locationService.delete(id);
      console.log("✅ [LOCATION SLICE] Delete Location Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [LOCATION SLICE] Delete Location Error:", error);
      return rejectWithValue(error);
    }
  }
);

const locationSlice = createSlice({
  name: "location",
  initialState: {
    locations: [],
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
      .addCase(fetchLocations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.loading = false;
        state.locations = action.payload.data || [];
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = locationSlice.actions;
export default locationSlice.reducer;
