import React, { useState, useMemo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FileSpreadsheet,
  Layers,
  Building,
  Calendar,
  Filter,
  FileText,
  Eye,
  EyeOff,
  Printer,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadWorkRecordsStatement } from "../../redux/slices/workRecordsSlice";
import { fetchWorkers } from "../../redux/slices/workerSlice";
import { fetchBuildings } from "../../redux/slices/buildingSlice";
import { workRecordsService } from "../../api/workRecordsService";
import { supervisorService } from "../../api/supervisorService";
import CustomDropdown from "../../components/ui/CustomDropdown";
import usePagePermissions from "../../utils/usePagePermissions";

// Helper to load images
const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};

const toNumberSafe = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getResidenceDueAmount = (car) => {
  return Math.max(
    0,
    toNumberSafe(car?.dueAmount ?? car?.duePayment ?? car?.balanceDue),
  );
};

const getResidenceDueDate = (car) => {
  return car?.dueDateDisplay || car?.dueDate || car?.duDate || "-";
};

const getWashMetrics = ({
  rows,
  daysInMonth,
  isCarFormat,
  year,
  month,
  columnTotals,
}) => {
  const safeDays = Math.max(0, Number(daysInMonth) || 0);
  const hasColumnTotals =
    Array.isArray(columnTotals) && columnTotals.length === safeDays;

  const totals = hasColumnTotals
    ? columnTotals.map((value) => toNumberSafe(value))
    : new Array(safeDays).fill(0);

  if (!hasColumnTotals && Array.isArray(rows)) {
    rows.forEach((row) => {
      const daily = isCarFormat ? row?.dailyMarks : row?.dailyCounts;
      if (!Array.isArray(daily)) return;
      daily.forEach((value, index) => {
        if (index >= 0 && index < totals.length) {
          totals[index] += toNumberSafe(value);
        }
      });
    });
  }

  const totalWashes = totals.reduce(
    (sum, value) => sum + toNumberSafe(value),
    0,
  );
  const dayWiseAverage = safeDays > 0 ? totalWashes / safeDays : 0;

  const now = new Date();
  const isCurrentMonth =
    Number(year) === now.getFullYear() && Number(month) === now.getMonth() + 1;
  const todayIndex = now.getDate() - 1;
  const todayWashes =
    isCurrentMonth && todayIndex >= 0 && todayIndex < totals.length
      ? toNumberSafe(totals[todayIndex])
      : 0;

  return {
    todayWashes,
    dayWiseAverage,
  };
};

const getStatusSummaryMetrics = ({
  statusCounts,
  todayStatusCounts,
  fallbackTodayWashes = 0,
}) => {
  const totalSummary = {
    washes: toNumberSafe(statusCounts?.total),
    completed: toNumberSafe(statusCounts?.completed),
    pending: toNumberSafe(statusCounts?.pending),
    rejected: toNumberSafe(statusCounts?.rejected),
  };

  const todaySummary = {
    washes: toNumberSafe(todayStatusCounts?.total ?? fallbackTodayWashes),
    completed: toNumberSafe(todayStatusCounts?.completed),
    pending: toNumberSafe(todayStatusCounts?.pending),
    rejected: toNumberSafe(todayStatusCounts?.rejected),
  };

  return {
    today: todaySummary,
    total: totalSummary,
  };
};

