import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Loader2,
  Maximize2,
  Minimize2,
  Search,
  Trash2,
} from "lucide-react";
import { aiAssistantService } from "../../api/aiAssistantService";
import AiPaymentsResultTable from "./AiPaymentsResultTable";

const PROMPT_LIMIT = 20;

const getErrorMessage = (error) => {
  const apiMessage = error?.response?.data?.message;
  if (apiMessage) return apiMessage;

  if (error?.message) return error.message;

  return "Unable to complete the request. Please try again.";
};

const isObjectIdLike = (value) => {
  const text = String(value || "");
  return /^[0-9a-fA-F]{24}$/.test(text);
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatPeriodDate = (value) => formatDate(value) || "-";

const toReadableDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeStatus = (value) => {
  if (value === undefined || value === null) return "";
  const text = String(value).trim().toLowerCase();
  if (text === "1" || text === "active") return "Active";
  if (text === "0" || text === "inactive") return "Inactive";
  if (text === "2" || text === "deactivated") return "Deactivated";
  return String(value);
};

const formatMoney = (value) => {
  if (value === undefined || value === null || value === "") return "";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const displayValue = (value) => {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    if (isObjectIdLike(value)) {
      return "-";
    }

    const dateValue = formatDate(value);
    if (dateValue) {
      return dateValue;
    }

    if (value.length <= 120) return value;
    return `${value.slice(0, 120)}...`;
  }

  if (Array.isArray(value)) {
    const printable = value
      .map((item) => {
        if (typeof item === "string" && isObjectIdLike(item)) return "";
        if (typeof item === "object") return "";
        return String(item);
      })
      .filter(Boolean);

    if (printable.length > 0) {
      return printable.slice(0, 3).join(", ");
    }

    return `${value.length} item(s)`;
  }

  try {
    const encoded = JSON.stringify(value);
    if (encoded.length <= 120) return encoded;
    return `${encoded.slice(0, 120)}...`;
  } catch {
    return String(value);
  }
};

const buildWorkerFields = (record) => {
  return [
    { label: "Name", value: record.name },
    { label: "Mobile", value: record.mobile },
    { label: "Employee Code", value: record.employeeCode },
    { label: "Company", value: record.companyName },
    { label: "Role", value: record.role },
    { label: "Service Type", value: record.service_type },
    { label: "Status", value: normalizeStatus(record.status) },
    { label: "Email", value: record.email },
  ];
};

const buildStaffFields = (record) => {
  return [
    { label: "Name", value: record.name },
    { label: "Mobile", value: record.mobile },
    { label: "Employee Code", value: record.employeeCode },
    { label: "Company", value: record.companyName },
    { label: "Email", value: record.email },
    { label: "Passport", value: record.passportNumber },
    { label: "Visa", value: record.visaNumber },
    { label: "Emirates ID", value: record.emiratesId },
  ];
};

const buildCustomerFields = (record) => {
  const fullName = [record.firstName, record.lastName]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(" ");

  const vehicles = Array.isArray(record.vehicles) ? record.vehicles : [];
  const registrations = vehicles
    .map((vehicle) => vehicle?.registration_no)
    .filter(Boolean);

  return [
    { label: "Name", value: fullName },
    { label: "Mobile", value: record.mobile },
    { label: "Flat No", value: record.flat_no },
    { label: "Status", value: normalizeStatus(record.status) },
    {
      label: "Vehicles",
      value: vehicles.length ? String(vehicles.length) : "",
    },
    {
      label: "Vehicle Numbers",
      value: registrations.length ? registrations.slice(0, 3).join(", ") : "",
    },
    { label: "Notes", value: record.notes },
  ];
};

const buildPaymentFields = (record) => {
  return [
    {
      label: "Service",
      value:
        record.onewash || record.serviceCategory === "onewash"
          ? "One Wash"
          : "Residence",
    },
    { label: "Receipt", value: record.receipt_no },
    { label: "Status", value: record.status },
    { label: "Settled", value: record.settled },
    { label: "Amount Paid", value: formatMoney(record.amount_paid) },
    { label: "Total Amount", value: formatMoney(record.total_amount) },
    { label: "Balance", value: formatMoney(record.balance) },
    { label: "Vehicle No", value: record?.vehicle?.registration_no },
    { label: "Parking No", value: record?.vehicle?.parking_no },
    { label: "Collected Date", value: formatDate(record.collectedDate) },
  ];
};

const buildJobFields = (record) => {
  return [
    { label: "Status", value: record.status },
    { label: "Vehicle No", value: record.registration_no },
    { label: "Parking No", value: record.parking_no },
    { label: "Assigned Date", value: formatDate(record.assignedDate) },
    { label: "Completed Date", value: formatDate(record.completedDate) },
    { label: "Reason", value: record.rejectionReason },
  ];
};

const buildLocationFields = (record) => {
  return [{ label: "Address", value: record.address }];
};

const buildSiteFields = (record) => {
  return [{ label: "Site Name", value: record.name }];
};

const buildGenericFields = (record) => {
  if (!record || typeof record !== "object") return [];

  return Object.entries(record)
    .filter(([key, value]) => {
      if (
        [
          "_id",
          "id",
          "password",
          "hPassword",
          "createdBy",
          "updatedBy",
          "deletedBy",
          "isDeleted",
          "__v",
        ].includes(key)
      ) {
        return false;
      }

      if (typeof value === "string" && isObjectIdLike(value)) {
        return false;
      }

      return true;
    })
    .slice(0, 8)
    .map(([key, value]) => ({
      label: key
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (letter) => letter.toUpperCase()),
      value,
    }));
};

const buildFieldsForRecord = (domain, record) => {
  if (domain === "workers") return buildWorkerFields(record);
  if (domain === "staff") return buildStaffFields(record);
  if (domain === "customers") return buildCustomerFields(record);
  if (domain === "payments") return buildPaymentFields(record);
  if (domain === "jobs") return buildJobFields(record);
  if (domain === "locations") return buildLocationFields(record);
  if (domain === "sites") return buildSiteFields(record);

  return buildGenericFields(record);
};

