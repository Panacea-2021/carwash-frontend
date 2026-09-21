import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Download,
  Printer,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Edit2,
  Check,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  ATTENDANCE_DOWNLOAD_PRESETS,
  DEFAULT_ATTENDANCE_DOWNLOAD_PRESET,
  formatAttendanceMonthYear,
  generateMonthlyAttendanceSheetsPdf,
  getAttendanceHeaderData,
  getAttendanceRows,
  getAttendanceWorkerKey,
  parseAttendanceMonthInput,
} from "../../utils/attendanceSheetPdf";
import { staffProfileService } from "../../api/staffProfileService";

const getSafeFileNamePart = (value = "") => {
  const safe = String(value)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return safe || "Worker";
};

const ATTENDANCE_PRESET_STORAGE_KEY = "attendanceSheetDownloadPreset";
const ATTENDANCE_OFFSET_X_STORAGE_KEY = "attendanceSheetOffsetX";
const ATTENDANCE_OFFSET_Y_STORAGE_KEY = "attendanceSheetOffsetY";
const ATTENDANCE_FONT_SCALE_STORAGE_KEY = "attendanceSheetFontScale";
const ATTENDANCE_FONT_WEIGHT_STORAGE_KEY = "attendanceSheetFontWeight";
const DEFAULT_ATTENDANCE_FONT_SCALE = 1;
const DEFAULT_ATTENDANCE_FONT_WEIGHT = "normal";

const FONT_SCALE_OPTIONS = [
  { label: "Small", value: 0.9 },
  { label: "Normal", value: 1 },
  { label: "Large", value: 1.1 },
  { label: "XL", value: 1.2 },
  { label: "XXL", value: 1.3 },
];

const parseStoredNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const FONT_WEIGHT_OPTIONS = [
  { label: "Normal", value: "normal" },
  { label: "Bold", value: "bold" },
];

const getStoredFontWeight = () => {
  if (typeof window === "undefined") return DEFAULT_ATTENDANCE_FONT_WEIGHT;
  const stored = window.localStorage.getItem(
    ATTENDANCE_FONT_WEIGHT_STORAGE_KEY,
  );
  return stored === "bold" || stored === "normal"
    ? stored
    : DEFAULT_ATTENDANCE_FONT_WEIGHT;
};

const getStoredPresetKey = () => {
  if (typeof window === "undefined") {
    return DEFAULT_ATTENDANCE_DOWNLOAD_PRESET;
  }

  const stored = window.localStorage.getItem(ATTENDANCE_PRESET_STORAGE_KEY);
  const isValid = ATTENDANCE_DOWNLOAD_PRESETS.some(
    (preset) => preset.key === stored,
  );

  return isValid ? stored : DEFAULT_ATTENDANCE_DOWNLOAD_PRESET;
};

const getStoredOffsetMm = (key) => {
  if (typeof window === "undefined") return 0;
  return parseStoredNumber(window.localStorage.getItem(key), 0);
};

const getStoredFontScale = () => {
  if (typeof window === "undefined") return DEFAULT_ATTENDANCE_FONT_SCALE;
  return parseStoredNumber(
    window.localStorage.getItem(ATTENDANCE_FONT_SCALE_STORAGE_KEY),
    DEFAULT_ATTENDANCE_FONT_SCALE,
  );
};

const saveStoredValue = (key, value) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, String(value));
};

const InfoRow = ({ label, value, fontScale = 1 }) => (
  <div
    className="border-b border-black h-[5.6mm] px-[1.2mm] flex items-center"
    style={{ fontSize: `${9 * fontScale}px` }}
  >
    <span className="font-bold mr-[1mm] whitespace-nowrap">{label} :</span>
    <span className="truncate">{value || ""}</span>
  </div>
);

const CellHeader = ({ text, isLast = false, fontScale = 1 }) => (
  <div
    className={`flex items-center justify-center border-r border-black ${isLast ? "border-r-0" : ""}`}
    style={{ fontSize: `${8.5 * fontScale}px` }}
  >
    {text}
  </div>
);

