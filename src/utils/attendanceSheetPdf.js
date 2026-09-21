import { jsPDF } from "jspdf";

const DESIGN_PAGE_WIDTH_MM = 110;
const DESIGN_PAGE_HEIGHT_MM = 220;
const DEFAULT_DESIGN_MARGIN_MM = 0;
const LOGO_FILE_PATH = "/carwash.jpeg";
const DEFAULT_ATTENDANCE_TEXT_SCALE = 1;
const DEFAULT_ATTENDANCE_TEXT_WEIGHT = "normal";

export const DEFAULT_ATTENDANCE_DOWNLOAD_PRESET = "DL";

const PRESET_CONFIG = {
  DL: {
    key: "DL",
    label: "DL (110 x 220 mm)",
    width: 110,
    height: 220,
    suffix: "DL",
    designMarginMm: 1.5,
  },
};

export const ATTENDANCE_DOWNLOAD_PRESETS = Object.values(PRESET_CONFIG).map(
  ({ key, label }) => ({ key, label }),
);

const SERVICE_TYPE_LABELS = {
  mall: "Mall",
  residence: "Residence",
  site: "Site",
  mobile: "Mobile",
  driver: "Driver",
  officestaff: "Office Staff",
  supervisor: "Supervisor",
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TABLE_HEADER_HEIGHT_MM = 6;
const SUMMARY_ROW1_HEIGHT_MM = 7;
const SUMMARY_ROW2_HEIGHT_MM = 5.5;
const SUMMARY_ROW3_HEIGHT_MM = 5.5;
const SUMMARY_ROW4_HEIGHT_MM = 8;
const SUMMARY_TOTAL_HEIGHT_MM =
  SUMMARY_ROW1_HEIGHT_MM +
  SUMMARY_ROW2_HEIGHT_MM +
  SUMMARY_ROW3_HEIGHT_MM +
  SUMMARY_ROW4_HEIGHT_MM;
const TABLE_COLUMN_PERCENTS = [0.1, 0.11, 0.18, 0.18, 0.12, 0.16, 0.15];

let cachedLogoDataUrl = null;

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

const getEntityDisplayName = (entity) => {
  if (!entity) return "";

  if (typeof entity === "object") {
    return String(entity.name || "").trim();
  }

  const text = String(entity).trim();
  if (!text) return "";
  return OBJECT_ID_PATTERN.test(text) ? "" : text;
};

const toTitleCase = (value = "") =>
  String(value)
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

export const getAttendanceWorkerKey = (worker) =>
  String(
    worker?._id ||
      worker?.id ||
      worker?.employeeCode ||
      worker?.mobile ||
      worker?.name ||
      "",
  );

export const getWorkerSiteName = (worker) => {
  const siteCandidates = [
    ...(Array.isArray(worker?.sites) ? worker.sites : []),
    worker?.site,
  ];
  for (const item of siteCandidates) {
    const name = getEntityDisplayName(item);
    if (name) return name;
  }

  const mallCandidates = [
    ...(Array.isArray(worker?.malls) ? worker.malls : []),
    worker?.mall,
  ];
  for (const item of mallCandidates) {
    const name = getEntityDisplayName(item);
    if (name) return name;
  }

  const buildingCandidates = [
    ...(Array.isArray(worker?.buildings) ? worker.buildings : []),
    worker?.building,
  ];
  for (const item of buildingCandidates) {
    const name = getEntityDisplayName(item);
    if (name) return name;
  }

  return "";
};

export const getWorkerTradeLabel = (worker) =>
  SERVICE_TYPE_LABELS[worker?.service_type] ||
  toTitleCase(String(worker?.service_type || ""));

export const getAttendanceHeaderData = (worker, override = {}) => ({
  companyName:
    override.companyName ||
    worker?.companyName ||
    "BABA CAR WASHING AND CLEANING L.L.C.",
  employeeName: override.employeeName || worker?.name || "",
  employeeNumber:
    override.employeeNumber || worker?.employeeCode || worker?.id || "",
  trade: override.trade || getWorkerTradeLabel(worker),
  siteName: override.siteName || getWorkerSiteName(worker),
});

export const parseAttendanceMonthInput = (monthValue) => {
  if (typeof monthValue === "string" && /^\d{4}-\d{2}$/.test(monthValue)) {
    const [year, month] = monthValue.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }

  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
};

export const formatAttendanceMonthYear = (date) =>
  `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

export const getAttendanceRows = (monthDate) => {
  const daysInMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0,
  ).getDate();

  return Array.from({ length: 31 }, (_, idx) => {
    const day = idx + 1;
    if (day > daysInMonth) {
      return {
        day,
        dayText: "",
        dateText: "",
        isCurrentMonthDay: false,
        isSunday: false,
      };
    }

    const d = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
    return {
      day,
      dayText: DAY_SHORT[d.getDay()],
      dateText: String(day).padStart(2, "0"),
      isCurrentMonthDay: true,
      isSunday: d.getDay() === 0,
    };
  });
};

const getAttendanceDownloadPreset = (presetKey) =>
  PRESET_CONFIG[presetKey] || PRESET_CONFIG[DEFAULT_ATTENDANCE_DOWNLOAD_PRESET];

const loadLogoDataUrl = async () => {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;

  try {
    const response = await fetch(LOGO_FILE_PATH);
    if (!response.ok) return null;

    const blob = await response.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    cachedLogoDataUrl = typeof dataUrl === "string" ? dataUrl : null;
    return cachedLogoDataUrl;
  } catch {
    return null;
  }
};

const truncateToWidth = (doc, rawText, maxWidth) => {
  const text = String(rawText ?? "").trim();
  if (!text) return "";

  if (doc.getTextWidth(text) <= maxWidth) return text;

  let cut = text.length;
  while (cut > 0) {
    const candidate = `${text.slice(0, cut)}...`;
    if (doc.getTextWidth(candidate) <= maxWidth) return candidate;
    cut -= 1;
  }

  return "";
};

const fitTextToWidth = (doc, rawText, maxWidth) => {
  const text = String(rawText ?? "").trim();
  if (!text) return "";

  if (doc.getTextWidth(text) <= maxWidth) return text;

  let cut = text.length;
  while (cut > 0) {
    const candidate = text.slice(0, cut);
    if (doc.getTextWidth(candidate) <= maxWidth) return candidate;
    cut -= 1;
  }

  return "";
};

const resolveBaseFontStyle = (fontWeight) =>
  fontWeight === "bold" ? "bold" : "normal";

const drawInlineField = ({
  doc,
  label,
  value,
  x,
  y,
  width,
  valueFontStyle = "normal",
  baseline = "middle",
}) => {
  doc.setFont("helvetica", "bold");
  const labelText = `${label} : `;
  const labelWidth = doc.getTextWidth(labelText);

  doc.setFont("helvetica", valueFontStyle);
  const valueText = truncateToWidth(doc, value, width - labelWidth - 1);
  const textOptions = { baseline };

  doc.setFont("helvetica", "bold");
  doc.text(labelText, x, y, textOptions);
  doc.setFont("helvetica", valueFontStyle);
  doc.text(valueText || "", x + labelWidth, y, textOptions);
};

const drawHeader = (
  doc,
  headerData,
  monthDate,
  logoDataUrl,
  offsetX,
  offsetY,
  designMarginMm,
  fontScale,
  fontWeight,
) => {
  const x = offsetX + designMarginMm;
  const width = DESIGN_PAGE_WIDTH_MM - designMarginMm * 2;
  const rowHeight = 5.6;
  const logoRowHeight = 9;
  const baseFontSize = 9.6;
  const scaleFontSize = (value) => value * fontScale;
  const baseFontStyle = resolveBaseFontStyle(fontWeight);

  let y = offsetY + designMarginMm;

  doc.rect(x, y, width, logoRowHeight);
  if (logoDataUrl) {
    try {
      doc.addImage(
        logoDataUrl,
        "JPEG",
        x + 1.2,
        y + 0.9,
        7,
        7,
        undefined,
        "FAST",
      );
    } catch {
      // Ignore logo drawing errors and continue.
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(scaleFontSize(9.8));
  doc.text(
    truncateToWidth(doc, headerData.companyName.toUpperCase(), width - 11),
    x + 10,
    y + 5.6,
  );
  y += logoRowHeight;

  const drawRegularRow = (label, value) => {
    doc.rect(x, y, width, rowHeight);
    doc.setFontSize(scaleFontSize(baseFontSize));
    drawInlineField({
      doc,
      label,
      value,
      x: x + 1.2,
      y: y + rowHeight / 2,
      width: width - 2.4,
      valueFontStyle: baseFontStyle,
    });
    y += rowHeight;
  };

  drawRegularRow("Employee Name", headerData.employeeName);
  drawRegularRow("Employee Number", headerData.employeeNumber);

  doc.rect(x, y, width, rowHeight);
  const splitX = x + width * 0.65;
  doc.line(splitX, y, splitX, y + rowHeight);

  doc.setFontSize(scaleFontSize(baseFontSize));
  drawInlineField({
    doc,
    label: "Trade",
    value: headerData.trade,
    x: x + 1.2,
    y: y + rowHeight / 2,
    width: splitX - x - 2,
    valueFontStyle: baseFontStyle,
  });

  doc.setFont("helvetica", "bold");
  doc.text(
    truncateToWidth(doc, formatAttendanceMonthYear(monthDate), width * 0.33),
    splitX + (width * 0.35) / 2,
    y + rowHeight / 2,
    { align: "center", baseline: "middle" },
  );
  y += rowHeight;

  drawRegularRow("Site Name", headerData.siteName);

  return y;
};

const drawAttendanceGrid = (
  doc,
  monthDate,
  startY,
  offsetX,
  offsetY,
  designMarginMm,
  fontScale,
) => {
  const x = offsetX + designMarginMm;
  const width = DESIGN_PAGE_WIDTH_MM - designMarginMm * 2;

  const headerHeight = TABLE_HEADER_HEIGHT_MM;
  const rows = getAttendanceRows(monthDate);
  const contentBottomY = offsetY + DESIGN_PAGE_HEIGHT_MM - designMarginMm;
  const usableRowsHeight =
    contentBottomY - startY - SUMMARY_TOTAL_HEIGHT_MM - headerHeight;
  const rowHeight = Math.max(usableRowsHeight / rows.length, 4.1);
  const colWidths = [];
  let consumedWidth = 0;
  TABLE_COLUMN_PERCENTS.forEach((pct, idx) => {
    if (idx === TABLE_COLUMN_PERCENTS.length - 1) {
      colWidths.push(width - consumedWidth);
    } else {
      const nextWidth = width * pct;
      colWidths.push(nextWidth);
      consumedWidth += nextWidth;
    }
  });
  const headers = [
    "Date",
    "DAY",
    "Time In",
    "Time Out",
    "OT",
    "Total Hrs",
    "Sign",
  ];

  rows.forEach((row, idx) => {
    if (!row.isSunday || !row.isCurrentMonthDay) return;
    const rowY = startY + headerHeight + idx * rowHeight;
    doc.setFillColor(255, 244, 89);
    doc.rect(x, rowY, width, rowHeight, "F");
  });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.rect(x, startY, width, headerHeight + rows.length * rowHeight);

  let colX = x;
  colWidths.forEach((w, idx) => {
    colX += w;
    if (idx < colWidths.length - 1) {
      doc.line(
        colX,
        startY,
        colX,
        startY + headerHeight + rows.length * rowHeight,
      );
    }
  });
  doc.line(x, startY + headerHeight, x + width, startY + headerHeight);

  for (let i = 1; i <= rows.length; i += 1) {
    const y = startY + headerHeight + i * rowHeight;
    doc.line(x, y, x + width, y);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.1 * fontScale);

  let textX = x;
  headers.forEach((head, idx) => {
    doc.text(head, textX + colWidths[idx] / 2, startY + 4, { align: "center" });
    textX += colWidths[idx];
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9 * fontScale);

  rows.forEach((row, idx) => {
    if (!row.isCurrentMonthDay) return;

    const rowY = startY + headerHeight + idx * rowHeight;
    const textY = rowY + rowHeight / 2;

    doc.text(row.dateText, x + colWidths[0] / 2, textY, {
      align: "center",
      baseline: "middle",
    });
    doc.text(row.dayText, x + colWidths[0] + colWidths[1] / 2, textY, {
      align: "center",
      baseline: "middle",
    });
  });

  return startY + headerHeight + rows.length * rowHeight;
};

const drawSummary = (doc, startY, offsetX, designMarginMm, fontScale) => {
  const x = offsetX + designMarginMm;
  const width = DESIGN_PAGE_WIDTH_MM - designMarginMm * 2;
  const paddingX = 2;
  const halfWidth = width / 2;

  const row1 = SUMMARY_ROW1_HEIGHT_MM;
  const row2 = SUMMARY_ROW2_HEIGHT_MM;
  const row3 = SUMMARY_ROW3_HEIGHT_MM;
  const row4 = SUMMARY_ROW4_HEIGHT_MM;

  let y = startY;

  doc.rect(x, y, width, row1);
  doc.line(x + width / 2, y, x + width / 2, y + row1);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.4 * fontScale);
  doc.text(
    fitTextToWidth(
      doc,
      "Employee Signature: .....................",
      halfWidth - paddingX * 2,
    ),
    x + paddingX,
    y + 4.8,
  );
  doc.text(
    fitTextToWidth(
      doc,
      "Approved By: .....................",
      halfWidth - paddingX * 2,
    ),
    x + halfWidth + paddingX,
    y + 4.8,
  );

  y += row1;
  doc.rect(x, y, width, row2);
  doc.line(x + width / 2, y, x + width / 2, y + row2);
  doc.text(
    fitTextToWidth(doc, "Total Hours:", halfWidth - paddingX * 2),
    x + paddingX,
    y + 4.3,
  );
  doc.text(
    fitTextToWidth(doc, "Total OT Hours:", halfWidth - paddingX * 2),
    x + halfWidth + paddingX,
    y + 4.3,
  );

  y += row2;
  const splitX = x + width * 0.7;
  const leftWidth = width * 0.7;
  doc.rect(x, y, width, row3);
  doc.line(splitX, y, splitX, y + row3);
  doc.text(
    fitTextToWidth(doc, "Grand Total:", leftWidth - paddingX * 2),
    x + paddingX,
    y + 4.3,
  );
  doc.text("Break Time", splitX + (width * 0.3) / 2, y + 4.3, {
    align: "center",
  });

  y += row3;
  doc.rect(x, y, width, row4);
  doc.line(splitX, y, splitX, y + row4);
  doc.text(
    fitTextToWidth(
      doc,
      "Timekeeper Signature: .................",
      leftWidth - paddingX * 2,
    ),
    x + paddingX,
    y + 5,
  );
};

const drawAttendanceCard = (
  doc,
  worker,
  monthDate,
  logoDataUrl,
  offsetX,
  offsetY,
  workerOverride,
  designMarginMm,
  fontScale,
  fontWeight,
) => {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(
    offsetX + designMarginMm,
    offsetY + designMarginMm,
    DESIGN_PAGE_WIDTH_MM - designMarginMm * 2,
    DESIGN_PAGE_HEIGHT_MM - designMarginMm * 2,
  );

  const headerData = getAttendanceHeaderData(worker, workerOverride);
  const tableStartY = drawHeader(
    doc,
    headerData,
    monthDate,
    logoDataUrl,
    offsetX,
    offsetY,
    designMarginMm,
    fontScale,
    fontWeight,
  );
  const summaryStartY = drawAttendanceGrid(
    doc,
    monthDate,
    tableStartY,
    offsetX,
    offsetY,
    designMarginMm,
    fontScale,
  );
  drawSummary(doc, summaryStartY, offsetX, designMarginMm, fontScale);
};

export const generateMonthlyAttendanceSheetsPdf = async ({
  workers = [],
  monthValue,
  fileNamePrefix = "Attendance_Sheets",
  downloadPresetKey = DEFAULT_ATTENDANCE_DOWNLOAD_PRESET,
  workerOverrides = {},
  pageOffsetMm = { x: 0, y: 0 },
  fontScale = DEFAULT_ATTENDANCE_TEXT_SCALE,
  fontWeight = DEFAULT_ATTENDANCE_TEXT_WEIGHT,
  action = "download",
}) => {
  if (!Array.isArray(workers) || workers.length === 0) {
    throw new Error("No workers available for attendance sheet generation");
  }

  const monthDate = parseAttendanceMonthInput(monthValue);
  const logoDataUrl = await loadLogoDataUrl();
  const preset = getAttendanceDownloadPreset(downloadPresetKey);
  const offsetXMm = Number.isFinite(pageOffsetMm?.x) ? pageOffsetMm.x : 0;
  const offsetYMm = Number.isFinite(pageOffsetMm?.y) ? pageOffsetMm.y : 0;
  const safeFontScale =
    Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
  const safeFontWeight = fontWeight === "bold" ? "bold" : "normal";
  const designMarginMm = Number.isFinite(preset.designMarginMm)
    ? preset.designMarginMm
    : DEFAULT_DESIGN_MARGIN_MM;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [preset.width, preset.height],
    compress: true,
  });

  const offsetX =
    Math.max((preset.width - DESIGN_PAGE_WIDTH_MM) / 2, 0) + offsetXMm;
  const offsetY =
    Math.max((preset.height - DESIGN_PAGE_HEIGHT_MM) / 2, 0) + offsetYMm;

  const sortedWorkers = [...workers].sort((a, b) =>
    String(a?.name || "").localeCompare(String(b?.name || "")),
  );

  sortedWorkers.forEach((worker, index) => {
    if (index > 0) {
      doc.addPage([preset.width, preset.height], "portrait");
    }

    const workerKey = getAttendanceWorkerKey(worker);
    const override = workerKey
      ? workerOverrides[workerKey] || workerOverrides[String(workerKey)] || {}
      : {};

    drawAttendanceCard(
      doc,
      worker,
      monthDate,
      logoDataUrl,
      offsetX,
      offsetY,
      override,
      designMarginMm,
      safeFontScale,
      safeFontWeight,
    );
  });

  const safeMonth = formatAttendanceMonthYear(monthDate).replace(/\s+/g, "_");
  const suffix =
    preset.key === DEFAULT_ATTENDANCE_DOWNLOAD_PRESET
      ? ""
      : `_${preset.suffix}`;
  const fileName = `${fileNamePrefix}_${safeMonth}${suffix}.pdf`;

  if (action === "print" || action === "preview") {
    if (typeof window === "undefined") {
      throw new Error("Preview is only available in browser environment");
    }

    if (action === "print" && typeof doc.autoPrint === "function") {
      doc.autoPrint();
    }

    const blobUrl = doc.output("bloburl");
    const printWindow = window.open(blobUrl, "_blank");
    if (!printWindow) {
      throw new Error("Popup blocked. Please allow popups to open preview.");
    }
    return { fileName, blobUrl };
  }

  doc.save(fileName);
  return { fileName };
};

export default generateMonthlyAttendanceSheetsPdf;