const buildTableModel = (domain, rows = []) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length) {
    return { columns: [], tableRows: [] };
  }

  const sampleFields = keepDisplayableFields(
    buildFieldsForRecord(domain, safeRows[0]),
  );
  const labels = sampleFields.map((field) => field.label).slice(0, 8);

  const columns = labels.map((label) => ({
    key: label,
    header: label,
    accessor: label,
    render: (row) => (
      <span className="text-xs font-medium text-slate-700">
        {row[label] || "-"}
      </span>
    ),
  }));

  const tableRows = safeRows.map((record, index) => {
    const fields = keepDisplayableFields(buildFieldsForRecord(domain, record));
    const valueMap = new Map(fields.map((field) => [field.label, field.shown]));

    const rowData = {
      id: record._id || record.id || `${domain}-${index}`,
    };

    labels.forEach((label) => {
      rowData[label] = valueMap.get(label) || "-";
    });

    return rowData;
  });

  return { columns, tableRows };
};

const toGroupPagination = (group, fallbackLimit = PROMPT_LIMIT) => {
  if (!group || !group.pagination) return null;

  const limit = Number(group.pagination.limit || fallbackLimit);
  const total = Number(group.total || group.pagination.total || 0);
  const page = Number(group.pagination.page || 1);
  const totalPages = Number(
    group.pagination.totalPages || Math.ceil(total / Math.max(1, limit)) || 1,
  );

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage:
      group.pagination.hasNextPage !== undefined
        ? group.pagination.hasNextPage
        : page < totalPages,
    hasPrevPage:
      group.pagination.hasPrevPage !== undefined
        ? group.pagination.hasPrevPage
        : page > 1,
    displayTotal: total,
  };
};

const keepDisplayableFields = (items = []) => {
  return items
    .map((item) => ({ ...item, shown: displayValue(item.value) }))
    .filter((item) => item.shown && item.shown !== "-");
};

const createMessage = (payload) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  createdAt: new Date().toISOString(),
  ...payload,
});

const STORAGE_KEY_PREFIX = "bcw.ai.assistant.chat.v1";
const MAX_STORED_MESSAGES = 200;

const createInitialMessages = () => [
  createMessage({
    role: "assistant",
    type: "text",
    text: "Ask for people or payment records (e.g. payments more than 20 AED this month, or customer Ravi payments).",
  }),
];

const getChatStorageKey = () => {
  try {
    if (typeof window === "undefined") {
      return `${STORAGE_KEY_PREFIX}.default`;
    }

    const userString = window.localStorage.getItem("user");
    if (!userString) {
      return `${STORAGE_KEY_PREFIX}.default`;
    }

    const user = JSON.parse(userString);
    const userId = String(user?._id || user?.id || user?.number || "default");
    return `${STORAGE_KEY_PREFIX}.${userId}`;
  } catch {
    return `${STORAGE_KEY_PREFIX}.default`;
  }
};

const sanitizeLoadedMessages = (loadedMessages = []) => {
  if (!Array.isArray(loadedMessages)) {
    return [];
  }

  return loadedMessages
    .filter((message) => message && typeof message === "object")
    .filter(
      (message) =>
        (message.role === "assistant" || message.role === "user") &&
        typeof message.text === "string",
    )
    .map((message) => ({
      ...message,
      id:
        typeof message.id === "string"
          ? message.id
          : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt:
        typeof message.createdAt === "string"
          ? message.createdAt
          : new Date().toISOString(),
    }))
    .slice(-MAX_STORED_MESSAGES);
};

const loadSavedMessages = (storageKey) => {
  try {
    if (typeof window === "undefined") {
      return createInitialMessages();
    }

    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return createInitialMessages();
    }

    const parsed = JSON.parse(raw);
    const sanitized = sanitizeLoadedMessages(parsed);

    return sanitized.length ? sanitized : createInitialMessages();
  } catch {
    return createInitialMessages();
  }
};

const saveMessages = (storageKey, messages) => {
  try {
    if (typeof window === "undefined") {
      return;
    }

    const compact = Array.isArray(messages)
      ? messages.slice(-MAX_STORED_MESSAGES)
      : [];

    window.localStorage.setItem(storageKey, JSON.stringify(compact));
  } catch {
    // Ignore persistence failures and keep chat functional.
  }
};

const appendMessage = (previousMessages, newMessage) => {
  return [...previousMessages, newMessage].slice(-MAX_STORED_MESSAGES);
};

const buildAssistantSummary = (response) => {
  const backendText = String(response?.text || "").trim();
  if (backendText) {
    return backendText;
  }

  const total = Number(response?.total || 0);
  const categories = Number(response?.matchedDomains || 0);

  if (total <= 0) {
    return "I could not find matching records. Try full name, mobile number, or a more specific query.";
  }

  return `I found ${total} matching record(s) across ${categories} categor${
    categories === 1 ? "y" : "ies"
  }.`;
};

const createAssistantResultMessage = (response) =>
  createMessage({
    role: "assistant",
    type: "result",
    text: buildAssistantSummary(response),
    payload: enrichResponsePayload(response),
  });

const resolvePaymentsNavigation = (payload, label = "") => {
  const navigation = payload?.navigation;
  if (!navigation || typeof navigation !== "object") {
    return null;
  }

  const isOneWash = String(label || "")
    .toLowerCase()
    .includes("one wash");
  return isOneWash ? navigation.onewash : navigation.residence;
};

const PAYMENT_INTENT_PATTERN =
  /(payment|payments|apyment|apyments|receipt|due|dues|settlement|onewash|one wash|residence)/i;
const CONTEXT_PRONOUN_PATTERN = /\b(his|her|their|that|this|him|them)\b/i;
const CONTEXT_RESET_PATTERN =
  /\b(change|switch|reset|clear)\s+(the\s+)?person\b|\banother\s+person\b|\bdifferent\s+person\b/i;
const PERSON_RESULT_DOMAINS = new Set(["customers", "workers", "staff"]);
const COMMAND_AFFIRMATIVE_PATTERN =
  /^(yes|y|ok|okay|sure|continue|proceed|go ahead|go|next)(?:\s+please)?$/i;