const CellValue = ({ text, isLast = false, fontScale = 1 }) => (
  <div
    className={`flex items-center justify-center border-r border-black font-bold ${isLast ? "border-r-0" : ""}`}
    style={{ fontSize: `${8.5 * fontScale}px` }}
  >
    {text}
  </div>
);

const SummaryRow = ({
  left,
  right,
  height,
  split,
  centerRight = false,
  fontScale = 1,
}) => (
  <div
    className="border-b border-black flex"
    style={{ height, fontSize: `${9 * fontScale}px` }}
  >
    <div
      className="border-r border-black px-[1.2mm] flex items-center font-bold overflow-hidden whitespace-nowrap"
      style={{ width: split }}
    >
      {left}
    </div>
    <div
      className={`px-[1.2mm] flex items-center font-bold overflow-hidden whitespace-nowrap ${centerRight ? "justify-center" : ""}`}
      style={{ width: `calc(100% - ${split})` }}
    >
      {right}
    </div>
  </div>
);

const AttendanceCardPreview = ({
  headerData,
  monthDate,
  fontScale = 1,
  fontWeight = DEFAULT_ATTENDANCE_FONT_WEIGHT,
}) => {
  const rows = useMemo(() => getAttendanceRows(monthDate), [monthDate]);
  const monthLabel = formatAttendanceMonthYear(monthDate);
  const topSectionHeightMm = 31.4;
  const tableHeaderHeightMm = 6;
  const summarySectionHeightMm = 26;
  const tableRowHeightMm =
    (220 - topSectionHeightMm - tableHeaderHeightMm - summarySectionHeightMm) /
    31;
  const tableHeightMm = tableHeaderHeightMm + tableRowHeightMm * 31;
  const resolvedFontWeight = fontWeight === "bold" ? 700 : 400;

  return (
    <div
      className="bg-white border-2 border-black leading-none text-black shadow-2xl overflow-hidden"
      style={{
        width: "110mm",
        height: "220mm",
        minWidth: "110mm",
        fontSize: `${9 * fontScale}px`,
        fontWeight: resolvedFontWeight,
      }}
    >
      <div className="border-b border-black h-[9mm] px-[1.2mm] flex items-center gap-[1.2mm]">
        <img
          src="/carwash.jpeg"
          alt="BCW"
          className="w-[7mm] h-[7mm] object-contain"
        />
        <div
          className="font-bold uppercase tracking-tight leading-tight"
          style={{ fontSize: `${8.5 * fontScale}px` }}
        >
          {headerData.companyName}
        </div>
      </div>

      <InfoRow
        label="Employee Name"
        value={headerData.employeeName}
        fontScale={fontScale}
      />
      <InfoRow
        label="Employee Number"
        value={headerData.employeeNumber}
        fontScale={fontScale}
      />

      <div className="border-b border-black h-[5.6mm] flex">
        <div className="w-[65%] border-r border-black px-[1.2mm] flex items-center">
          <span className="font-bold mr-[1mm] whitespace-nowrap">Trade :</span>
          <span className="truncate">{headerData.trade || ""}</span>
        </div>
        <div
          className="w-[35%] px-[1mm] flex items-center justify-center font-bold"
          style={{ fontSize: `${9 * fontScale}px` }}
        >
          {monthLabel}
        </div>
      </div>

      <InfoRow
        label="Site Name"
        value={headerData.siteName}
        fontScale={fontScale}
      />

      <div
        className="border-b border-black"
        style={{ height: `${tableHeightMm}mm` }}
      >
        <div
          className="grid border-b border-black font-bold h-[6mm]"
          style={{ gridTemplateColumns: "10% 11% 18% 18% 12% 16% 15%" }}
        >
          <CellHeader text="Date" fontScale={fontScale} />
          <CellHeader text="DAY" fontScale={fontScale} />
          <CellHeader text="Time In" fontScale={fontScale} />
          <CellHeader text="Time Out" fontScale={fontScale} />
          <CellHeader text="OT" fontScale={fontScale} />
          <CellHeader text="Total Hrs" fontScale={fontScale} />
          <CellHeader text="Sign" isLast fontScale={fontScale} />
        </div>

        {rows.map((row, idx) => (
          <div
            key={`${row.day}-${idx}`}
            className="grid border-b border-black"
            style={{
              gridTemplateColumns: "10% 11% 18% 18% 12% 16% 15%",
              height: `${tableRowHeightMm}mm`,
              backgroundColor:
                row.isCurrentMonthDay && row.isSunday ? "#fff459" : "#ffffff",
            }}
          >
            <CellValue text={row.dateText} fontScale={fontScale} />
            <CellValue text={row.dayText} fontScale={fontScale} />
            <CellValue text="" fontScale={fontScale} />
            <CellValue text="" fontScale={fontScale} />
            <CellValue text="" fontScale={fontScale} />
            <CellValue text="" fontScale={fontScale} />
            <CellValue text="" isLast fontScale={fontScale} />
          </div>
        ))}
      </div>

      <div className="h-[26mm]">
        <SummaryRow
          left="Employee Signature: ...................."
          right="Approved By: ...................."
          height="7mm"
          split="50%"
          fontScale={fontScale}
        />
        <SummaryRow
          left="Total Hours:"
          right="Total OT Hours:"
          height="5.5mm"
          split="50%"
          fontScale={fontScale}
        />
        <SummaryRow
          left="Grand Total:"
          right="Break Time"
          height="5.5mm"
          split="70%"
          centerRight
          fontScale={fontScale}
        />
        <SummaryRow
          left="Timekeeper Signature: ................."
          right=""
          height="8mm"
          split="70%"
          fontScale={fontScale}
        />
      </div>
    </div>
  );
};

