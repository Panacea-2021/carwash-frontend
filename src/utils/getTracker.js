/**
 * Returns the correct activity tracker singleton based on the logged-in user's role.
 * - supervisor → supervisorTracker (sends to /supervisor-activities/batch)
 * - admin / manager → adminTracker (sends to /admin-activities/batch)
 */
import adminTracker from "./adminActivityTracker";
import supervisorTracker from "./supervisorActivityTracker";

export function getTracker() {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === "supervisor") return supervisorTracker;
    }
  } catch (e) {
    // fallback to admin tracker
  }
  return adminTracker;
}
