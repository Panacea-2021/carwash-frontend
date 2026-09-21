import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Suspense, useState, useEffect, useRef } from "react";

// Layouts & Pages
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/auth/Login";
import { routes } from "./routes"; // Your route config file
import api from "./api/axiosInstance";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";

// Activity Tracker (role-based)
import { getTracker } from "./utils/getTracker";

// Permissions
import { PERMISSION_MODULES } from "./utils/usePermissions";

// --- Route Change Tracker (must be inside BrowserRouter) ---
const RouteTracker = () => {
  const location = useLocation();
  const prevPath = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const tracker = getTracker();

    // Initialize tracker if not already (e.g. page refresh while logged in)
    if (!tracker._initialized) {
      tracker.initialize();
    }

    // Only track if path actually changed
    if (prevPath.current !== location.pathname) {
      const matchedRoute = routes.find((r) => {
        // Simple match for static routes
        if (r.path === location.pathname) return true;
        // For dynamic routes like /workers/:id, do a rough match
        const pattern = r.path.replace(/:[^/]+/g, "[^/]+");
        return new RegExp(`^${pattern}$`).test(location.pathname);
      });

      const title = matchedRoute?.title || document.title || location.pathname;
      tracker.trackPageView(location.pathname, title);
      prevPath.current = location.pathname;
    }
  }, [location.pathname]);

  return null;
};

// --- Custom Loading Screen ---
const LoadingScreen = () => (
  <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999]">
    <div className="relative">
      <div className="w-24 h-24 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center animate-pulse">
        <img
          src="/carwash.jpeg"
          className="w-10 h-10 object-contain"
          alt="Loading..."
        />
      </div>
    </div>
    <p className="mt-4 text-slate-500 font-medium text-sm tracking-widest uppercase animate-pulse">
      Loading Baba Car Wash...
    </p>
  </div>
);

// --- Public Route (Prevents logged-in users from seeing login page) ---
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// --- Role-Based Index Route ---
const RoleBasedIndex = () => {
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : {};
  const userRole = user.role || "user";

  if (userRole === "supervisor") {
    return <Navigate to="/supervisor/dashboard" replace />;
  }

  // Return admin dashboard for admins/managers
  const dashboardRoute = routes.find((r) => r.path === "/");
  return dashboardRoute?.component || <Navigate to="/login" replace />;
};

// --- Protected Route Content with Role Checks ---
const ProtectedRouteContent = ({ route }) => {
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : {};
  const userRole = user.role || "user";

  const isSupervisorRoute = route.path?.startsWith("/supervisor/");

  // Routes that supervisors can access from admin panel
  const supervisorAllowedAdminRoutes = [
    "/work-records",
    "/collection-sheet",
    "/settlements",
    "/privacy-policy",
    "/terms-of-service",
    "/notifications",
  ];

  // BLOCK: Admins/Managers accessing supervisor routes
  if (isSupervisorRoute && userRole !== "supervisor") {
    return <Navigate to="/" replace />;
  }

  // BLOCK: Supervisors accessing admin-only routes
  if (
    !isSupervisorRoute &&
    userRole === "supervisor" &&
    !supervisorAllowedAdminRoutes.includes(route.path)
  ) {
    return <Navigate to="/supervisor/dashboard" replace />;
  }

  // BLOCK: Manager (admin staff) accessing admin-only routes
  if (userRole === "manager") {
    // Admin Staff page is admin-only
    if (
      route.path === "/admin-staff" ||
      route.path === "/admin/staff-app-updates"
    ) {
      return <Navigate to="/" replace />;
    }

    // Check permission for the route's module
    const moduleName = PERMISSION_MODULES[route.path];
    if (moduleName) {
      const modulePerms = user.permissions?.[moduleName];
      if (!modulePerms?.view) {
        return <Navigate to="/" replace />;
      }
    }
  }

  // ALLOW: Route access granted
  return route.component;
};

function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const syncCurrentUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await api.get("/users/me/info");
        const latestUser = response?.data?.data;
        if (latestUser) {
          localStorage.setItem("user", JSON.stringify(latestUser));
          window.dispatchEvent(new Event("user-updated"));
        }
      } catch {
        // Ignore refresh failure and continue with cached user
      }
    };

    syncCurrentUser();

    // Simulate initial app boot (optional, makes it feel smoother)
    const timer = setTimeout(() => setAppReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!appReady) return <LoadingScreen />;

  return (
    <BrowserRouter>
      {/* --- Route Change Tracker --- */}
      <RouteTracker />

      {/* --- TOASTER SETTINGS --- */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1e293b",
            color: "#fff",
            padding: "16px",
            borderRadius: "12px",
            fontSize: "14px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
          },
          success: {
            iconTheme: { primary: "#10B981", secondary: "#fff" },
            style: { borderLeft: "4px solid #10B981" },
          },
          error: {
            duration: 4000,
            iconTheme: { primary: "#EF4444", secondary: "#fff" },
            style: { borderLeft: "4px solid #EF4444" },
          },
        }}
      />

      <Routes>
        {/* 1. PUBLIC ROUTE (Login) */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* 2. PROTECTED ROUTES (Dashboard, Customers, etc.) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            {/* Index Route - Role-based redirect */}
            <Route
              index
              element={
                <Suspense fallback={<LoadingScreen />}>
                  <RoleBasedIndex />
                </Suspense>
              }
            />

            {/* Dynamic Routes with Protection */}
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    <ProtectedRouteContent route={route} />
                  </Suspense>
                }
              />
            ))}
          </Route>
        </Route>

        {/* 3. FALLBACK (Redirect unknown URLs to home) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