const MM_TO_PX = 3.7795275591;
const PREVIEW_WIDTH_PX = 110 * MM_TO_PX;
const PREVIEW_HEIGHT_PX = 220 * MM_TO_PX;
const MIN_PREVIEW_SCALE = 0.2;

const AttendancePreviewViewport = ({ children, offsetMm = { x: 0, y: 0 } }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const offsetX = Number.isFinite(offsetMm?.x) ? offsetMm.x : 0;
  const offsetY = Number.isFinite(offsetMm?.y) ? offsetMm.y : 0;

  useEffect(() => {
    const updateScale = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const nextScale = Math.min(
        rect.width / PREVIEW_WIDTH_PX,
        rect.height / PREVIEW_HEIGHT_PX,
        1,
      );

      setScale(Math.max(nextScale, MIN_PREVIEW_SCALE));
    };

    updateScale();

    const container = containerRef.current;
    const canObserve =
      typeof window !== "undefined" &&
      typeof window.ResizeObserver !== "undefined";

    let observer;
    if (canObserve && container) {
      observer = new window.ResizeObserver(updateScale);
      observer.observe(container);
    }

    window.addEventListener("resize", updateScale);

    return () => {
      window.removeEventListener("resize", updateScale);
      if (observer) observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden flex items-center justify-center"
    >
      <div
        className="flex items-start justify-center"
        style={{
          width: `${PREVIEW_WIDTH_PX * scale}px`,
          height: `${PREVIEW_HEIGHT_PX * scale}px`,
        }}
      >
        <div
          style={{
            width: `${PREVIEW_WIDTH_PX}px`,
            height: `${PREVIEW_HEIGHT_PX}px`,
            transform: `translate(${offsetX * MM_TO_PX}px, ${offsetY * MM_TO_PX}px) scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

const AttendanceSheetModal = ({
  isOpen,
  onClose,
  workers = [],
  monthValue,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [downloadCurrentLoading, setDownloadCurrentLoading] = useState(false);
  const [downloadAllLoading, setDownloadAllLoading] = useState(false);
  const [printCurrentLoading, setPrintCurrentLoading] = useState(false);
  const [printAllLoading, setPrintAllLoading] = useState(false);
  const [downloadPreset, setDownloadPreset] = useState(getStoredPresetKey);
  const [pageOffsetX, setPageOffsetX] = useState(() =>
    getStoredOffsetMm(ATTENDANCE_OFFSET_X_STORAGE_KEY),
  );
  const [pageOffsetY, setPageOffsetY] = useState(() =>
    getStoredOffsetMm(ATTENDANCE_OFFSET_Y_STORAGE_KEY),
  );
  const [fontScale, setFontScale] = useState(getStoredFontScale);
  const [fontWeight, setFontWeight] = useState(getStoredFontWeight);
  const [isEditing, setIsEditing] = useState(false);
  const [workerOverrides, setWorkerOverrides] = useState({});
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentIndex(0);
    setDownloadPreset(getStoredPresetKey());
    setPageOffsetX(getStoredOffsetMm(ATTENDANCE_OFFSET_X_STORAGE_KEY));
    setPageOffsetY(getStoredOffsetMm(ATTENDANCE_OFFSET_Y_STORAGE_KEY));
    setFontScale(getStoredFontScale());
    setFontWeight(getStoredFontWeight());
    setPreferencesLoaded(false);
    setIsEditing(false);
    setWorkerOverrides({});

    let cancelled = false;

    const loadPreferences = async () => {
      try {
        const response = await staffProfileService.getProfile();
        const preferences = response?.data?.attendanceSheetPreferences || {};

        if (cancelled) return;

        if (preferences.downloadPreset) {
          setDownloadPreset(preferences.downloadPreset);
          saveStoredValue(
            ATTENDANCE_PRESET_STORAGE_KEY,
            preferences.downloadPreset,
          );
        }

        if (Number.isFinite(Number(preferences.offsetX))) {
          const nextX = Number(preferences.offsetX);
          setPageOffsetX(nextX);
          saveStoredValue(ATTENDANCE_OFFSET_X_STORAGE_KEY, nextX);
        }

        if (Number.isFinite(Number(preferences.offsetY))) {
          const nextY = Number(preferences.offsetY);
          setPageOffsetY(nextY);
          saveStoredValue(ATTENDANCE_OFFSET_Y_STORAGE_KEY, nextY);
        }

        if (Number.isFinite(Number(preferences.fontScale))) {
          const nextScale = Number(preferences.fontScale);
          setFontScale(nextScale);
          saveStoredValue(ATTENDANCE_FONT_SCALE_STORAGE_KEY, nextScale);
        }

        if (
          preferences.fontWeight === "bold" ||
          preferences.fontWeight === "normal"
        ) {
          const nextWeight = preferences.fontWeight;
          setFontWeight(nextWeight);
          saveStoredValue(ATTENDANCE_FONT_WEIGHT_STORAGE_KEY, nextWeight);
        }
      } catch (error) {
        console.error("Failed to load attendance preferences", error);
      } finally {
        if (!cancelled) {
          setPreferencesLoaded(true);
        }
      }
    };

    loadPreferences();

    return () => {
      cancelled = true;
    };
  }, [isOpen, monthValue]);

  useEffect(() => {
    if (!isOpen || !preferencesLoaded) return undefined;

    const timeoutId = window.setTimeout(() => {
      staffProfileService
        .updateAttendanceSheetPreferences({
          downloadPreset,
          offsetX: pageOffsetX,
          offsetY: pageOffsetY,
          fontScale,
          fontWeight,
        })
        .catch((error) => {
          console.error("Failed to save attendance preferences", error);
        });
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [
    isOpen,
    preferencesLoaded,
    downloadPreset,
    pageOffsetX,
    pageOffsetY,
    fontScale,
    fontWeight,
  ]);

  const monthDate = useMemo(
    () => parseAttendanceMonthInput(monthValue),
    [monthValue],
  );

  const monthLabel = useMemo(
    () => formatAttendanceMonthYear(monthDate),
    [monthDate],
  );

  const validWorkers = useMemo(() => workers.filter(Boolean), [workers]);
  const hasWorkers = validWorkers.length > 0;
  const currentWorker = hasWorkers
    ? validWorkers[Math.min(currentIndex, validWorkers.length - 1)]
    : null;

  const currentWorkerKey = useMemo(
    () => getAttendanceWorkerKey(currentWorker),
    [currentWorker],
  );

  const currentOverride =
    (currentWorkerKey && workerOverrides[currentWorkerKey]) || {};

  const currentHeaderData = useMemo(
    () => getAttendanceHeaderData(currentWorker, currentOverride),
    [currentWorker, currentOverride],
  );

  if (!isOpen) return null;

  const updateCurrentOverride = (field, value) => {
    if (!currentWorkerKey) return;

    setWorkerOverrides((prev) => ({
      ...prev,
      [currentWorkerKey]: {
        ...(prev[currentWorkerKey] || {}),
        [field]: value,
      },
    }));
  };

  const resetCurrentOverride = () => {
    if (!currentWorkerKey) return;

    setWorkerOverrides((prev) => {
      const next = { ...prev };
      delete next[currentWorkerKey];
      return next;
    });
  };

  const handleDownloadCurrent = async () => {
    if (!currentWorker) return;

    const scopedOverrides = currentWorkerKey
      ? { [currentWorkerKey]: currentOverride }
      : {};

    setDownloadCurrentLoading(true);
    try {
      await generateMonthlyAttendanceSheetsPdf({
        workers: [currentWorker],
        monthValue,
        fileNamePrefix: `Attendance_Sheet_${getSafeFileNamePart(
          currentHeaderData.employeeName || currentHeaderData.employeeNumber,
        )}`,
        downloadPresetKey: downloadPreset,
        workerOverrides: scopedOverrides,
        pageOffsetMm: { x: pageOffsetX, y: pageOffsetY },
        fontScale,
        fontWeight,
      });
      toast.success(
        `Downloaded attendance sheet for ${currentHeaderData.employeeName || "worker"}`,
      );
    } catch {
      toast.error("Failed to download attendance sheet");
    } finally {
      setDownloadCurrentLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!hasWorkers) return;

    setDownloadAllLoading(true);
    try {
      await generateMonthlyAttendanceSheetsPdf({
        workers: validWorkers,
        monthValue,
        downloadPresetKey: downloadPreset,
        workerOverrides,
        pageOffsetMm: { x: pageOffsetX, y: pageOffsetY },
        fontScale,
        fontWeight,
      });
      toast.success(
        `Downloaded attendance sheets for ${validWorkers.length} workers`,
      );
    } catch {
      toast.error("Failed to download attendance sheets");
    } finally {
      setDownloadAllLoading(false);
    }
  };

  const handlePrintCurrent = async () => {
    if (!currentWorker) return;

    const scopedOverrides = currentWorkerKey
      ? { [currentWorkerKey]: currentOverride }
      : {};

    setPrintCurrentLoading(true);
    try {
      await generateMonthlyAttendanceSheetsPdf({
        workers: [currentWorker],
        monthValue,
        fileNamePrefix: `Attendance_Sheet_${getSafeFileNamePart(
          currentHeaderData.employeeName || currentHeaderData.employeeNumber,
        )}`,
        downloadPresetKey: downloadPreset,
        workerOverrides: scopedOverrides,
        pageOffsetMm: { x: pageOffsetX, y: pageOffsetY },
        fontScale,
        fontWeight,
        action: "print",
      });
      toast.success("Print dialog opened for current attendance sheet");
    } catch (error) {
      toast.error(error?.message || "Failed to open print dialog");
    } finally {
      setPrintCurrentLoading(false);
    }
  };

  const handlePrintAll = async () => {
    if (!hasWorkers) return;

    setPrintAllLoading(true);
    try {
      await generateMonthlyAttendanceSheetsPdf({
        workers: validWorkers,
        monthValue,
        downloadPresetKey: downloadPreset,
        workerOverrides,
        pageOffsetMm: { x: pageOffsetX, y: pageOffsetY },
        fontScale,
        fontWeight,
        action: "print",
      });
      toast.success(
        `Print dialog opened for ${validWorkers.length} attendance sheets`,
      );
    } catch (error) {
      toast.error(error?.message || "Failed to open print dialog");
    } finally {
      setPrintAllLoading(false);
    }
  };

  const handlePresetChange = (event) => {
    const nextPreset = event.target.value;
    setDownloadPreset(nextPreset);
    saveStoredValue(ATTENDANCE_PRESET_STORAGE_KEY, nextPreset);
  };

  const handleOffsetChange = (setter, storageKey) => (event) => {
    const nextValue = parseStoredNumber(event.target.value, 0);
    setter(nextValue);
    saveStoredValue(storageKey, nextValue);
  };

  const handleFontScaleChange = (event) => {
    const nextValue = parseStoredNumber(event.target.value, 1);
    setFontScale(nextValue);
    saveStoredValue(ATTENDANCE_FONT_SCALE_STORAGE_KEY, nextValue);
  };

  const handleFontWeightChange = (event) => {
    const nextValue = event.target.value === "bold" ? "bold" : "normal";
    setFontWeight(nextValue);
    saveStoredValue(ATTENDANCE_FONT_WEIGHT_STORAGE_KEY, nextValue);
  };

  const resetOffsets = () => {
    setPageOffsetX(0);
    setPageOffsetY(0);
    saveStoredValue(ATTENDANCE_OFFSET_X_STORAGE_KEY, 0);
    saveStoredValue(ATTENDANCE_OFFSET_Y_STORAGE_KEY, 0);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm">
        <div className="flex min-h-full items-center justify-center p-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-6xl max-h-[94vh]"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-wide uppercase">
                    Attendance Sheet Preview
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Month: {monthLabel} | Employees: {validWorkers.length}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 bg-slate-50 flex-1 min-h-0">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 h-full min-h-0">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 h-full min-h-0 overflow-hidden">
                    {currentWorker ? (
                      <AttendancePreviewViewport
                        offsetMm={{ x: pageOffsetX, y: pageOffsetY }}
                      >
                        <AttendanceCardPreview
                          headerData={currentHeaderData}
                          monthDate={monthDate}
                          fontScale={fontScale}
                          fontWeight={fontWeight}
                        />
                      </AttendancePreviewViewport>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500 font-semibold">
                        No employee selected for preview.
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-4 h-full overflow-y-auto">
                    <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                      <p className="text-[11px] uppercase font-black tracking-wider text-slate-400 mb-1">
                        Current Employee
                      </p>
                      <p className="text-sm font-black text-slate-800 uppercase">
                        {currentHeaderData.employeeName || "-"}
                      </p>
                      <p className="text-xs font-bold text-slate-500 mt-1">
                        {currentHeaderData.employeeNumber ||
                          "No Employee Number"}
                      </p>
                      <p className="text-xs text-slate-500 mt-2 font-semibold">
                        Trade: {currentHeaderData.trade || "-"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">
                        Site: {currentHeaderData.siteName || "-"}
                      </p>
                    </div>

                    {validWorkers.length > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCurrentIndex((prev) => Math.max(prev - 1, 0));
                            setIsEditing(false);
                          }}
                          disabled={currentIndex === 0}
                          className="flex-1 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <ChevronLeft className="w-4 h-4" /> Prev
                        </button>
                        <button
                          onClick={() => {
                            setCurrentIndex((prev) =>
                              Math.min(prev + 1, validWorkers.length - 1),
                            );
                            setIsEditing(false);
                          }}
                          disabled={currentIndex >= validWorkers.length - 1}
                          className="flex-1 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="text-xs font-bold text-slate-500 text-center">
                      {hasWorkers
                        ? `Showing ${Math.min(currentIndex + 1, validWorkers.length)} of ${validWorkers.length}`
                        : "No records"}
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-black text-slate-400 mb-1.5">
                        Text Size
                      </label>
                      <select
                        value={fontScale}
                        onChange={handleFontScaleChange}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      >
                        {FONT_SCALE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-[10px] font-semibold text-slate-400">
                        Saved to your profile for next time.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-black text-slate-400 mb-1.5">
                        Font Weight
                      </label>
                      <select
                        value={fontWeight}
                        onChange={handleFontWeightChange}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      >
                        {FONT_WEIGHT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-[10px] font-semibold text-slate-400">
                        Saved to your profile for next time.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-black text-slate-400 mb-1.5">
                        Download Size
                      </label>
                      <select
                        value={downloadPreset}
                        onChange={handlePresetChange}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      >
                        {ATTENDANCE_DOWNLOAD_PRESETS.map((preset) => (
                          <option key={preset.key} value={preset.key}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-[10px] font-semibold text-slate-400">
                        Saved for next time.
                      </p>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                      <p className="text-[11px] uppercase tracking-wider font-black text-slate-400">
                        Alignment (mm)
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500">
                            Horizontal (X)
                          </label>
                          <input
                            type="number"
                            value={pageOffsetX}
                            onChange={handleOffsetChange(
                              setPageOffsetX,
                              ATTENDANCE_OFFSET_X_STORAGE_KEY,
                            )}
                            step="0.5"
                            className="mt-1 w-full h-9 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500">
                            Vertical (Y)
                          </label>
                          <input
                            type="number"
                            value={pageOffsetY}
                            onChange={handleOffsetChange(
                              setPageOffsetY,
                              ATTENDANCE_OFFSET_Y_STORAGE_KEY,
                            )}
                            step="0.5"
                            className="mt-1 w-full h-9 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400">
                        Positive X moves right; positive Y moves down. Saved for
                        next time.
                      </p>
                      <button
                        onClick={resetOffsets}
                        className="w-full h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-wide"
                      >
                        Reset Alignment
                      </button>
                    </div>

                    <button
                      onClick={handleDownloadCurrent}
                      disabled={!currentWorker || downloadCurrentLoading}
                      className="h-11 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wide disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {downloadCurrentLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download Current
                    </button>

                    <button
                      onClick={handlePrintCurrent}
                      disabled={!currentWorker || printCurrentLoading}
                      className="h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wide disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {printCurrentLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Printer className="w-4 h-4" />
                      )}
                      Print Current
                    </button>

                    <button
                      onClick={() => setIsEditing((prev) => !prev)}
                      disabled={!currentWorker}
                      className="h-11 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wide disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {isEditing ? (
                        <>
                          <Check className="w-4 h-4" /> Done Editing
                        </>
                      ) : (
                        <>
                          <Edit2 className="w-4 h-4" /> Edit Current
                        </>
                      )}
                    </button>

                    {isEditing && currentWorker && (
                      <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                        <p className="text-[11px] uppercase tracking-wider font-black text-slate-400">
                          Edit For Download
                        </p>

                        <input
                          type="text"
                          value={currentHeaderData.companyName}
                          onChange={(e) =>
                            updateCurrentOverride("companyName", e.target.value)
                          }
                          placeholder="Company Name"
                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
                        />

                        <input
                          type="text"
                          value={currentHeaderData.employeeName}
                          onChange={(e) =>
                            updateCurrentOverride(
                              "employeeName",
                              e.target.value,
                            )
                          }
                          placeholder="Employee Name"
                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
                        />

                        <input
                          type="text"
                          value={currentHeaderData.employeeNumber}
                          onChange={(e) =>
                            updateCurrentOverride(
                              "employeeNumber",
                              e.target.value,
                            )
                          }
                          placeholder="Employee Number"
                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
                        />

                        <input
                          type="text"
                          value={currentHeaderData.trade}
                          onChange={(e) =>
                            updateCurrentOverride("trade", e.target.value)
                          }
                          placeholder="Trade"
                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
                        />

                        <input
                          type="text"
                          value={currentHeaderData.siteName}
                          onChange={(e) =>
                            updateCurrentOverride("siteName", e.target.value)
                          }
                          placeholder="Site Name"
                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
                        />

                        <button
                          onClick={resetCurrentOverride}
                          className="w-full h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reset Current
                        </button>
                      </div>
                    )}

                    {validWorkers.length > 1 && (
                      <button
                        onClick={handleDownloadAll}
                        disabled={downloadAllLoading}
                        className="h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wide disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {downloadAllLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        Download All
                      </button>
                    )}

                    {validWorkers.length > 1 && (
                      <button
                        onClick={handlePrintAll}
                        disabled={printAllLoading}
                        className="h-11 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-black text-xs uppercase tracking-wide disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {printAllLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Printer className="w-4 h-4" />
                        )}
                        Print All
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default AttendanceSheetModal;
