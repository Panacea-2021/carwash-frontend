/**
 * Shift-based date utilities for supervisor pages.
 * Workers' shift runs 18:30 to 18:30 Dubai time (UTC+4).
 *
 * Before 18:30 today → shift = yesterday 18:30 to today 18:30
 * After 18:30 today  → shift = today 18:30 to tomorrow 18:30
 */

const DUBAI_OFFSET_HOURS = 4; // UTC+4

/**
 * Normalize incoming date strings from pickers/API payloads.
 * Accepts YYYY-MM-DD and ISO-like values, returns YYYY-MM-DD.
 */
function normalizeDateString(dateStr) {
  if (!dateStr) return null;

  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return null;
    const year = dateStr.getFullYear();
    const month = String(dateStr.getMonth() + 1).padStart(2, "0");
    const day = String(dateStr.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  if (typeof dateStr !== "string") return null;

  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get current Dubai time as a Date object.
 */
function getDubaiNow() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + DUBAI_OFFSET_HOURS * 3600000);
}

/**
 * Create a Dubai date at a specific hour/minute, then convert to UTC ISO string.
 * @param {Date} dubaiDate - A date in Dubai time
 * @param {number} hours - Hour (0-23)
 * @param {number} minutes - Minutes
 * @returns {string} ISO string in UTC
 */
function dubaiTimeToUTC(dubaiDate, hours, minutes) {
  const d = new Date(dubaiDate);
  d.setHours(hours, minutes, 0, 0);
  // Convert Dubai time back to UTC
  const utcMs = d.getTime() - DUBAI_OFFSET_HOURS * 3600000;
  return new Date(utcMs).toISOString();
}

/**
 * Get the current shift window (18:30 to 18:30 Dubai time).
 * Returns { startDate, endDate } as UTC ISO strings suitable for API calls.
 */
export function getCurrentShiftRange() {
  const dubaiNow = getDubaiNow();
  const currentHour = dubaiNow.getHours();
  const currentMinute = dubaiNow.getMinutes();

  let shiftStartDubai, shiftEndDubai;

  if (currentHour < 18 || (currentHour === 18 && currentMinute < 30)) {
    // Before 18:30 → shift = yesterday 18:30 to today 18:30
    shiftStartDubai = new Date(dubaiNow);
    shiftStartDubai.setDate(shiftStartDubai.getDate() - 1);
    shiftEndDubai = new Date(dubaiNow);
  } else {
    // After 18:30 → shift = today 18:30 to tomorrow 18:30
    shiftStartDubai = new Date(dubaiNow);
    shiftEndDubai = new Date(dubaiNow);
    shiftEndDubai.setDate(shiftEndDubai.getDate() + 1);
  }

  return {
    startDate: dubaiTimeToUTC(shiftStartDubai, 18, 30),
    endDate: dubaiTimeToUTC(shiftEndDubai, 18, 30),
  };
}

/**
 * Convert a calendar date range to shift-based range.
 * For a single day (e.g. Mar 7), returns Mar 6 18:30 to Mar 7 18:30 (Dubai time).
 * For a range (e.g. Mar 5-7), returns Mar 4 18:30 to Mar 7 18:30 (Dubai time).
 * @param {string} startDateStr - YYYY-MM-DD format date string
 * @param {string} endDateStr - YYYY-MM-DD format date string
 * @returns {{ startDate: string, endDate: string }} UTC ISO strings
 */
export function toShiftRange(startDateStr, endDateStr) {
  const normalizedStart = normalizeDateString(startDateStr);
  const normalizedEnd = normalizeDateString(endDateStr);

  if (!normalizedStart || !normalizedEnd) {
    throw new Error("Invalid date range provided to toShiftRange");
  }

  // Parse as Dubai-local dates
  const startParts = normalizedStart.split("-").map(Number);
  const endParts = normalizedEnd.split("-").map(Number);

  // Shift starts at 18:30 the day BEFORE the selected start date
  const shiftStartDubai = new Date(
    startParts[0],
    startParts[1] - 1,
    startParts[2] - 1,
  );
  // Shift ends at 18:30 on the selected end date
  const shiftEndDubai = new Date(endParts[0], endParts[1] - 1, endParts[2]);

  return {
    startDate: dubaiTimeToUTC(shiftStartDubai, 18, 30),
    endDate: dubaiTimeToUTC(shiftEndDubai, 18, 30),
  };
}

/**
 * Convert a calendar date range to full-day UTC range (00:00:00 to 23:59:59.999).
 * This is the standard non-shift range and should be used outside residence shift flows.
 * @param {string} startDateStr - YYYY-MM-DD format date string
 * @param {string} endDateStr - YYYY-MM-DD format date string
 * @returns {{ startDate: string, endDate: string }} UTC ISO strings
 */
export function toCalendarRange(startDateStr, endDateStr) {
  return {
    startDate: new Date(`${startDateStr}T00:00:00.000Z`).toISOString(),
    endDate: new Date(`${endDateStr}T23:59:59.999Z`).toISOString(),
  };
}

/**
 * Get the shift date label (the date the current shift counts towards).
 * @returns {string} YYYY-MM-DD format
 */
export function getShiftDate() {
  const dubaiNow = getDubaiNow();
  const currentHour = dubaiNow.getHours();
  const currentMinute = dubaiNow.getMinutes();

  // If after 18:30, the shift counts towards tomorrow
  if (currentHour > 18 || (currentHour === 18 && currentMinute >= 30)) {
    dubaiNow.setDate(dubaiNow.getDate() + 1);
  }

  const year = dubaiNow.getFullYear();
  const month = String(dubaiNow.getMonth() + 1).padStart(2, "0");
  const day = String(dubaiNow.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
