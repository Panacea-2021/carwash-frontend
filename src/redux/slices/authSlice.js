import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../api/authService";

// Async Thunks
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    console.log("🔐 [AUTH SLICE] Login API Call:", credentials);
    try {
      const response = await authService.login(credentials);
      console.log("✅ [AUTH SLICE] Login Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [AUTH SLICE] Login Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const signup = createAsyncThunk(
  "auth/signup",
  async (userData, { rejectWithValue }) => {
    console.log("📝 [AUTH SLICE] Signup API Call:", userData);
    try {
      const response = await authService.signup(userData);
      console.log("✅ [AUTH SLICE] Signup Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [AUTH SLICE] Signup Error:", error);
      return rejectWithValue(error);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      console.log("👋 [AUTH SLICE] Logout");
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      authService.logout();
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Signup
    builder
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