const MONTH_MAP = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const FOLLOWUP_PERIOD_ACTIONS = [
  { key: "last_25_days", label: "Show last 25 days" },
  { key: "last_30_days", label: "Show last 30 days" },
  { key: "current_month", label: "Show this month" },
  { key: "previous_month", label: "Show last month" },
];

const resolvePromptPeriod = (prompt = "") => {
  const text = String(prompt || "").toLowerCase();

  if (/last\s*25|25\s*days/.test(text)) return "last_25_days";
  if (/last\s*30|30\s*days/.test(text)) return "last_30_days";
  if (/this\s*month|current\s*month/.test(text)) return "current_month";
  if (/last\s*month|previous\s*month/.test(text)) return "previous_month";

  return "";
};

const toDateOnlyString = (dateInput) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateByDayMonthYear = (token = "", referenceDate = new Date()) => {
  const cleaned = String(token || "")
    .toLowerCase()
    .replace(/,/g, " ")
    .replace(/\b(on|the|of|date|day|days)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return null;
  }

  if (["today", "today date", "todays date", "now"].includes(cleaned)) {
    return new Date(referenceDate);
  }

  if (cleaned === "yesterday") {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() - 1);
    return date;
  }

  if (cleaned === "tomorrow") {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() + 1);
    return date;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    const date = new Date(cleaned);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dayMonthMatch = cleaned.match(
    /^(\d{1,2})(?:st|nd|rd|th)?[\/-](\d{1,2})(?:[\/-](\d{2,4}))?$/,
  );
  if (dayMonthMatch) {
    const day = Number(dayMonthMatch[1]);
    const month = Number(dayMonthMatch[2]) - 1;
    const yearRaw = dayMonthMatch[3];
    const year = yearRaw
      ? Number(yearRaw.length === 2 ? `20${yearRaw}` : yearRaw)
      : referenceDate.getFullYear();

    const date = new Date(year, month, day);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    if (
      !yearRaw &&
      date.getTime() >
        new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth(),
          referenceDate.getDate() + 1,
        ).getTime()
    ) {
      date.setFullYear(date.getFullYear() - 1);
    }

    return date;
  }

  const monthDayMatch = cleaned.match(
    /^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?$/,
  );
  if (monthDayMatch) {
    const monthWord = monthDayMatch[1];
    const month = MONTH_MAP[monthWord];
    if (month === undefined) {
      return null;
    }

    const day = Number(monthDayMatch[2]);
    const hasYear = Boolean(monthDayMatch[3]);
    const year = hasYear
      ? Number(monthDayMatch[3])
      : referenceDate.getFullYear();

    const date = new Date(year, month, day);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    if (
      !hasYear &&
      date.getTime() >
        new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth(),
          referenceDate.getDate() + 1,
        ).getTime()
    ) {
      date.setFullYear(date.getFullYear() - 1);
    }

    return date;
  }

  const dayMonthWordMatch = cleaned.match(
    /^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)(?:\s+(\d{4}))?$/,
  );
  if (dayMonthWordMatch) {
    const day = Number(dayMonthWordMatch[1]);
    const monthWord = dayMonthWordMatch[2];
    const month = MONTH_MAP[monthWord];
    if (month === undefined) {
      return null;
    }

    const hasYear = Boolean(dayMonthWordMatch[3]);
    const year = hasYear
      ? Number(dayMonthWordMatch[3])
      : referenceDate.getFullYear();

    const date = new Date(year, month, day);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    if (
      !hasYear &&
      date.getTime() >
        new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth(),
          referenceDate.getDate() + 1,
        ).getTime()
    ) {
      date.setFullYear(date.getFullYear() - 1);
    }

    return date;
  }

  const parsed = new Date(cleaned);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const resolvePromptDateRange = (prompt = "", referenceDate = new Date()) => {
  const text = String(prompt || "")
    .toLowerCase()
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return null;
  }

  const betweenMatch = text.match(/\bbetween\s+(.+?)\s+and\s+(.+)$/i);
  const fromMatch = text.match(
    /\bfrom\s+(.+?)\s+(?:to|till|until|-|upto|up to)\s+(.+)$/i,
  );
  const plainMatch = text.match(
    /\b(.+?)\s+(?:to|till|until|-|upto|up to)\s+(.+)$/i,
  );

  const tokenPair = betweenMatch || fromMatch || plainMatch;
  if (!tokenPair) {
    return null;
  }

  const startDate = parseDateByDayMonthYear(tokenPair[1], referenceDate);
  const endDate = parseDateByDayMonthYear(tokenPair[2], referenceDate);

  if (!startDate || !endDate || endDate.getTime() < startDate.getTime()) {
    return null;
  }

  return {
    startDate: toDateOnlyString(startDate),
    endDate: toDateOnlyString(endDate),
  };
};

const resolvePromptRelativeRange = (prompt = "") => {
  const text = String(prompt || "").toLowerCase();
  const match = text.match(/\blast\s+(\d{1,3})\s+days?\b/i);
  if (!match) {
    return null;
  }

  const days = Number(match[1]);
  if (!Number.isFinite(days) || days <= 0 || days > 365) {
    return null;
  }

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  return {
    startDate: toDateOnlyString(start),
    endDate: toDateOnlyString(end),
  };
};

const parseCommandIndex = (prompt = "") => {
  const text = String(prompt || "")
    .trim()
    .toLowerCase();
  if (!text) {
    return 0;
  }

  const match = text.match(
    /^(?:do|choose|select|pick|option)?\s*#?\s*(\d{1,2})$/i,
  );
  if (!match) {
    return 0;
  }

  return Number(match[1]);
};

const isAffirmativeCommand = (prompt = "") =>
  COMMAND_AFFIRMATIVE_PATTERN.test(String(prompt || "").trim());

const normalizePersonContext = (person = {}) => {
  const domain = String(person.domain || "")
    .trim()
    .toLowerCase();
  const id = String(person.id || person._id || "").trim();

  if (!domain || !id || !PERSON_RESULT_DOMAINS.has(domain)) {
    return null;
  }

  return {
    domain,
    id,
    label: String(person.label || domain),
    name: String(person.name || "").trim(),
    mobile: String(person.mobile || "").trim(),
  };
};

