import { useEffect, useState } from "react";

const readStoredUser = () => {
  try {
    const userString = localStorage.getItem("user");
    return userString ? JSON.parse(userString) : {};
  } catch {
    return {};
  }
};

/**
 * Hook to check permissions for the current user.
 * Admin role bypasses all checks. Manager role checks the permissions object.
 *
 * Usage:
 *   const { hasPermission, isAdmin, userRole } = usePermissions();
 *   if (hasPermission("customers", "edit")) { ... }
 *   if (hasPermission("payments", "view")) { ... }
 */
export const usePermissions = () => {
  const [user, setUser] = useState(readStoredUser);

  useEffect(() => {
    const syncUser = () => setUser(readStoredUser());
    window.addEventListener("storage", syncUser);
    window.addEventListener("user-updated", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("user-updated", syncUser);
    };
  }, []);

  const userRole = user.role || "user";
  const isAdmin = userRole === "admin";
  const permissions = user.permissions || {};

  const hasPermission = (moduleName, action = "view") => {
    // Admin bypasses all permission checks
    if (isAdmin) return true;

    const modulePerms = permissions[moduleName];
    if (!modulePerms) return false;

    return !!modulePerms[action];
  };

  return { hasPermission, isAdmin, userRole, permissions, user };
};

/**
 * Mapping of sidebar/route paths to permission module names.
 * Used by Sidebar and App.jsx for route-level permission checks.
 */
export const PERMISSION_MODULES = {
  "/": "dashboard",
  "/ai/assistant": "aiAssistant",
  "/customers": "customers",
  "/customers/vehicle-management": "vehicles",
  "/customers/import-history": "customers",
  "/workers/list": "workers",
  "/workers/staff": "staff",
  "/workers/attendance": "attendance",
  "/workers/monthly": "workers",
  "/workers/yearly": "yearlyRecords",
  "/pending-payments": "pendingPayments",
  "/supervisors": "supervisors",
  "/washes/onewash": "washes",
  "/washes/residence": "washes",
  "/payments": "payments",
  "/payments/onewash": "payments",
  "/payments/residence": "payments",
  "/payments/edit-history": "payments",
  "/work-records": "workRecords",
  "/collection-sheet": "collectionSheet",
  "/settlements": "settlements",
  "/pricing": "pricing",
  "/locations": "locations",
  "/buildings": "buildings",
  "/malls": "malls",
  "/sites": "sites",
  "/enquiry": "enquiry",
  "/bookings": "bookings",
  "/import-logs": "importLogs",
  "/settings": "settings",
  "/settings/salary": "settings",
  "/admin-staff": "adminStaff", // Only visible to admin
};

/**
 * Full definition of all permission modules for the admin staff management UI.
 * Label = Display name, actions = available actions for that module.
 */
export const ALL_PERMISSION_MODULES = [
  { key: "dashboard", label: "Dashboard", actions: ["view"] },
  { key: "aiAssistant", label: "AI Assistant", actions: ["view"] },
  {
    key: "customers",
    label: "Customers",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "workers",
    label: "Workers",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "staff",
    label: "Staff (Workers)",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "attendance",
    label: "Attendance",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "supervisors",
    label: "Supervisors",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "washes",
    label: "Washes",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "payments",
    label: "Payments",
    actions: ["view", "create", "edit", "delete"],
  },
  { key: "workRecords", label: "Work Records", actions: ["view"] },
  { key: "collectionSheet", label: "Collection Sheet", actions: ["view"] },
  {
    key: "settlements",
    label: "Settlements",
    actions: ["view", "create", "edit", "delete"],
  },
  { key: "pendingPayments", label: "Due Lists", actions: ["view"] },
  { key: "yearlyRecords", label: "Yearly Records", actions: ["view"] },
  { key: "pricing", label: "Pricing", actions: ["view", "edit"] },
  {
    key: "locations",
    label: "Locations",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "buildings",
    label: "Buildings",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "malls",
    label: "Malls",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "sites",
    label: "Sites",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "vehicles",
    label: "Vehicle Management",
    actions: ["view", "create", "edit", "delete"],
  },
  { key: "enquiry", label: "Enquiry", actions: ["view", "edit", "delete"] },
  { key: "bookings", label: "Bookings", actions: ["view", "edit", "delete"] },
  { key: "importLogs", label: "Import Logs", actions: ["view"] },
  { key: "settings", label: "Settings", actions: ["view", "edit"] },
];