const WorkRecords = () => {
  const dispatch = useDispatch();
  const pp = usePagePermissions("workRecords");
  const { workers: workersList } = useSelector((state) => state.worker);
  const { buildings: buildingsList } = useSelector((state) => state.building);
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const isSupervisor = user?.role === "supervisor";
  const [teamWorkerIds, setTeamWorkerIds] = useState(null);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [loadingView, setLoadingView] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfPageSize, setPdfPageSize] = useState("a4-landscape");
  const [backendTotals, setBackendTotals] = useState(null);
  const [allBuildingsMeta, setAllBuildingsMeta] = useState({
    total: 0,
    buildingCounts: [],
  });
  const dataFetchSeq = useRef(0);
  const recordsCacheRef = useRef(new Map());

  const today = new Date();

  // Load team worker IDs for supervisor
  useEffect(() => {
    if (!isSupervisor) return;
    const loadTeam = async () => {
      try {
        const res = await supervisorService.getTeam({ limit: 1000 });
        const ids = (res.data || []).map((w) => w._id);
        setTeamWorkerIds(ids);
      } catch (error) {
        console.error("Failed to load team", error);
        setTeamWorkerIds([]);
      }
    };
    loadTeam();
  }, [isSupervisor]);

  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const maxValidYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const initialYear = maxValidYear;
  const initialMonth = maxValidYear < currentYear ? 12 : currentMonth;

  const [filters, setFilters] = useState({
    serviceType: "residence",
    month: initialMonth,
    year: initialYear,
    workerId: "",
    buildingId: "",
  });

  const serviceTypeOptions = [
    { value: "residence", label: "Residence", icon: Layers },
    { value: "mall", label: "Mall", icon: Layers },
  ];

  const yearOptions = useMemo(() => {
    const startYear = 2024;
    const years = [];
    for (let y = startYear; y <= maxValidYear; y++) {
      years.push({ value: y, label: y.toString() });
    }
    return years.reverse();
  }, [maxValidYear]);

  const availableMonths = useMemo(() => {
    const allMonths = [
      { value: 1, label: "January" },
      { value: 2, label: "February" },
      { value: 3, label: "March" },
      { value: 4, label: "April" },
      { value: 5, label: "May" },
      { value: 6, label: "June" },
      { value: 7, label: "July" },
      { value: 8, label: "August" },
      { value: 9, label: "September" },
      { value: 10, label: "October" },
      { value: 11, label: "November" },
      { value: 12, label: "December" },
    ];
    const selectedYear = Number(filters.year);
    return allMonths.filter((m) => {
      if (selectedYear < currentYear) return true;
      if (selectedYear === currentYear) {
        return m.value <= currentMonth; // Include current month
      }
      return false;
    });
  }, [filters.year, currentMonth, currentYear]);

  useEffect(() => {
    const isCurrentMonthValid = availableMonths.some(
      (m) => m.value === Number(filters.month),
    );
    if (!isCurrentMonthValid && availableMonths.length > 0) {
      setFilters((prev) => ({
        ...prev,
        month: availableMonths[availableMonths.length - 1].value,
      }));
    }
  }, [availableMonths, filters.month]);

  useEffect(() => {
    if (filters.serviceType === "residence" || filters.serviceType === "mall") {
      dispatch(fetchWorkers({ page: 1, limit: 1000, search: "", status: 1 }));
    }
  }, [dispatch, filters.serviceType]);

  useEffect(() => {
    if (filters.serviceType === "residence") {
      dispatch(fetchBuildings({ page: 1, limit: 1000, search: "" }));
    }
  }, [dispatch, filters.serviceType]);

  const filteredWorkers = useMemo(() => {
    if (!workersList || workersList.length === 0) return [];

    const normalizeServiceType = (worker) =>
      String(worker?.service_type || worker?.serviceType || "")
        .trim()
        .toLowerCase();

    const isMallWorker = (worker) => normalizeServiceType(worker) === "mall";

    let filtered = workersList;
    if (filters.serviceType === "mall") {
      filtered = filtered.filter(isMallWorker);
    } else if (filters.serviceType === "residence") {
      filtered = filtered.filter(
        (w) => normalizeServiceType(w) === "residence",
      );
    }

    // For supervisors, only show their team workers
    if (isSupervisor && teamWorkerIds && teamWorkerIds.length > 0) {
      filtered = filtered.filter((w) => teamWorkerIds.includes(w._id));
    }

    return filtered;
  }, [workersList, filters.serviceType, isSupervisor, teamWorkerIds]);

  const workersOptions = useMemo(() => {
    return filteredWorkers.map((w) => ({ value: w._id, label: w.name }));
  }, [filteredWorkers]);

  const selectedWorker = useMemo(() => {
    if (!filters.workerId) return null;
    return (
      filteredWorkers.find(
        (worker) => String(worker?._id || "") === String(filters.workerId),
      ) || null
    );
  }, [filteredWorkers, filters.workerId]);

  const buildingCountMap = useMemo(() => {
    const map = new Map();
    (allBuildingsMeta?.buildingCounts || []).forEach((entry) => {
      const key = String(entry?.buildingId || "").trim();
      if (!key) return;
      map.set(key, toNumberSafe(entry?.count));
    });
    return map;
  }, [allBuildingsMeta?.buildingCounts]);

  const buildingOptions = useMemo(() => {
    if (String(filters.serviceType).toLowerCase() !== "residence") {
      return [{ value: "", label: "All Buildings" }];
    }

    const allAllowedBuildings =
      isSupervisor &&
      Array.isArray(user?.buildings) &&
      user.buildings.length > 0
        ? (buildingsList || []).filter((building) =>
            user.buildings
              .map((id) => String(id))
              .includes(String(building?._id || "")),
          )
        : buildingsList || [];

    const workerBuildingIds = new Set(
      (selectedWorker?.buildings || [])
        .map((building) => {
          if (typeof building === "string") return building;
          return building?._id || building?.id || "";
        })
        .map((id) => String(id || "").trim())
        .filter((id) => !!id),
    );

    const allowedBuildings =
      workerBuildingIds.size > 0
        ? allAllowedBuildings.filter((building) =>
            workerBuildingIds.has(String(building?._id || "")),
          )
        : selectedWorker
          ? []
          : allAllowedBuildings;

    const allCount = toNumberSafe(allBuildingsMeta?.total);

    return [
      {
        value: "",
        label: `All Buildings (${allCount})`,
      },
      ...allowedBuildings.map((building) => {
        const id = String(building?._id || "");
        const count = buildingCountMap.get(id) || 0;
        return {
          value: id,
          label: `${building?.name || "Unknown Building"} (${count})`,
        };
      }),
    ];
  }, [
    filters.serviceType,
    isSupervisor,
    user?.buildings,
    buildingsList,
    buildingCountMap,
    allBuildingsMeta?.total,
    selectedWorker,
  ]);

  const selectedBuildingName = useMemo(() => {
    if (String(filters.serviceType).toLowerCase() !== "residence") return "";
    if (!filters.buildingId) return "";

    const matchedBuilding = (buildingsList || []).find(
      (building) => String(building?._id || "") === String(filters.buildingId),
    );
    if (matchedBuilding?.name) return matchedBuilding.name;

    const matchedRow = (viewData || []).find(
      (row) => String(row?.buildingId || "") === String(filters.buildingId),
    );
    return matchedRow?.buildingName || "";
  }, [filters.serviceType, filters.buildingId, buildingsList, viewData]);

  useEffect(() => {
    if (!filters.buildingId) return;
    const stillValid = buildingOptions.some(
      (option) => String(option.value || "") === String(filters.buildingId),
    );
    if (!stillValid) {
      setFilters((prev) => ({ ...prev, buildingId: "" }));
    }
  }, [buildingOptions, filters.buildingId]);

  useEffect(() => {
    if (String(filters.serviceType).toLowerCase() !== "residence") {
      setFilters((prev) =>
        prev.buildingId ? { ...prev, buildingId: "" } : prev,
      );
    }
  }, [filters.serviceType]);

  useEffect(() => {
    if (String(filters.serviceType).toLowerCase() !== "residence") {
      setAllBuildingsMeta({ total: 0, buildingCounts: [] });
      return;
    }

    if (availableMonths.length === 0) return;
    if (isSupervisor && teamWorkerIds === null) return;

    if (!filters.buildingId) {
      setAllBuildingsMeta({
        total: toNumberSafe(backendTotals?.total ?? viewData?.length ?? 0),
        buildingCounts: Array.isArray(backendTotals?.buildingCounts)
          ? backendTotals.buildingCounts
          : [],
      });
      return;
    }

    let isActive = true;

    const loadAllBuildingsMeta = async () => {
      try {
        const response = await workRecordsService.getStatementData(
          filters.year,
          filters.month,
          filters.serviceType,
          filters.serviceType === "residence" || filters.serviceType === "mall"
            ? filters.workerId
            : "",
          isSupervisor && !filters.workerId ? teamWorkerIds : null,
          { buildingId: "" },
        );

        if (!isActive) return;

        const unfilteredData =
          response?.data || (Array.isArray(response) ? response : []);

        setAllBuildingsMeta({
          total: toNumberSafe(response?.total ?? unfilteredData.length),
          buildingCounts: Array.isArray(response?.buildingCounts)
            ? response.buildingCounts
            : [],
        });
      } catch (error) {
        if (!isActive) return;
        console.error("Failed to load all-building counts", error);
      }
    };

    loadAllBuildingsMeta();

    return () => {
      isActive = false;
    };
  }, [
    filters.serviceType,
    filters.year,
    filters.month,
    filters.workerId,
    filters.buildingId,
    availableMonths.length,
    isSupervisor,
    teamWorkerIds,
    backendTotals?.total,
    backendTotals?.buildingCounts,
    viewData?.length,
  ]);

  const pageSizeOptions = [
    { value: "a4-landscape", label: "A4 Landscape" },
    { value: "a5-landscape", label: "A5 Landscape" },
  ];

  // Auto-load data
  useEffect(() => {
    const loadData = async () => {
      if (availableMonths.length === 0) {
        setViewData(null);
        setShowPreview(false);
        return;
      }

      // Wait for team worker IDs to load for supervisors
      if (isSupervisor && teamWorkerIds === null) return;

      const workersKey = isSupervisor
        ? JSON.stringify(teamWorkerIds || [])
        : "all";
      const cacheKey = JSON.stringify({
        year: filters.year,
        month: filters.month,
        serviceType: filters.serviceType,
        workerId: filters.workerId || "",
        buildingId: filters.buildingId || "",
        workersKey,
      });

      const cached = recordsCacheRef.current.get(cacheKey);
      if (cached) {
        setBackendTotals(cached.totals);
        setViewData(cached.normalizedData);
        setShowPreview(cached.normalizedData.length > 0);
        setLoadingView(false);
        return;
      }

      const requestSeq = ++dataFetchSeq.current;

      setLoadingView(true);

      try {
        const response = await workRecordsService.getStatementData(
          filters.year,
          filters.month,
          filters.serviceType,
          filters.serviceType === "residence" || filters.serviceType === "mall"
            ? filters.workerId
            : "",
          isSupervisor && !filters.workerId ? teamWorkerIds : null,
          {
            buildingId:
              String(filters.serviceType).toLowerCase() === "residence"
                ? filters.buildingId
                : "",
          },
        );
        const data =
          response?.data || (Array.isArray(response) ? response : []);
        const totals = response?.columnTotals
          ? {
              columnTotals: response.columnTotals,
              grandTotal: response.grandTotal || 0,
              totalTips: response.totalTips || 0,
              total: response.total || data.length,
              statusCounts: response.statusCounts || null,
              todayStatusCounts: response.todayStatusCounts || null,
              buildingCounts: response.buildingCounts || [],
            }
          : null;

        if (requestSeq !== dataFetchSeq.current) return;
        setBackendTotals(totals);

        console.log("📊 Raw API Response:", response);

        if (!data || data.length === 0) {
          setViewData(null);
          setShowPreview(false);
        } else {
          // Log first item to check schedule data
          if (data[0]) {
            console.log("🔍 First car data:", {
              scheduleType: data[0].scheduleType,
              scheduleDays: data[0].scheduleDays,
              cleaning: data[0].cleaning,
              startDate: data[0].startDate,
              endDate: data[0].endDate,
            });

            // Test schedule matching for December 2025
            const testDate = new Date(2025, 11, 2); // Dec 2, 2025 (Monday)
            const dayNames = [
              "sunday",
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
            ];
            const testDayName = dayNames[testDate.getDay()];
            const isMatched = data[0].scheduleDays?.some(
              (d) => String(d).toLowerCase() === testDayName,
            );
            console.log(
              `🧪 Test: Dec 2, 2025 is ${testDayName}, matched: ${isMatched}, scheduleDays:`,
              data[0].scheduleDays,
            );
          }

          // Normalize data
          const normalizedData = data.map((item, index) => {
            if (item.daily && !item.dailyCounts) {
              return {
                slNo: index + 1,
                name: item.name,
                dailyCounts: item.daily,
                tips: item.amount || 0, // Backend returns tips in 'amount' field
                internalCount: item.internalCount || 0,
                externalCount: item.externalCount || 0,
                internalExternalCount: item.internalExternalCount || 0,
              };
            }
            return item;
          });

          console.log("✅ Normalized Data with Tips:", normalizedData);

          recordsCacheRef.current.set(cacheKey, {
            normalizedData,
            totals,
            cachedAt: Date.now(),
          });

          // Simple cache cap to prevent memory growth
          if (recordsCacheRef.current.size > 25) {
            const firstKey = recordsCacheRef.current.keys().next().value;
            if (firstKey) recordsCacheRef.current.delete(firstKey);
          }

          setViewData(normalizedData);
          setShowPreview(true);
          setCurrentPage(1);
        }
      } catch (error) {
        if (requestSeq !== dataFetchSeq.current) return;
        console.error("Error loading data:", error);
        setViewData(null);
        setShowPreview(false);
      } finally {
        if (requestSeq !== dataFetchSeq.current) return;
        setLoadingView(false);
      }
    };

    loadData();
  }, [
    filters.serviceType,
    filters.month,
    filters.year,
    filters.workerId,
    filters.buildingId,
    availableMonths.length,
    teamWorkerIds,
  ]);

  const handleDownloadExcel = async () => {
    const toastId = toast.loading(`Generating Excel report...`);
    try {
      const result = await dispatch(
        downloadWorkRecordsStatement({
          serviceType: filters.serviceType,
          month: filters.month,
          year: filters.year,
          workerId:
            filters.serviceType === "residence" ||
            filters.serviceType === "mall"
              ? filters.workerId
              : "",
          workers:
            isSupervisor && !filters.workerId ? teamWorkerIds || [] : null,
          buildingId:
            String(filters.serviceType).toLowerCase() === "residence"
              ? filters.buildingId
              : "",
          buildingName:
            String(filters.serviceType).toLowerCase() === "residence"
              ? selectedBuildingName
              : "",
        }),
      ).unwrap();
      const blob = result.blob;
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Statement_${filters.serviceType}_${filters.year}_${filters.month}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel Download successful!", { id: toastId });
    } catch (error) {
      console.error("Download Error:", error);
      toast.error("Failed to download Excel.", { id: toastId });
    }
  };

  const handleDownloadPDF = async (selectedSize) => {
    setShowPdfModal(false);
    setPdfLoading(true);
    const toastId = toast.loading("Generating PDF...");

    try {
      let data = viewData;
      let statusCounts = backendTotals?.statusCounts || null;
      let todayStatusCounts = backendTotals?.todayStatusCounts || null;
      if (!data) {
        const response = await workRecordsService.getStatementData(
          filters.year,
          filters.month,
          filters.serviceType,
          filters.serviceType === "residence" || filters.serviceType === "mall"
            ? filters.workerId
            : "",
          isSupervisor && !filters.workerId ? teamWorkerIds : null,
          {
            buildingId:
              String(filters.serviceType).toLowerCase() === "residence"
                ? filters.buildingId
                : "",
          },
        );
        data = response?.data || (Array.isArray(response) ? response : []);
        statusCounts = response?.statusCounts || statusCounts;
        todayStatusCounts = response?.todayStatusCounts || todayStatusCounts;
      }

      if (!data || data.length === 0) {
        toast.error("No records found", { id: toastId });
        setPdfLoading(false);
        return;
      }

      const isCarFormat =
        data[0]?.parkingNo !== undefined || data[0]?.carNumber !== undefined;
      const isResidenceCarFormat =
        isCarFormat &&
        String(filters.serviceType).toLowerCase() === "residence";
      const isMallWorkerFormat =
        !isCarFormat && String(filters.serviceType).toLowerCase() === "mall";

      const currentSize = selectedSize || pdfPageSize;
      const [format, orientation] = currentSize.split("-");

      const doc = new jsPDF(orientation, "mm", format);
      const monthName =
        availableMonths.find((m) => m.value === filters.month)?.label || "";
      const pageWidth = doc.internal.pageSize.getWidth();
      const selectedBuildingLabel =
        String(filters.serviceType).toLowerCase() === "residence" &&
        filters.buildingId
          ? selectedBuildingName || ""
          : "";

      try {
        const logoImg = await loadImage("/carwash.jpeg");
        const imgWidth = 25;
        const imgHeight = 25;
        const xPos = (pageWidth - imgWidth) / 2;
        doc.addImage(logoImg, "JPEG", xPos, 10, imgWidth, imgHeight);
      } catch (e) {
        console.warn("Logo load failed", e);
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("BABA CAR WASHING AND CLEANING LLC", pageWidth / 2, 42, {
        align: "center",
      });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Month & Year: ${monthName.toUpperCase()} ${filters.year}`,
        pageWidth / 2,
        50,
        { align: "center" },
      );

      if (selectedBuildingLabel) {
        doc.text(
          `Building: ${selectedBuildingLabel.toUpperCase()}`,
          pageWidth / 2,
          56,
          { align: "center" },
        );
      }

      const pdfTableStartY = selectedBuildingLabel ? 62 : 58;

      const daysInMonth = new Date(filters.year, filters.month, 0).getDate();
      const daysHeader = Array.from({ length: daysInMonth }, (_, i) =>
        (i + 1).toString(),
      );
      const dayNames = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(filters.year, filters.month - 1, i + 1);
        return ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][date.getDay()];
      });

      let tableHead, tableBody;

      // Table Construction
      if (isCarFormat) {
        tableHead = [
          [
            "S.NO",
            "Parking No",
            "Car No.",
            "Date of Start",
            "Cleaning",
            ...daysHeader,
            isResidenceCarFormat ? "Due Payment" : "Total",
            isResidenceCarFormat ? "Due Date" : "Tips",
          ],
          ["", "", "", "", "", ...dayNames, "", ""],
        ];

        tableBody = data.map((car, index) => {
          const marks = car.dailyMarks || Array(daysInMonth).fill(0);
          const total = marks.reduce((sum, m) => sum + m, 0);
          const dueAmount = getResidenceDueAmount(car);
          const dueDate = getResidenceDueDate(car);
          return [
            index + 1,
            car.parkingNo || "-",
            car.carNumber || "-",
            car.dateOfStart || "-",
            car.cleaning || "W3",
            ...marks.map((m) => (m > 0 ? m.toString() : "")),
            isResidenceCarFormat ? dueAmount.toFixed(2) : total,
            isResidenceCarFormat ? dueDate : car.tips || 0,
          ];
        });
      } else {
        tableHead = isMallWorkerFormat
          ? [
              [
                "Sl.No",
                "Name",
                ...daysHeader,
                "Internal",
                "External",
                "Int+Ext",
                "Total",
                "Tips",
              ],
              ["", "", ...dayNames, "", "", "", "", ""],
            ]
          : [
              ["Sl.No", "Name", ...daysHeader, "Total", "Tips"],
              ["", "", ...dayNames, "", ""],
            ];

        tableBody = data.map((worker, index) => {
          const counts = worker.dailyCounts || Array(daysInMonth).fill(0);
          const total = counts.reduce((sum, c) => sum + c, 0);
          const tips = worker.tips || 0;
          if (isMallWorkerFormat) {
            return [
              worker.slNo || index + 1,
              worker.name || "-",
              ...counts.map((count) => (count > 0 ? count.toString() : "")),
              worker.internalCount || 0,
              worker.externalCount || 0,
              worker.internalExternalCount || 0,
              total,
              tips,
            ];
          }

          return [
            worker.slNo || index + 1,
            worker.name || "-",
            ...counts.map((count) => (count > 0 ? count.toString() : "")),
            total,
            tips,
          ];
        });

        // Totals Row
        const dailyTotals = Array(daysInMonth).fill(0);
        let grandTotal = 0;
        let totalTips = 0;
        let totalInternalCount = 0;
        let totalExternalCount = 0;
        let totalInternalExternalCount = 0;

        data.forEach((worker) => {
          const counts = worker.dailyCounts || Array(daysInMonth).fill(0);
          counts.forEach((count, i) => (dailyTotals[i] += count));
          grandTotal += counts.reduce((sum, c) => sum + c, 0);
          totalTips += worker.tips || 0;
          totalInternalCount += worker.internalCount || 0;
          totalExternalCount += worker.externalCount || 0;
          totalInternalExternalCount += worker.internalExternalCount || 0;
        });

        if (isMallWorkerFormat) {
          tableBody.push([
            {
              content: "TOTAL",
              colSpan: 2,
              styles: { halign: "center", fontStyle: "bold" },
            },
            ...dailyTotals.map((t) => ({
              content: t.toString(),
              styles: { fontStyle: "bold" },
            })),
            {
              content: totalInternalCount.toString(),
              styles: { fontStyle: "bold" },
            },
            {
              content: totalExternalCount.toString(),
              styles: { fontStyle: "bold" },
            },
            {
              content: totalInternalExternalCount.toString(),
              styles: { fontStyle: "bold" },
            },
            { content: grandTotal.toString(), styles: { fontStyle: "bold" } },
            { content: totalTips.toString(), styles: { fontStyle: "bold" } },
          ]);
        } else {
          tableBody.push([
            {
              content: "TOTAL",
              colSpan: 2,
              styles: { halign: "center", fontStyle: "bold" },
            },
            ...dailyTotals.map((t) => ({
              content: t.toString(),
              styles: { fontStyle: "bold" },
            })),
            { content: grandTotal.toString(), styles: { fontStyle: "bold" } },
            { content: totalTips.toString(), styles: { fontStyle: "bold" } },
          ]);
        }
      }

      // --- DYNAMIC WIDTH CALCULATION (Fits content to page width) ---
      const availableWidth = pageWidth - 20; // 10mm margin each side
      let fontSize, cellPadding;

      if (format === "a5") {
        fontSize = 4.5;
        cellPadding = 0.5;
      } else {
        fontSize = 6;
        cellPadding = 0.8;
      }

      const columnStyles = {};

      if (isCarFormat) {
        // Define fixed widths for metadata columns
        const slNoWidth = 6;
        const parkingWidth = 12;
        const carWidth = 12;
        const dateWidth = 12;
        const cleanWidth = 8;
        const totalWidth = 8;
        const tipsWidth = 8;

        const fixedWidth =
          slNoWidth +
          parkingWidth +
          carWidth +
          dateWidth +
          cleanWidth +
          totalWidth +
          tipsWidth;
        const remainingWidth = availableWidth - fixedWidth;

        // Distribute remaining width to day columns
        const dayColWidth = remainingWidth / daysInMonth;

        columnStyles[0] = { cellWidth: slNoWidth };
        columnStyles[1] = { cellWidth: parkingWidth };
        columnStyles[2] = { cellWidth: carWidth };
        columnStyles[3] = { cellWidth: dateWidth };
        columnStyles[4] = { cellWidth: cleanWidth };

        // Days columns
        for (let i = 0; i < daysInMonth; i++) {
          columnStyles[5 + i] = { cellWidth: dayColWidth };
        }

        columnStyles[5 + daysInMonth] = { cellWidth: totalWidth };
        columnStyles[6 + daysInMonth] = { cellWidth: tipsWidth };
      } else {
        const slNoWidth = 8;
        const nameWidth = format === "a5" ? 24 : 32;
        const typeCountWidth = format === "a5" ? 9 : 11;
        const totalWidth = format === "a5" ? 9 : 11;
        const tipsWidth = format === "a5" ? 9 : 11;

        const fixedWidth = isMallWorkerFormat
          ? slNoWidth + nameWidth + typeCountWidth * 3 + totalWidth + tipsWidth
          : slNoWidth + nameWidth + totalWidth + tipsWidth;
        const remainingWidth = availableWidth - fixedWidth;
        const dayColWidth = remainingWidth / daysInMonth;

        columnStyles[0] = { cellWidth: slNoWidth };
        columnStyles[1] = { cellWidth: nameWidth };

        for (let i = 0; i < daysInMonth; i++) {
          columnStyles[2 + i] = { cellWidth: dayColWidth };
        }

        if (isMallWorkerFormat) {
          columnStyles[2 + daysInMonth] = { cellWidth: typeCountWidth };
          columnStyles[3 + daysInMonth] = { cellWidth: typeCountWidth };
          columnStyles[4 + daysInMonth] = { cellWidth: typeCountWidth };
          columnStyles[5 + daysInMonth] = { cellWidth: totalWidth };
          columnStyles[6 + daysInMonth] = { cellWidth: tipsWidth };
        } else {
          columnStyles[2 + daysInMonth] = { cellWidth: totalWidth };
          columnStyles[3 + daysInMonth] = { cellWidth: tipsWidth };
        }
      }

      autoTable(doc, {
        startY: pdfTableStartY,
        head: tableHead,
        body: tableBody,
        theme: "grid",
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          halign: "center",
          fontSize: fontSize + 0.5,
          cellPadding: cellPadding,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
        },
        bodyStyles: {
          fontSize: fontSize,
          cellPadding: cellPadding,
          halign: "center",
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255],
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
        },
        columnStyles: columnStyles,
        margin: { left: 10, right: 10 },
      });

      const washMetrics = getWashMetrics({
        rows: data,
        daysInMonth,
        isCarFormat,
        year: filters.year,
        month: filters.month,
      });

      if (statusCounts) {
        const statusSummary = getStatusSummaryMetrics({
          statusCounts,
          todayStatusCounts,
          fallbackTodayWashes: washMetrics.todayWashes,
        });

        const marginX = 10;
        const gap = 4;
        const cardWidth = (pageWidth - marginX * 2 - gap) / 2;
        const cardHeight = 28;
        const lineGap = 5;
        const pageHeight = doc.internal.pageSize.getHeight();
        let cardY = (doc.lastAutoTable?.finalY || pdfTableStartY) + 6;

        if (cardY + cardHeight > pageHeight - 6) {
          doc.addPage();
          cardY = 14;
        }

        const drawSummaryCard = ({
          x,
          title,
          headerColor,
          bodyColor,
          borderColor,
          metrics,
          todayPrefix,
        }) => {
          doc.setDrawColor(...borderColor);
          doc.setFillColor(...bodyColor);
          doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, "FD");

          doc.setFillColor(...headerColor);
          doc.roundedRect(x, cardY, cardWidth, 6.5, 2, 2, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(255, 255, 255);
          doc.text(title, x + 2.5, cardY + 4.6);

          doc.setFontSize(8);
          doc.setTextColor(33, 37, 41);

          const lines = todayPrefix
            ? [
                ["Today Washes", metrics.washes],
                ["Today Completed", metrics.completed],
                ["Today Pending", metrics.pending],
                ["Today Rejected", metrics.rejected],
              ]
            : [
                ["Total Washes", metrics.washes],
                ["Completed", metrics.completed],
                ["Pending", metrics.pending],
                ["Rejected", metrics.rejected],
              ];

          lines.forEach(([label, value], index) => {
            const y = cardY + 10.5 + index * lineGap;
            doc.setFont("helvetica", "bold");
            doc.text(String(label), x + 2.5, y);
            doc.setFont("helvetica", "normal");
            doc.text(String(value), x + cardWidth - 2.5, y, { align: "right" });
          });
        };

        drawSummaryCard({
          x: marginX,
          title: "TODAY SUMMARY",
          headerColor: [13, 148, 136],
          bodyColor: [240, 253, 250],
          borderColor: [45, 212, 191],
          metrics: statusSummary.today,
          todayPrefix: true,
        });

        drawSummaryCard({
          x: marginX + cardWidth + gap,
          title: "TOTAL SUMMARY",
          headerColor: [30, 64, 175],
          bodyColor: [239, 246, 255],
          borderColor: [147, 197, 253],
          metrics: statusSummary.total,
          todayPrefix: false,
        });
      }

      doc.save(
        `Work_Records_${filters.serviceType}_${monthName}_${filters.year}.pdf`,
      );
      toast.success("PDF Generated!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF", { id: toastId });
    } finally {
      setPdfLoading(false);
    }
  };

  const renderCalendarView = () => {
    if (!viewData || viewData.length === 0) return null;

    const daysInMonth = new Date(filters.year, filters.month, 0).getDate();
    const monthName = availableMonths.find(
      (m) => m.value === filters.month,
    )?.label;
    const isCarFormat =
      viewData[0]?.parkingNo !== undefined ||
      viewData[0]?.carNumber !== undefined;
    const isResidenceCarFormat =
      isCarFormat && String(filters.serviceType).toLowerCase() === "residence";
    const isMallWorkerFormat =
      !isCarFormat && String(filters.serviceType).toLowerCase() === "mall";

    const washMetrics = getWashMetrics({
      rows: viewData,
      daysInMonth,
      isCarFormat,
      year: filters.year,
      month: filters.month,
      columnTotals: backendTotals?.columnTotals,
    });
    const statusSummary = getStatusSummaryMetrics({
      statusCounts: backendTotals?.statusCounts,
      todayStatusCounts: backendTotals?.todayStatusCounts,
      fallbackTodayWashes: washMetrics.todayWashes,
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = viewData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(viewData.length / itemsPerPage);
    const shouldShowFinalSummary =
      currentPage === totalPages || totalPages === 0;

    return (
      <div className="mt-8 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 rounded-t-2xl"></div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-700">
              Work Records - {monthName} {filters.year}
              <span className="text-sm text-slate-500 ml-3">
                ({backendTotals?.total || viewData.length} records)
              </span>
            </h2>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 text-slate-400 hover:text-slate-600"
            >
              <EyeOff className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-blue-900 text-white">
                  {isCarFormat ? (
                    <>
                      <th className="border border-slate-300 p-1 sticky left-0 z-10 bg-blue-900">
                        S.NO
                      </th>
                      <th className="border border-slate-300 p-1 min-w-[80px]">
                        Parking No
                      </th>
                      <th className="border border-slate-300 p-1 min-w-[80px]">
                        Car No.
                      </th>
                      <th className="border border-slate-300 p-1 min-w-[80px]">
                        Date of Start
                      </th>
                      <th className="border border-slate-300 p-1">Clean</th>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const date = new Date(
                          filters.year,
                          filters.month - 1,
                          i + 1,
                        );
                        return (
                          <th
                            key={i}
                            className={`border border-slate-300 p-1 ${date.getDay() === 0 ? "bg-yellow-500 text-black" : ""}`}
                          >
                            {i + 1}
                          </th>
                        );
                      })}
                      <th className="border border-slate-300 p-1">
                        {isResidenceCarFormat ? "Due Payment" : "Total"}
                      </th>
                      <th className="border border-slate-300 p-1">
                        {isResidenceCarFormat ? "Due Date" : "Tips"}
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="border border-slate-300 p-2 sticky left-0 z-10 bg-blue-900">
                        Sl.No
                      </th>
                      <th className="border border-slate-300 p-2 min-w-[150px]">
                        Name
                      </th>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const date = new Date(
                          filters.year,
                          filters.month - 1,
                          i + 1,
                        );
                        return (
                          <th
                            key={i}
                            className={`border border-slate-300 p-1 ${date.getDay() === 0 ? "bg-yellow-500 text-black" : ""}`}
                          >
                            {i + 1}
                          </th>
                        );
                      })}
                      {isMallWorkerFormat && (
                        <>
                          <th className="border border-slate-300 p-1">
                            Internal
                          </th>
                          <th className="border border-slate-300 p-1">
                            External
                          </th>
                          <th className="border border-slate-300 p-1">
                            Int+Ext
                          </th>
                        </>
                      )}
                      <th className="border border-slate-300 p-1">Total</th>
                      <th className="border border-slate-300 p-1">Tips</th>
                    </>
                  )}
                </tr>
                {/* Secondary Header Row */}
                <tr className="bg-slate-100 text-slate-600 font-semibold">
                  {isCarFormat ? (
                    <>
                      <th
                        colSpan="5"
                        className="border border-slate-300 p-1"
                      ></th>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const date = new Date(
                          filters.year,
                          filters.month - 1,
                          i + 1,
                        );
                        const dayName = [
                          "Su",
                          "Mo",
                          "Tu",
                          "We",
                          "Th",
                          "Fr",
                          "Sa",
                        ][date.getDay()];
                        return (
                          <th
                            key={i}
                            className={`border border-slate-300 p-1 ${date.getDay() === 0 ? "bg-yellow-200" : ""}`}
                          >
                            {dayName}
                          </th>
                        );
                      })}
                      <th
                        colSpan="2"
                        className="border border-slate-300 p-1"
                      ></th>
                    </>
                  ) : (
                    <>
                      <th
                        colSpan="2"
                        className="border border-slate-300 p-1"
                      ></th>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const date = new Date(
                          filters.year,
                          filters.month - 1,
                          i + 1,
                        );
                        const dayName = [
                          "Su",
                          "Mo",
                          "Tu",
                          "We",
                          "Th",
                          "Fr",
                          "Sa",
                        ][date.getDay()];
                        return (
                          <th
                            key={i}
                            className={`border border-slate-300 p-1 ${date.getDay() === 0 ? "bg-yellow-200" : ""}`}
                          >
                            {dayName}
                          </th>
                        );
                      })}
                      <th
                        colSpan={isMallWorkerFormat ? "5" : "2"}
                        className="border border-slate-300 p-1"
                      ></th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {isCarFormat ? (
                  <>
                    {currentItems.map((car, index) => {
                      const globalIndex = indexOfFirstItem + index;

                      // Calculate total SCHEDULED days from dailyMarks
                      const totalScheduledDays = car.dailyMarks
                        ? car.dailyMarks.reduce(
                            (sum, mark) => sum + (mark || 0),
                            0,
                          )
                        : 0;

                      // Check if vehicle is deactivated (ended before this month)
                      const monthStart = new Date(
                        filters.year,
                        filters.month - 1,
                        1,
                      );
                      const isDeactivated =
                        car.endDate && new Date(car.endDate) < monthStart;

                      return (
                        <tr
                          key={globalIndex}
                          className={`hover:bg-slate-50 ${isDeactivated ? "opacity-60" : ""}`}
                        >
                          <td
                            className={`border border-slate-300 p-1 text-center font-semibold sticky left-0 bg-white ${isDeactivated ? "line-through" : ""}`}
                          >
                            {globalIndex + 1}
                          </td>
                          <td
                            className={`border border-slate-300 p-1 text-center ${isDeactivated ? "line-through" : ""}`}
                          >
                            {car.parkingNo || "-"}
                          </td>
                          <td
                            className={`border border-slate-300 p-1 text-center ${isDeactivated ? "line-through" : ""}`}
                          >
                            {car.carNumber || "-"}
                          </td>
                          <td
                            className={`border border-slate-300 p-1 text-center ${isDeactivated ? "line-through" : ""}`}
                          >
                            {car.dateOfStart || "-"}
                          </td>
                          <td
                            className={`border border-slate-300 p-1 text-center ${isDeactivated ? "line-through" : ""}`}
                          >
                            {car.cleaning || "W3"}
                          </td>
                          {isDeactivated ? (
                            <td
                              colSpan={daysInMonth}
                              className="border border-slate-300 p-2 text-center text-red-600 font-semibold italic"
                            >
                              Schedule Ended on{" "}
                              {new Date(car.endDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </td>
                          ) : (
                            Array.from(
                              { length: daysInMonth },
                              (_, dayIndex) => {
                                const date = new Date(
                                  filters.year,
                                  filters.month - 1,
                                  dayIndex + 1,
                                );

                                // Use the dailyMarks from backend instead of recalculating
                                const mark =
                                  car.dailyMarks && car.dailyMarks[dayIndex]
                                    ? car.dailyMarks[dayIndex]
                                    : 0;
                                const isScheduled = mark > 0;

                                return (
                                  <td
                                    key={dayIndex}
                                    className={`border border-slate-300 p-1 text-center ${date.getDay() === 0 ? "bg-yellow-100" : ""} ${isScheduled ? "font-bold text-green-600" : ""}`}
                                  >
                                    {mark > 0 ? mark : ""}
                                  </td>
                                );
                              },
                            )
                          )}
                          <td
                            className={`border border-slate-300 p-1 text-center font-bold text-blue-600 ${isDeactivated ? "line-through" : ""}`}
                          >
                            {isResidenceCarFormat
                              ? getResidenceDueAmount(car).toFixed(2)
                              : isDeactivated
                                ? "-"
                                : totalScheduledDays}
                          </td>
                          <td
                            className={`border border-slate-300 p-1 text-center ${isDeactivated ? "line-through" : ""}`}
                          >
                            {isResidenceCarFormat
                              ? getResidenceDueDate(car)
                              : isDeactivated
                                ? "-"
                                : car.tips || 0}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {currentItems.map((worker, workerIndex) => {
                      const globalIndex = indexOfFirstItem + workerIndex;
                      const counts =
                        worker.dailyCounts || Array(daysInMonth).fill(0);
                      const total = counts.reduce((sum, c) => sum + c, 0);
                      const tips = worker.tips || 0;
                      const internalCount = worker.internalCount || 0;
                      const externalCount = worker.externalCount || 0;
                      const internalExternalCount =
                        worker.internalExternalCount || 0;
                      return (
                        <tr key={globalIndex} className="hover:bg-slate-50">
                          <td className="border border-slate-300 p-2 text-center font-semibold sticky left-0 bg-white">
                            {worker.slNo || globalIndex + 1}
                          </td>
                          <td className="border border-slate-300 p-2 font-medium">
                            {worker.name || "-"}
                          </td>
                          {Array.from(
                            { length: daysInMonth },
                            (_, dayIndex) => {
                              const date = new Date(
                                filters.year,
                                filters.month - 1,
                                dayIndex + 1,
                              );
                              const count = counts[dayIndex] || 0;
                              return (
                                <td
                                  key={dayIndex}
                                  className={`border border-slate-300 p-1 text-center ${date.getDay() === 0 ? "bg-yellow-100" : ""} ${count > 0 ? "font-bold text-green-600" : ""}`}
                                >
                                  {count > 0 ? count : ""}
                                </td>
                              );
                            },
                          )}
                          {isMallWorkerFormat && (
                            <>
                              <td className="border border-slate-300 p-1 text-center font-semibold text-indigo-600">
                                {internalCount}
                              </td>
                              <td className="border border-slate-300 p-1 text-center font-semibold text-indigo-600">
                                {externalCount}
                              </td>
                              <td className="border border-slate-300 p-1 text-center font-semibold text-indigo-600">
                                {internalExternalCount}
                              </td>
                            </>
                          )}
                          <td className="border border-slate-300 p-1 text-center font-bold text-blue-600">
                            {total}
                          </td>
                          <td className="border border-slate-300 p-1 text-center">
                            {tips}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                )}
              </tbody>
              {(currentPage === totalPages || totalPages === 0) && (
                <tfoot>
                  {isCarFormat ? (
                    /* Total Row for Worker Schedule */
                    <tr className="bg-slate-200 font-bold">
                      <td
                        colSpan="5"
                        className="border border-slate-300 p-2 text-center sticky left-0 bg-slate-200 z-10"
                      >
                        TOTAL
                      </td>
                      {Array.from({ length: daysInMonth }, (_, dayIndex) => {
                        const total = backendTotals?.columnTotals
                          ? backendTotals.columnTotals[dayIndex] || 0
                          : viewData.reduce(
                              (sum, car) =>
                                sum +
                                ((car.dailyMarks && car.dailyMarks[dayIndex]) ||
                                  0),
                              0,
                            );
                        return (
                          <td
                            key={dayIndex}
                            className="border border-slate-300 p-1 text-center font-bold text-blue-600"
                          >
                            {total > 0 ? total : ""}
                          </td>
                        );
                      })}
                      <td className="border border-slate-300 p-1 text-center font-bold text-blue-600">
                        {isResidenceCarFormat
                          ? viewData
                              .reduce(
                                (sum, car) => sum + getResidenceDueAmount(car),
                                0,
                              )
                              .toFixed(2)
                          : (backendTotals?.grandTotal ??
                            viewData.reduce((sum, car) => {
                              const monthStart = new Date(
                                filters.year,
                                filters.month - 1,
                                1,
                              );
                              const isDeactivated =
                                car.endDate &&
                                new Date(car.endDate) < monthStart;
                              if (isDeactivated) return sum;

                              const totalDays = car.dailyMarks
                                ? car.dailyMarks.reduce(
                                    (s, mark) => s + (mark || 0),
                                    0,
                                  )
                                : 0;
                              return sum + totalDays;
                            }, 0))}
                      </td>
                      <td className="border border-slate-300 p-1 text-center font-bold text-blue-600">
                        {isResidenceCarFormat
                          ? "-"
                          : (backendTotals?.totalTips ??
                            viewData.reduce((sum, car) => {
                              const monthStart = new Date(
                                filters.year,
                                filters.month - 1,
                                1,
                              );
                              const isDeactivated =
                                car.endDate &&
                                new Date(car.endDate) < monthStart;
                              return sum + (isDeactivated ? 0 : car.tips || 0);
                            }, 0))}
                      </td>
                    </tr>
                  ) : (
                    /* Total Row for All Workers */
                    <tr className="bg-slate-200 font-bold">
                      <td
                        colSpan="2"
                        className="border border-slate-300 p-2 text-center sticky left-0 bg-slate-200 z-10"
                      >
                        TOTAL
                      </td>
                      {Array.from({ length: daysInMonth }, (_, dayIndex) => {
                        const total = backendTotals?.columnTotals
                          ? backendTotals.columnTotals[dayIndex] || 0
                          : viewData.reduce(
                              (sum, w) =>
                                sum +
                                ((w.dailyCounts && w.dailyCounts[dayIndex]) ||
                                  0),
                              0,
                            );
                        return (
                          <td
                            key={dayIndex}
                            className="border border-slate-300 p-1 text-center"
                          >
                            {total}
                          </td>
                        );
                      })}
                      {isMallWorkerFormat && (
                        <>
                          <td className="border border-slate-300 p-1 text-center text-indigo-700">
                            {viewData.reduce(
                              (sum, w) => sum + (w.internalCount || 0),
                              0,
                            )}
                          </td>
                          <td className="border border-slate-300 p-1 text-center text-indigo-700">
                            {viewData.reduce(
                              (sum, w) => sum + (w.externalCount || 0),
                              0,
                            )}
                          </td>
                          <td className="border border-slate-300 p-1 text-center text-indigo-700">
                            {viewData.reduce(
                              (sum, w) => sum + (w.internalExternalCount || 0),
                              0,
                            )}
                          </td>
                        </>
                      )}
                      <td className="border border-slate-300 p-1 text-center text-blue-600">
                        {backendTotals?.grandTotal ??
                          viewData.reduce(
                            (sum, w) =>
                              sum +
                              (w.dailyCounts || []).reduce((s, c) => s + c, 0),
                            0,
                          )}
                      </td>
                      <td className="border border-slate-300 p-1 text-center">
                        {backendTotals?.totalTips ??
                          viewData.reduce((sum, w) => sum + (w.tips || 0), 0)}
                      </td>
                    </tr>
                  )}
                </tfoot>
              )}
            </table>
          </div>

          {shouldShowFinalSummary && backendTotals?.statusCounts && (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 p-4 shadow-sm">
                <div className="text-[11px] font-extrabold tracking-[0.15em] text-teal-700 uppercase mb-3">
                  Today Summary
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-teal-100 bg-white/85 p-2">
                    <div className="text-[11px] font-semibold text-teal-700">
                      Today Washes
                    </div>
                    <div className="text-lg font-extrabold text-teal-900 leading-tight">
                      {statusSummary.today.washes}
                    </div>
                  </div>
                  <div className="rounded-lg border border-teal-100 bg-white/85 p-2">
                    <div className="text-[11px] font-semibold text-teal-700">
                      Today Completed
                    </div>
                    <div className="text-lg font-extrabold text-teal-900 leading-tight">
                      {statusSummary.today.completed}
                    </div>
                  </div>
                  <div className="rounded-lg border border-teal-100 bg-white/85 p-2">
                    <div className="text-[11px] font-semibold text-teal-700">
                      Today Pending
                    </div>
                    <div className="text-lg font-extrabold text-teal-900 leading-tight">
                      {statusSummary.today.pending}
                    </div>
                  </div>
                  <div className="rounded-lg border border-teal-100 bg-white/85 p-2">
                    <div className="text-[11px] font-semibold text-teal-700">
                      Today Rejected
                    </div>
                    <div className="text-lg font-extrabold text-teal-900 leading-tight">
                      {statusSummary.today.rejected}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 p-4 shadow-sm">
                <div className="text-[11px] font-extrabold tracking-[0.15em] text-blue-700 uppercase mb-3">
                  Total Summary
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-blue-100 bg-white/85 p-2">
                    <div className="text-[11px] font-semibold text-blue-700">
                      Total Washes
                    </div>
                    <div className="text-lg font-extrabold text-blue-900 leading-tight">
                      {statusSummary.total.washes}
                    </div>
                  </div>
                  <div className="rounded-lg border border-blue-100 bg-white/85 p-2">
                    <div className="text-[11px] font-semibold text-blue-700">
                      Completed
                    </div>
                    <div className="text-lg font-extrabold text-blue-900 leading-tight">
                      {statusSummary.total.completed}
                    </div>
                  </div>
                  <div className="rounded-lg border border-blue-100 bg-white/85 p-2">
                    <div className="text-[11px] font-semibold text-blue-700">
                      Pending
                    </div>
                    <div className="text-lg font-extrabold text-blue-900 leading-tight">
                      {statusSummary.total.pending}
                    </div>
                  </div>
                  <div className="rounded-lg border border-blue-100 bg-white/85 p-2">
                    <div className="text-[11px] font-semibold text-blue-700">
                      Rejected
                    </div>
                    <div className="text-lg font-extrabold text-blue-900 leading-tight">
                      {statusSummary.total.rejected}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-slate-600">
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, viewData.length)} of{" "}
                {viewData.length} records
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border rounded-lg hover:bg-slate-50 disabled:opacity-50 text-sm font-medium"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border rounded-lg hover:bg-slate-50 disabled:opacity-50 text-sm font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 relative">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 via-blue-500 to-cyan-500 rounded-t-2xl"></div>
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Filter className="w-4 h-4" /> Statement Parameters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 items-end">
            {pp.isToolbarVisible("serviceTypeFilter") && (
              <div>
                <CustomDropdown
                  label="Service Type"
                  value={filters.serviceType}
                  onChange={(val) =>
                    setFilters((prev) => ({
                      ...prev,
                      serviceType: val,
                      workerId: "",
                      buildingId: "",
                    }))
                  }
                  options={serviceTypeOptions}
                  icon={Layers}
                  placeholder="Select Service"
                />
              </div>
            )}
            {pp.isToolbarVisible("yearFilter") && (
              <div>
                <CustomDropdown
                  label="Year"
                  value={filters.year}
                  onChange={(val) =>
                    setFilters((prev) => ({ ...prev, year: Number(val) }))
                  }
                  options={yearOptions}
                  icon={Calendar}
                  placeholder="Select Year"
                />
              </div>
            )}
            {pp.isToolbarVisible("monthFilter") && (
              <div>
                <CustomDropdown
                  label="Month"
                  value={filters.month}
                  onChange={(val) =>
                    setFilters((prev) => ({ ...prev, month: Number(val) }))
                  }
                  options={availableMonths}
                  icon={Calendar}
                  placeholder={
                    availableMonths.length === 0
                      ? "No completed months"
                      : "Select Month"
                  }
                  disabled={availableMonths.length === 0}
                />
              </div>
            )}
            {pp.isToolbarVisible("workerFilter") &&
              (filters.serviceType === "residence" ||
                filters.serviceType === "mall") && (
                <div>
                  <CustomDropdown
                    label="Worker (Optional)"
                    value={filters.workerId}
                    onChange={(val) =>
                      setFilters((prev) => ({ ...prev, workerId: val }))
                    }
                    options={[
                      { value: "", label: "All Workers" },
                      ...workersOptions,
                    ]}
                    icon={Filter}
                    placeholder="Filter by Worker"
                    searchable
                  />
                </div>
              )}
            {pp.isToolbarVisible("workerFilter") &&
              String(filters.serviceType).toLowerCase() === "residence" && (
                <div>
                  <CustomDropdown
                    label="Building (Optional)"
                    value={filters.buildingId}
                    onChange={(val) =>
                      setFilters((prev) => ({ ...prev, buildingId: val || "" }))
                    }
                    options={buildingOptions}
                    icon={Building}
                    placeholder="Filter by Building"
                    searchable
                  />
                </div>
              )}
            <div className="flex gap-2">
              {pp.isToolbarVisible("exportExcel") && (
                <button
                  onClick={handleDownloadExcel}
                  disabled={pdfLoading || availableMonths.length === 0}
                  className="flex-1 h-[42px] bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 text-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel
                </button>
              )}
              {pp.isToolbarVisible("exportPdf") && (
                <button
                  onClick={() => setShowPdfModal(true)}
                  disabled={pdfLoading || availableMonths.length === 0}
                  className="flex-1 h-[42px] bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 text-xs"
                >
                  {pdfLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}{" "}
                  PDF
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPreview && renderCalendarView()}

      {loadingView && !showPreview && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading records...</p>
        </div>
      )}

      {loadingView && showPreview && (
        <div className="max-w-7xl mx-auto mt-4 flex items-center justify-center gap-2 text-indigo-600 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin" /> Refreshing records...
        </div>
      )}

      {!showPreview && !loadingView && (
        <div className="max-w-7xl mx-auto mt-16 flex flex-col items-center justify-center text-center opacity-70">
          <div className="w-32 h-32 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center mb-6 shadow-sm">
            <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center">
              <FileSpreadsheet className="w-10 h-10 text-slate-300" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-700">Ready to Export</h3>
          <p className="text-slate-500 mt-2 max-w-sm">
            Select service type, month, and year to view records.
          </p>
        </div>
      )}

      {/* PDF Settings Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" /> PDF Settings
              </h3>
              <button
                onClick={() => setShowPdfModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Select page size for the PDF report.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {pageSizeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setPdfPageSize(option.value);
                    handleDownloadPDF(option.value);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${pdfPageSize === option.value ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  <div className="font-semibold text-sm">
                    {option.label.split(" ")[0]}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {option.label.split(" ")[1]}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPdfModal(false)}
              className="w-full mt-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkRecords;