const normalizeConversationAction = (action = {}) => {
  const type = String(action?.type || "")
    .trim()
    .toLowerCase();

  if (!type) {
    return null;
  }

  if (type === "select-person") {
    const person = normalizePersonContext(action.person);
    if (!person) return null;
    return { type, person };
  }

  if (type === "select-period") {
    const person = normalizePersonContext(action.person);
    const period = String(action.period || action.periodKey || "").trim();
    if (!person || !period) return null;

    return {
      type,
      person,
      period,
      periodLabel: String(action.periodLabel || "").trim(),
    };
  }

  if (type === "apply-date-range") {
    const person = normalizePersonContext(action.person);
    const startDate = toDateOnlyString(action.startDate);
    const endDate = toDateOnlyString(action.endDate);
    if (!person || !startDate || !endDate) return null;

    return {
      type,
      person,
      startDate,
      endDate,
    };
  }

  if (type === "ask-prompt") {
    const prompt = String(action.prompt || "").trim();
    if (!prompt) return null;
    return { type, prompt };
  }

  return null;
};

const buildFollowUpActions = (response = {}) => {
  const mode = String(response?.mode || "")
    .trim()
    .toLowerCase();
  if (mode !== "person-payments" || response?.requiresSelection) {
    return [];
  }

  const selectedPerson = normalizePersonContext(response?.selectedPerson || {});
  if (!selectedPerson) {
    return [];
  }

  const currentPeriodKey = String(response?.selectedPeriod?.key || "")
    .trim()
    .toLowerCase();

  return FOLLOWUP_PERIOD_ACTIONS.filter(
    (option) => option.key !== currentPeriodKey,
  )
    .slice(0, 3)
    .map((option) => ({
      label: option.label,
      promptText: option.label,
      action: {
        type: "select-period",
        person: selectedPerson,
        period: option.key,
        periodLabel: option.label,
      },
    }));
};

const enrichResponsePayload = (response = {}) => {
  const followUpActions = buildFollowUpActions(response);
  if (!followUpActions.length) {
    return response;
  }

  return {
    ...response,
    conversationActions: followUpActions,
    conversationHint:
      "Try a next step below. You can also type yes, do 1, do 2.",
  };
};

const toActionEntriesFromPayload = (payload = {}) => {
  const explicitActions = Array.isArray(payload?.conversationActions)
    ? payload.conversationActions
    : [];

  const normalizedExplicit = explicitActions
    .map((entry) => {
      const normalizedAction = normalizeConversationAction(entry?.action || {});
      if (!normalizedAction) {
        return null;
      }

      return {
        label: String(entry?.label || "").trim() || "Run action",
        action: normalizedAction,
      };
    })
    .filter(Boolean);

  if (normalizedExplicit.length) {
    return normalizedExplicit;
  }

  const suggestions = Array.isArray(payload?.suggestions)
    ? payload.suggestions
    : [];
  const suggestionActions = suggestions
    .map((person) => {
      const normalizedPerson = normalizePersonContext(person);
      if (!normalizedPerson) {
        return null;
      }

      return {
        label: `Select ${normalizedPerson.name || "person"}`,
        action: {
          type: "select-person",
          person: normalizedPerson,
        },
      };
    })
    .filter(Boolean);

  if (suggestionActions.length) {
    return suggestionActions;
  }

  const periodOptions = Array.isArray(payload?.periodOptions)
    ? payload.periodOptions
    : [];
  const selectedPerson = normalizePersonContext(payload?.selectedPerson || {});
  if (!selectedPerson || !periodOptions.length) {
    return [];
  }

  return periodOptions
    .map((option) => {
      const period = String(option?.key || "").trim();
      if (!period) return null;

      const label = String(option?.label || option?.key || "").trim();
      return {
        label: label || "Select period",
        action: {
          type: "select-period",
          person: selectedPerson,
          period,
          periodLabel: label,
        },
      };
    })
    .filter(Boolean);
};

const findLatestActionEntries = (messages = []) => {
  if (!Array.isArray(messages) || !messages.length) {
    return [];
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "assistant") {
      continue;
    }

    const entries = toActionEntriesFromPayload(message?.payload || {});
    if (entries.length) {
      return entries;
    }
  }

  return [];
};

const resolveCommandAction = ({ prompt = "", messages = [] }) => {
  const entries = findLatestActionEntries(messages);
  if (!entries.length) {
    return null;
  }

  const choiceIndex = parseCommandIndex(prompt);
  if (choiceIndex > 0 && entries[choiceIndex - 1]) {
    return entries[choiceIndex - 1];
  }

  if (isAffirmativeCommand(prompt)) {
    return entries[0] || null;
  }

  return null;
};

const getPersonNameFromRecord = (domain = "", record = {}) => {
  if (domain === "customers") {
    return [record.firstName, record.lastName]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(" ");
  }

  return String(record.name || "").trim();
};

const extractPersonFromRecord = (domain = "", record = {}) => {
  if (!PERSON_RESULT_DOMAINS.has(String(domain || "").toLowerCase())) {
    return null;
  }

  return normalizePersonContext({
    domain,
    id: record._id || record.id,
    label: domain,
    name: getPersonNameFromRecord(domain, record),
    mobile: record.mobile || record.number,
  });
};

const extractSinglePersonCandidate = (payload = {}) => {
  const selectedPerson = normalizePersonContext(payload?.selectedPerson || {});
  if (selectedPerson) {
    return selectedPerson;
  }

  const suggestions = Array.isArray(payload?.suggestions)
    ? payload.suggestions
    : [];
  if (suggestions.length === 1) {
    const oneSuggestion = normalizePersonContext(suggestions[0]);
    if (oneSuggestion) {
      return oneSuggestion;
    }
  }

  const results = Array.isArray(payload?.results) ? payload.results : [];
  const people = [];

  results.forEach((group) => {
    const groupDomain = String(group?.domain || "")
      .trim()
      .toLowerCase();
    if (!PERSON_RESULT_DOMAINS.has(groupDomain)) {
      return;
    }

    const groupRows = Array.isArray(group?.data) ? group.data : [];
    groupRows.forEach((row) => {
      const person = extractPersonFromRecord(groupDomain, row);
      if (person) {
        people.push(person);
      }
    });
  });

  return people.length === 1 ? people[0] : null;
};

