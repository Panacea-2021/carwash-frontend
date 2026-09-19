import { useCallback, useEffect, useState } from "react";
import PAGE_PERMISSIONS_CONFIG from "./pagePermissionsConfig";

const readStoredUser = () => {
  try {
    const userString = localStorage.getItem("user");
    return userString ? JSON.parse(userString) : {};
  } catch {
    return {};
  }
};

/**
 * Hook for checking granular page-level permissions.
 *
 * For admin users: all elements are always visible.
 * For manager users: checks user.pagePermissions[pageKey].
 *   - If pagePermissions[pageKey] is undefined → ALL visible (backward compatible).
 *   - If it exists → only whitelisted keys are visible.
 *
 * Usage:
 *   const pp = usePagePermissions("customers");
 *   pp.isColumnVisible("name")        // → true/false
 *   pp.isActionVisible("edit")        // → true/false
 *   pp.isToolbarVisible("export")     // → true/false
 *   pp.filterColumns(columnsArray)    // → filtered columns (uses col.key)
 */
export const usePagePermissions = (pageKey) => {
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

  const isAdmin = user.role === "admin";
  const pagePerms = user.pagePermissions?.[pageKey];
  const config = PAGE_PERMISSIONS_CONFIG[pageKey];

  // If admin or no pagePermissions set for this page → everything visible
  const hasRestrictions = !isAdmin && pagePerms !== undefined;

  const isColumnVisible = useCallback(
    (columnKey) => {
      if (!hasRestrictions) return true;
      return pagePerms?.columns?.includes(columnKey) ?? true;
    },
    [hasRestrictions, pagePerms],
  );

  const isActionVisible = useCallback(
    (actionKey) => {
      if (!hasRestrictions) return true;
      return pagePerms?.actions?.includes(actionKey) ?? true;
    },
    [hasRestrictions, pagePerms],
  );

  const isToolbarVisible = useCallback(
    (toolbarKey) => {
      if (!hasRestrictions) return true;
      return pagePerms?.toolbar?.includes(toolbarKey) ?? true;
    },
    [hasRestrictions, pagePerms],
  );

  // Filter an array of column objects that have a `key` field
  const filterColumns = useCallback(
    (columns) => {
      if (!hasRestrictions) return columns;
      const savedKeys = pagePerms?.columns || [];
      // If saved keys don't match any actual column (stale config), show all
      const actualKeys = columns.map((c) => c.key).filter(Boolean);
      const hasOverlap = savedKeys.some((k) => actualKeys.includes(k));
      if (!hasOverlap) return columns;
      return columns.filter((col) => {
        // Always show columns without a key (e.g. row number)
        if (!col.key) return true;
        // Always show actions column (actions are controlled separately inside render)
        if (col.key === "actions") return true;
        return savedKeys.includes(col.key);
      });
    },
    [hasRestrictions, pagePerms],
  );

  return {
    isColumnVisible,
    isActionVisible,
    isToolbarVisible,
    filterColumns,
    hasRestrictions,
    isAdmin,
    user,
    pageConfig: config,
    pagePerms,
  };
};

export default usePagePermissions;