const findLastPersonContextFromMessages = (messages = []) => {
  if (!Array.isArray(messages)) {
    return null;
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const payload = message?.payload;
    if (!payload || typeof payload !== "object") {
      continue;
    }

    const person = extractSinglePersonCandidate(payload);
    if (person) {
      return person;
    }
  }

  return null;
};

const shouldUseConversationContext = ({ prompt = "", lastPerson = null }) => {
  if (!lastPerson) {
    return false;
  }

  const text = String(prompt || "").trim();
  if (!text) {
    return false;
  }

  if (CONTEXT_RESET_PATTERN.test(text)) {
    return false;
  }

  const hasExplicitGlobalFilter =
    /\b(building|buildings|buildinging|bulding|mall|malls|location|locations|area|address|status|completed|pending|cancelled|canceled|cash|card|bank|transfer|payment\s+mode|worker|customer|staff)\b/i.test(
      text,
    );

  const hasStrongContextPronoun = /\b(his|her|their|him|them)\b/i.test(text);

  if (hasExplicitGlobalFilter && !hasStrongContextPronoun) {
    return false;
  }

  if (!PAYMENT_INTENT_PATTERN.test(text)) {
    return Boolean(
      resolvePromptPeriod(text) ||
      resolvePromptDateRange(text) ||
      resolvePromptRelativeRange(text),
    );
  }

  const hasRoleKeyword = /\b(customer|worker|staff|employee|client)\b/i.test(
    text,
  );
  const forToken = text.match(/\bfor\s+([a-z]{2,})\b/i);
  const hasExplicitForName = Boolean(
    forToken && !["him", "her", "them", "this", "that"].includes(forToken[1]),
  );

  if (hasRoleKeyword || hasExplicitForName) {
    return false;
  }

  if (!CONTEXT_PRONOUN_PATTERN.test(text)) {
    const hasDateFollowUp = Boolean(
      resolvePromptPeriod(text) ||
      resolvePromptDateRange(text) ||
      resolvePromptRelativeRange(text),
    );

    if (hasDateFollowUp) {
      return true;
    }
  }

  const hasExplicitIdentity =
    /\b\d{6,}\b/.test(text) || /["'][^"']{2,}["']/.test(text);

  if (hasExplicitIdentity) {
    return false;
  }

  if (
    resolvePromptPeriod(text) ||
    resolvePromptDateRange(text) ||
    resolvePromptRelativeRange(text)
  ) {
    return true;
  }

  if (/\b(same|continue|again|previous)\b/i.test(text)) {
    return true;
  }

  const tokenCount = text.split(/\s+/).filter(Boolean).length;
  if (PAYMENT_INTENT_PATTERN.test(text) && tokenCount <= 6) {
    return true;
  }

  return Boolean(CONTEXT_PRONOUN_PATTERN.test(text));
};

const AiAssistantPage = () => {
  const chatStorageKey = useMemo(() => getChatStorageKey(), []);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() =>
    loadSavedMessages(chatStorageKey),
  );
  const [lastPersonContext, setLastPersonContext] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chatRef = useRef(null);
  const pageShellRef = useRef(null);

  useEffect(() => {
    saveMessages(chatStorageKey, messages);
  }, [chatStorageKey, messages]);

  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, isSearching]);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === pageShellRef.current);
    };

    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, []);

  const assistantMessages = useMemo(
    () => messages.filter((message) => message.role === "assistant"),
    [messages],
  );

  useEffect(() => {
    const restoredPerson = findLastPersonContextFromMessages(messages);
    if (!restoredPerson) {
      return;
    }

    setLastPersonContext((previous) => {
      if (
        previous &&
        previous.domain === restoredPerson.domain &&
        previous.id === restoredPerson.id
      ) {
        return previous;
      }

      return restoredPerson;
    });
  }, [messages]);

  const runPromptSearch = async () => {
    const trimmedPrompt = String(input || "").trim();
    if (!trimmedPrompt) {
      return;
    }

    if (isSearching) return;

    const isContextResetPrompt = CONTEXT_RESET_PATTERN.test(trimmedPrompt);

    const userMessage = createMessage({
      role: "user",
      type: "text",
      text: trimmedPrompt,
    });

    setMessages((previous) => appendMessage(previous, userMessage));
    setInput("");

    if (isContextResetPrompt) {
      setLastPersonContext(null);
      setMessages((previous) =>
        appendMessage(
          previous,
          createMessage({
            role: "assistant",
            type: "text",
            text: "Person context cleared. Tell customer, worker, or staff name/mobile to continue.",
          }),
        ),
      );
      return;
    }

    setIsSearching(true);

    try {
      let response = null;
      let fallbackPerson = null;

      const actionEntry = resolveCommandAction({
        prompt: trimmedPrompt,
        messages,
      });

      if (actionEntry?.action) {
        const action = normalizeConversationAction(actionEntry.action);

        if (action?.type === "select-person") {
          fallbackPerson = action.person;
          response = await aiAssistantService.getPersonPayments({
            person: action.person,
          });
        } else if (action?.type === "select-period") {
          fallbackPerson = action.person;
          response = await aiAssistantService.getPersonPayments({
            person: action.person,
            period: action.period,
          });
        } else if (action?.type === "apply-date-range") {
          fallbackPerson = action.person;
          response = await aiAssistantService.getPersonPayments({
            person: action.person,
            startDate: action.startDate,
            endDate: action.endDate,
          });
        } else if (action?.type === "ask-prompt") {
          response = await aiAssistantService.askPrompt(
            action.prompt,
            PROMPT_LIMIT,
          );
        }
      }

      if (!response) {
        const useContext = shouldUseConversationContext({
          prompt: trimmedPrompt,
          lastPerson: lastPersonContext,
        });

        if (useContext) {
          const period = resolvePromptPeriod(trimmedPrompt);
          const customRange =
            resolvePromptDateRange(trimmedPrompt) ||
            resolvePromptRelativeRange(trimmedPrompt);

          fallbackPerson = lastPersonContext;

          response = await aiAssistantService.getPersonPayments({
            person: lastPersonContext,
            ...(period ? { period } : {}),
            ...(customRange
              ? {
                  startDate: customRange.startDate,
                  endDate: customRange.endDate,
                }
              : {}),
          });
        } else {
          response = await aiAssistantService.askPrompt(
            trimmedPrompt,
            PROMPT_LIMIT,
          );
        }
      }

      const resolvedPerson =
        extractSinglePersonCandidate(response) || fallbackPerson;
      if (resolvedPerson) {
        setLastPersonContext(resolvedPerson);
      }

      setMessages((previous) =>
        appendMessage(previous, createAssistantResultMessage(response)),
      );
    } catch (searchError) {
      const assistantMessage = createMessage({
        role: "assistant",
        type: "error",
        text: getErrorMessage(searchError),
      });

      setMessages((previous) => appendMessage(previous, assistantMessage));
    } finally {
      setIsSearching(false);
    }
  };

  const handlePersonSelection = async (person) => {
    if (!person || isSearching) return;

    const normalizedPerson = normalizePersonContext(person);

    const displayName = String(person.name || "person").trim();
    const displayMobile = String(person.mobile || "").trim();

    setMessages((previous) =>
      appendMessage(
        previous,
        createMessage({
          role: "user",
          type: "text",
          text: `Select ${displayName}${displayMobile ? ` (${displayMobile})` : ""}`,
        }),
      ),
    );

    setIsSearching(true);
    if (normalizedPerson) {
      setLastPersonContext(normalizedPerson);
    }

    try {
      const response = await aiAssistantService.getPersonPayments({ person });
      const resolvedPerson =
        extractSinglePersonCandidate(response) || normalizedPerson;
      if (resolvedPerson) {
        setLastPersonContext(resolvedPerson);
      }

      setMessages((previous) =>
        appendMessage(previous, createAssistantResultMessage(response)),
      );
    } catch (searchError) {
      setMessages((previous) =>
        appendMessage(
          previous,
          createMessage({
            role: "assistant",
            type: "error",
            text: getErrorMessage(searchError),
          }),
        ),
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handlePeriodSelection = async (person, periodOption) => {
    if (!person || !periodOption || isSearching) return;

    const normalizedPerson = normalizePersonContext(person);

    setMessages((previous) =>
      appendMessage(
        previous,
        createMessage({
          role: "user",
          type: "text",
          text: `Select ${periodOption.label || periodOption.key}`,
        }),
      ),
    );

    setIsSearching(true);
    if (normalizedPerson) {
      setLastPersonContext(normalizedPerson);
    }

    try {
      const response = await aiAssistantService.getPersonPayments({
        person,
        period: periodOption.key,
      });

      const resolvedPerson =
        extractSinglePersonCandidate(response) || normalizedPerson;
      if (resolvedPerson) {
        setLastPersonContext(resolvedPerson);
      }

      setMessages((previous) =>
        appendMessage(previous, createAssistantResultMessage(response)),
      );
    } catch (searchError) {
      setMessages((previous) =>
        appendMessage(
          previous,
          createMessage({
            role: "assistant",
            type: "error",
            text: getErrorMessage(searchError),
          }),
        ),
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleInlineDateRangeApply = async ({ person, startDate, endDate }) => {
    if (!person || !startDate || !endDate || isSearching) {
      return;
    }

    const normalizedPerson = normalizePersonContext(person);

    setMessages((previous) =>
      appendMessage(
        previous,
        createMessage({
          role: "user",
          type: "text",
          text: `Apply date range ${toReadableDate(startDate)} - ${toReadableDate(endDate)}`,
        }),
      ),
    );

    setIsSearching(true);
    if (normalizedPerson) {
      setLastPersonContext(normalizedPerson);
    }

    try {
      const response = await aiAssistantService.getPersonPayments({
        person,
        startDate,
        endDate,
      });

      const resolvedPerson =
        extractSinglePersonCandidate(response) || normalizedPerson;
      if (resolvedPerson) {
        setLastPersonContext(resolvedPerson);
      }

      setMessages((previous) =>
        appendMessage(previous, createAssistantResultMessage(response)),
      );
    } catch (searchError) {
      setMessages((previous) =>
        appendMessage(
          previous,
          createMessage({
            role: "assistant",
            type: "error",
            text: getErrorMessage(searchError),
          }),
        ),
      );
    } finally {
      setIsSearching(false);
    }
  };

  const updateMessageGroup = (messageId, targetGroup, updatedGroup) => {
    setMessages((previous) =>
      previous.map((message) => {
        if (message.id !== messageId) return message;
        const payload = message.payload;
        if (!payload || !Array.isArray(payload.results)) return message;

        const results = payload.results.map((group) => {
          if (
            group.domain === targetGroup.domain &&
            group.label === targetGroup.label
          ) {
            return { ...group, ...updatedGroup };
          }

          return group;
        });

        return { ...message, payload: { ...payload, results } };
      }),
    );
  };

  const handleGroupPageChange = async ({
    messageId,
    group,
    page,
    parentKeyword,
  }) => {
    if (isSearching) return;

    setIsSearching(true);
    try {
      let response = null;
      const limit = Number(group.pagination?.limit || PROMPT_LIMIT);

      if (group.domain === "payments" && group.pageInfo?.action) {
        response = await aiAssistantService.getPaymentsPage({
          serviceCategory: group.pageInfo.serviceCategory,
          search: group.pageInfo.search,
          filters: group.pageInfo.filters,
          page,
          limit,
        });
      } else {
        const query = String(group.keyword || parentKeyword || "").trim();
        response = await aiAssistantService.search({
          domain: group.domain,
          query,
          filters: group.filters || {},
          page,
          limit,
        });
      }

      if (!response) return;

      updateMessageGroup(messageId, group, {
        ...response,
        data: Array.isArray(response.data) ? response.data : [],
        total: Number(response.total || group.total || 0),
        pagination: response.pagination || group.pagination,
      });
    } catch (error) {
      console.error("Failed to load page", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConversationAction = async (entry, optionIndex) => {
    const action = normalizeConversationAction(entry?.action || {});
    if (!action || isSearching) {
      return;
    }

    const optionText = Number.isFinite(optionIndex)
      ? `Do ${optionIndex}`
      : "Continue";

    setMessages((previous) =>
      appendMessage(
        previous,
        createMessage({
          role: "user",
          type: "text",
          text: optionText,
        }),
      ),
    );

    setIsSearching(true);

    try {
      let response = null;
      let fallbackPerson = null;

      if (action.type === "select-person") {
        fallbackPerson = action.person;
        response = await aiAssistantService.getPersonPayments({
          person: action.person,
        });
      } else if (action.type === "select-period") {
        fallbackPerson = action.person;
        response = await aiAssistantService.getPersonPayments({
          person: action.person,
          period: action.period,
        });
      } else if (action.type === "apply-date-range") {
        fallbackPerson = action.person;
        response = await aiAssistantService.getPersonPayments({
          person: action.person,
          startDate: action.startDate,
          endDate: action.endDate,
        });
      } else if (action.type === "ask-prompt") {
        response = await aiAssistantService.askPrompt(
          action.prompt,
          PROMPT_LIMIT,
        );
      }

      if (!response) {
        return;
      }

      const resolvedPerson =
        extractSinglePersonCandidate(response) || fallbackPerson;
      if (resolvedPerson) {
        setLastPersonContext(resolvedPerson);
      }

      setMessages((previous) =>
        appendMessage(previous, createAssistantResultMessage(response)),
      );
    } catch (searchError) {
      setMessages((previous) =>
        appendMessage(
          previous,
          createMessage({
            role: "assistant",
            type: "error",
            text: getErrorMessage(searchError),
          }),
        ),
      );
    } finally {
      setIsSearching(false);
    }
  };

  const clearChat = () => {
    setMessages(createInitialMessages());
    setLastPersonContext(null);
    setInput("");
  };

  const toggleFullscreen = async () => {
    if (!pageShellRef.current) {
      return;
    }

    try {
      if (document.fullscreenElement === pageShellRef.current) {
        await document.exitFullscreen();
        return;
      }

      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      await pageShellRef.current.requestFullscreen();
    } catch (_) {
      // Ignore fullscreen API failures (browser policy / unsupported context).
    }
  };

  return (
    <div
      className={`bg-gradient-to-br from-emerald-50 via-white to-sky-50 ${
        isFullscreen ? "h-screen p-0" : "min-h-[calc(100vh-88px)] p-4 md:p-6"
      }`}
    >
      <div className={`mx-auto ${isFullscreen ? "max-w-full" : "max-w-7xl"}`}>
        <section
          ref={pageShellRef}
          className={`overflow-hidden bg-white ${
            isFullscreen
              ? "h-screen rounded-none border-0 shadow-none"
              : "rounded-3xl border border-slate-200 shadow-sm"
          }`}
        >
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-5 text-white md:px-7">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <Bot size={22} />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-wide md:text-2xl">
                  AI Assistant Chat
                </h1>
                <p className="mt-1 text-sm text-slate-200">
                  Ask naturally and get clean details from your database.
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/90 transition-colors hover:bg-white/10"
                >
                  {isFullscreen ? (
                    <Minimize2 size={14} />
                  ) : (
                    <Maximize2 size={14} />
                  )}
                  {isFullscreen ? "Exit Full" : "Full Screen"}
                </button>

                <button
                  type="button"
                  onClick={clearChat}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/90 transition-colors hover:bg-white/10"
                >
                  <Trash2 size={14} />
                  Clear Chat
                </button>
              </div>
            </div>
          </div>

          <div
            className={`flex flex-col ${
              isFullscreen
                ? "h-[calc(100vh-112px)] min-h-0"
                : "h-[calc(100vh-220px)] min-h-[520px]"
            }`}
          >
            <div
              ref={chatRef}
              className="flex-1 min-h-0 overflow-y-auto bg-slate-50 p-4 md:p-6"
            >
              <div className="space-y-4">
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  const groups = Array.isArray(message?.payload?.results)
                    ? message.payload.results
                    : [];
                  const suggestions = Array.isArray(
                    message?.payload?.suggestions,
                  )
                    ? message.payload.suggestions
                    : [];
                  const periodOptions = Array.isArray(
                    message?.payload?.periodOptions,
                  )
                    ? message.payload.periodOptions
                    : [];
                  const selectedPerson =
                    message?.payload?.selectedPerson &&
                    typeof message.payload.selectedPerson === "object"
                      ? message.payload.selectedPerson
                      : null;
                  const paymentSummary =
                    message?.payload?.summary &&
                    typeof message.payload.summary === "object"
                      ? message.payload.summary
                      : null;
                  const selectedPeriod =
                    message?.payload?.selectedPeriod &&
                    typeof message.payload.selectedPeriod === "object"
                      ? message.payload.selectedPeriod
                      : null;
                  const conversationHint = String(
                    message?.payload?.conversationHint || "",
                  ).trim();
                  const conversationActions = toActionEntriesFromPayload(
                    message?.payload || {},
                  );

                  return (
                    <article
                      key={message.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-sm ${
                          isUser
                            ? "max-w-[92%] bg-slate-900 text-white md:max-w-[85%]"
                            : message.type === "error"
                              ? "max-w-[92%] border border-rose-200 bg-rose-50 text-rose-700 md:max-w-[85%]"
                              : message.type === "result"
                                ? "w-full max-w-full border border-slate-200 bg-white text-slate-800"
                                : "max-w-[92%] border border-slate-200 bg-white text-slate-800 md:max-w-[85%]"
                        }`}
                      >
                        <p className="text-sm font-medium leading-6">
                          {message.text}
                        </p>

                        {!isUser && message.type === "result" && (
                          <div className="mt-3 space-y-3">
                            {suggestions.length > 0 && (
                              <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                  Suggestions
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {suggestions.map((person, personIndex) => (
                                    <button
                                      key={`${message.id}-person-${person.domain}-${person.id}-${personIndex}`}
                                      type="button"
                                      disabled={isSearching}
                                      onClick={() =>
                                        handlePersonSelection(person)
                                      }
                                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:border-emerald-500 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <span className="block font-semibold text-slate-800">
                                        {personIndex + 1}.{" "}
                                        {person.name || "Unnamed"}
                                      </span>
                                      <span className="block text-[11px] text-slate-500">
                                        {person.mobile || "No mobile"} •{" "}
                                        {person.label || person.domain}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </section>
                            )}

                            {periodOptions.length > 0 && selectedPerson && (
                              <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                  Select Duration for {selectedPerson.name}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {periodOptions.map((option, optionIndex) => (
                                    <button
                                      key={`${message.id}-period-${option.key}-${optionIndex}`}
                                      type="button"
                                      disabled={isSearching}
                                      onClick={() =>
                                        handlePeriodSelection(
                                          selectedPerson,
                                          option,
                                        )
                                      }
                                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-500 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {optionIndex + 1}.{" "}
                                      {option.label || option.key}
                                    </button>
                                  ))}
                                </div>
                              </section>
                            )}

                            {paymentSummary &&
                              (Number(paymentSummary.residenceCount || 0) > 0 ||
                                Number(paymentSummary.onewashCount || 0) >
                                  0) && (
                                <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Payment Summary
                                  </p>
                                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">
                                      Residence:{" "}
                                      {Number(
                                        paymentSummary.residenceCount || 0,
                                      )}
                                    </span>
                                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">
                                      One Wash:{" "}
                                      {Number(paymentSummary.onewashCount || 0)}
                                    </span>
                                    {selectedPeriod?.label ? (
                                      <span className="rounded-full bg-white px-3 py-1 text-slate-700">
                                        Period: {selectedPeriod.label}
                                      </span>
                                    ) : null}
                                    {selectedPeriod?.start &&
                                    selectedPeriod?.end ? (
                                      <span className="rounded-full bg-white px-3 py-1 text-slate-700">
                                        Range:{" "}
                                        {formatPeriodDate(selectedPeriod.start)}{" "}
                                        - {formatPeriodDate(selectedPeriod.end)}
                                      </span>
                                    ) : null}
                                  </div>
                                </section>
                              )}

                            {groups.length > 0 &&
                              groups.map((group) => (
                                <section
                                  key={`${message.id}-${group.domain}-${group.label}`}
                                  className="overflow-hidden rounded-xl border border-slate-200"
                                >
                                  <header className="flex items-center justify-between bg-slate-100 px-3 py-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                      {group.label}
                                    </h3>
                                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-700">
                                      {group.total || 0} match(es)
                                    </span>
                                  </header>

                                  <div className="space-y-2 bg-white p-3">
                                    {Array.isArray(group.data) &&
                                    group.data.length > 0 ? (
                                      group.domain === "payments" ? (
                                        <AiPaymentsResultTable
                                          label={group.label}
                                          rows={group.data}
                                          navigation={resolvePaymentsNavigation(
                                            message.payload,
                                            group.label,
                                          )}
                                          selectedPerson={selectedPerson}
                                          selectedPeriod={selectedPeriod}
                                          onApplyDateRange={
                                            handleInlineDateRangeApply
                                          }
                                          isSearching={isSearching}
                                        />
                                      ) : (
                                        group.data.map((record, index) => {
                                          const displayFields =
                                            keepDisplayableFields(
                                              buildFieldsForRecord(
                                                group.domain,
                                                record,
                                              ),
                                            );

                                          return (
                                            <article
                                              key={`${message.id}-${group.domain}-${index}`}
                                              className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                                            >
                                              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Result #{index + 1}
                                              </p>

                                              {displayFields.length > 0 ? (
                                                <dl className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                                                  {displayFields.map(
                                                    (field, fieldIndex) => (
                                                      <div
                                                        key={`${message.id}-${group.domain}-${index}-${field.label}-${fieldIndex}`}
                                                        className="rounded-md border border-slate-200 bg-white px-2 py-2"
                                                      >
                                                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                          {field.label}
                                                        </dt>
                                                        <dd className="mt-1 text-xs font-medium text-slate-800">
                                                          {field.shown}
                                                        </dd>
                                                      </div>
                                                    ),
                                                  )}
                                                </dl>
                                              ) : (
                                                <p className="text-xs text-slate-500">
                                                  No displayable fields found
                                                  for this record.
                                                </p>
                                              )}
                                            </article>
                                          );
                                        })
                                      )
                                    ) : (
                                      <p className="text-xs text-slate-500">
                                        No records in this category.
                                      </p>
                                    )}
                                  </div>
                                </section>
                              ))}

                            {conversationActions.length > 0 &&
                            !suggestions.length &&
                            !periodOptions.length ? (
                              <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                                  Next Prompt Suggestions
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {conversationActions.map((entry, idx) => (
                                    <button
                                      key={`${message.id}-conversation-action-${idx}`}
                                      type="button"
                                      disabled={isSearching}
                                      onClick={() =>
                                        handleConversationAction(entry, idx + 1)
                                      }
                                      className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {idx + 1}. {entry.label}
                                    </button>
                                  ))}
                                </div>
                                <p className="mt-2 text-[11px] font-medium text-emerald-700">
                                  {conversationHint ||
                                    "Type yes or do 1 / do 2 to run quickly."}
                                </p>
                              </section>
                            ) : null}
                          </div>
                        )}

                        <p className="mt-2 text-[10px] uppercase tracking-wider opacity-60">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </article>
                  );
                })}

                {isSearching && (
                  <article className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-600 shadow-sm">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm font-medium">Searching...</span>
                    </div>
                  </article>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white p-4 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="flex-1 rounded-xl border border-slate-300 bg-white px-3">
                  <div className="flex items-center">
                    <Search size={18} className="text-slate-400" />
                    <input
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          runPromptSearch();
                        }
                      }}
                      placeholder="Ask naturally (e.g. payments more than 20 AED this month, customer ravi payments, from 2026-03-26 to today, yes, do 1)"
                      className="w-full bg-transparent px-2 py-3 text-sm text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={runPromptSearch}
                  disabled={isSearching}
                  className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {isSearching ? "Searching..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <p className="mt-3 text-xs text-slate-500">
          Chat history: {messages.length} messages, assistant replies:{" "}
          {assistantMessages.length}
        </p>
      </div>
    </div>
  );
};

export default AiAssistantPage;
