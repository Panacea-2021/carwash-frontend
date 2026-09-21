import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  FileSpreadsheet,
  Building,
  User,
  Users,
  Loader2,
  Filter,
  Layers,
  Calendar,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Redux
import { fetchBuildings } from "../../redux/slices/buildingSlice";
import { fetchWorkers } from "../../redux/slices/workerSlice";
import { downloadCollectionSheet } from "../../redux/slices/collectionSheetSlice";

// Custom Components
import CustomDropdown from "../../components/ui/CustomDropdown";
import { paymentService } from "../../api/paymentService";
import usePagePermissions from "../../utils/usePagePermissions";

const CollectionSheet = () => {
  const dispatch = useDispatch();
  const pp = usePagePermissions("collectionSheet");
  const [searchParams, setSearchParams] = useSearchParams();

  const { buildings } = useSelector((state) => state.building);
  const { workers } = useSelector((state) => state.worker);
  const { downloading } = useSelector((state) => state.collectionSheet);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState([]); // Stores data for Table & PDF

  // --- DYNAMIC DATE LOGIC ---
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const initialYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const initialMonth = currentMonth === 1 ? 12 : currentMonth - 1;

  // Initialize filters from URL parameters or defaults
  const getInitialFilters = () => {
    return {
      serviceType: searchParams.get("serviceType") || "residence",
      building: searchParams.get("building") || "all",
      worker: searchParams.get("worker") || "all",
      month: parseInt(searchParams.get("month")) || initialMonth,
      year: parseInt(searchParams.get("year")) || initialYear,
    };
  };

  const [filters, setFilters] = useState(getInitialFilters);

  // --- MISSING VARIABLE FIXED HERE ---
  // This calculates the list of years (2024, 2025, etc.) for the dropdown
  const yearOptions = useMemo(() => {
    const startYear = 2024;
    const years = [];
    for (let y = startYear; y <= currentYear; y++) {
      years.push({ value: y, label: y.toString() });
    }
    return years.reverse();
  }, [currentYear]);

  // Calculate available months based on selected year
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
    return allMonths.filter((m) => {
      if (filters.year < currentYear) return true;
      if (filters.year === currentYear) return m.value < currentMonth;
      return false;
    });
  }, [filters.year, currentMonth, currentYear]);

  // --- EFFECTS ---

  // Sync filters with URL parameters on mount or URL change
  useEffect(() => {
    const urlFilters = getInitialFilters();
    setFilters(urlFilters);
  }, [searchParams]);

  // Initial Load of Dropdowns
  useEffect(() => {
    dispatch(fetchBuildings({ page: 1, limit: 1000 }));
    dispatch(fetchWorkers({ page: 1, limit: 1000, status: 1 }));
  }, [dispatch]);

  // Auto-correct month if invalid for the selected year
  useEffect(() => {
    const isValid = availableMonths.some((m) => m.value === filters.month);
    if (!isValid && availableMonths.length > 0) {
      setFilters((prev) => ({ ...prev, month: availableMonths[0].value }));
    }
  }, [availableMonths, filters.month]);

  // Fetch Data for Worksheet View (Auto-refresh on filter change)
  useEffect(() => {
    const loadViewData = async () => {
      if (!availableMonths.length) return;
      setViewLoading(true);
      try {
        console.log("🔵 [FRONTEND] Fetching View Data with Filters:", filters);
        console.log(
          "🔵 [FRONTEND] Current URL Params:",
          Object.fromEntries(searchParams),
        );

        const apiFilters = {
          ...filters,
          building: filters.building === "all" ? "" : filters.building,
          worker: filters.worker === "all" ? "" : filters.worker,
        };

        console.log("🔵 [FRONTEND] API Filters being sent:", apiFilters);

        const data = await paymentService.getCollectionData(apiFilters);
        console.log(
          "✅ [FRONTEND] View Data Received:",
          data?.length || 0,
          "groups",
        );

        setViewData(data || []);
      } catch (error) {
        console.error("❌ View Data Error:", error);
      } finally {
        setViewLoading(false);
      }
    };
    loadViewData();
  }, [filters, availableMonths, searchParams]);

  // --- HANDLERS ---

  const handleFilterChange = (name, value) => {
    let newFilters;
    if (name === "building") {
      newFilters = { ...filters, building: value, worker: "all" };
    } else if (name === "serviceType") {
      newFilters = { ...filters, serviceType: value, worker: "all" };
    } else {
      newFilters = { ...filters, [name]: value };
    }

    setFilters(newFilters);

    // Update URL parameters to persist state across navigation
    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val !== "all" && val !== "") {
        newSearchParams.set(key, val.toString());
      }
    });
    setSearchParams(newSearchParams);
  };

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  };

  // --- EXCEL DOWNLOAD ---
  const handleDownloadExcel = async () => {
    const toastId = toast.loading("Generating Excel Sheet...");
    try {
      console.log("🔵 [FRONTEND] Downloading Excel with Filters:", filters);
      console.log("🔵 [FRONTEND] Selected Worker ID:", filters.worker);

      const apiFilters = {
        ...filters,
        building: filters.building === "all" ? "" : filters.building,
        worker: filters.worker === "all" ? "" : filters.worker,
      };

      console.log("🔵 [FRONTEND] Excel API Filters being sent:", apiFilters);

      const result = await dispatch(
        downloadCollectionSheet(apiFilters),
      ).unwrap();
      const blob = result.blob;

      if (blob.size < 100) {
        toast.error("File appears empty.", { id: toastId });
        return;
      }

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Collection_${filters.serviceType}_${filters.month}_${filters.year}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel Download successful!", { id: toastId });
    } catch (error) {
      console.error("Download Error:", error);
      toast.error("Failed to download sheet.", { id: toastId });
    }
  };

  // --- PDF DOWNLOAD ---
  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    const toastId = toast.loading("Generating PDF...");

    try {
      console.log("🔵 [FRONTEND] Downloading PDF with Filters:", filters);
      console.log("🔵 [FRONTEND] Selected Worker ID for PDF:", filters.worker);

      let data = viewData;
      if (!data || data.length === 0) {
        // Fallback fetch if view data is empty
        const apiFilters = {
          ...filters,
          building: filters.building === "all" ? "" : filters.building,
          worker: filters.worker === "all" ? "" : filters.worker,
        };
        console.log("🔵 [FRONTEND] PDF API Filters being sent:", apiFilters);
        data = await paymentService.getCollectionData(apiFilters);
      }

      if (!data || data.length === 0) {
        toast.error("No records found", { id: toastId });
        setPdfLoading(false);
        return;
      }

      const doc = new jsPDF("landscape", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      try {
        const logoImg = await loadImage("/carwash.jpeg");
        doc.addImage(logoImg, "JPEG", (pageWidth - 25) / 2, 5, 25, 25);
      } catch (e) {
        console.warn("Logo load failed");
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("BABA CAR WASHING AND CLEANING LLC", pageWidth / 2, 35, {
        align: "center",
      });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("MONTHLY COLLECTION SHEET", pageWidth / 2, 42, {
        align: "center",
      });

      const monthName =
        availableMonths.find((m) => m.value === filters.month)?.label || "";
      doc.setFontSize(9);
      doc.text(`Period: ${monthName} ${filters.year}`, pageWidth / 2, 47, {
        align: "center",
      });

      let currentY = 55;

      data.forEach((buildingGroup, bIndex) => {
        if (bIndex > 0 || currentY > 180) {
          doc.addPage();
          currentY = 15;
        }

        buildingGroup.workers.forEach((workerGroup) => {
          if (currentY > 170) {
            doc.addPage();
            currentY = 15;
          }

          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setFillColor(240, 240, 240);
          doc.rect(10, currentY - 4, pageWidth - 20, 6, "F");
          doc.text(
            `${workerGroup.workerName}  |  ${buildingGroup.buildingName}`,
            12,
            currentY,
          );

          currentY += 4;

          const tableHead = [
            [
              "Sl",
              "Parking",
              "Car No",
              "Mobile",
              "Flat",
              "Start",
              "Sch",
              "Adv",
              "Sub.",
              "Prev",
              "Total",
              "Paid",
              "Bal",
              "Pay Date",
              "Rcpt",
              "Due Date",
              "Rem",
              "Cust Notes",
            ],
          ];

          const tableBody = workerGroup.payments.map((p) => [
            p.slNo,
            p.parkingNo,
            p.carNo,
            p.mobile,
            p.flatNo,
            p.startDate,
            p.schedule,
            p.advance,
            p.subAmount,
            p.prevDue,
            p.totalDue,
            p.paid,
            p.balance,
            p.payDate,
            p.receipt,
            p.dueDate,
            p.remarks,
            p.customerNotes || "-",
          ]);

          autoTable(doc, {
            startY: currentY,
            head: tableHead,
            body: tableBody,
            theme: "grid",
            headStyles: {
              fillColor: [30, 75, 133],
              fontSize: 6,
              halign: "center",
              valign: "middle",
            },
            bodyStyles: {
              fontSize: 6,
              cellPadding: 1,
              halign: "center",
              valign: "middle",
            },
            // Fine-tuned column widths for A4 Landscape (297mm width)
            columnStyles: {
              0: { cellWidth: 7 }, // Sl
              1: { cellWidth: 12 }, // Parking
              2: { cellWidth: 15 }, // Car
              3: { cellWidth: 17 }, // Mobile
              4: { cellWidth: 10 }, // Flat
              5: { cellWidth: 14 }, // Start
              6: { cellWidth: 11 }, // Sch
              7: { cellWidth: 8 }, // Adv
              8: { cellWidth: 11 }, // Sub
              9: { cellWidth: 11 }, // Prev
              10: { cellWidth: 11 }, // Total
              11: { cellWidth: 11 }, // Paid
              12: { cellWidth: 11 }, // Bal
              13: { cellWidth: 15 }, // Pay Date
              14: { cellWidth: 13 }, // Rcpt
              15: { cellWidth: 15 }, // Due Date
              16: { cellWidth: 18 }, // Rem
              17: { cellWidth: "auto" }, // Cust Notes (auto fills rest)
            },
            margin: { left: 10, right: 10 },
          });

          currentY = doc.lastAutoTable.finalY + 10;
        });
      });

      doc.save(`Collection_Sheet_${monthName}_${filters.year}.pdf`);
      toast.success("PDF Generated!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF", { id: toastId });
    } finally {
      setPdfLoading(false);
    }
  };

  // --- DEPENDENT OPTIONS ---
  const buildingList = useMemo(() => {
    const options = [{ value: "all", label: "All Buildings" }];
    if (buildings)
      buildings.forEach((b) => options.push({ value: b._id, label: b.name }));
    return options;
  }, [buildings]);

  const workerList = useMemo(() => {
    const options = [{ value: "all", label: "All Workers" }];
    if (!workers) return options;

    const normalizeServiceType = (worker) =>
      String(worker?.service_type || worker?.serviceType || "")
        .trim()
        .toLowerCase();

    const hasMallAssignment = (worker) =>
      (Array.isArray(worker?.malls) && worker.malls.length > 0) ||
      !!worker?.mall;

    const isMallWorker = (worker) =>
      normalizeServiceType(worker) === "mall" && hasMallAssignment(worker);

    let filteredList = workers;

    if (filters.serviceType === "onewash") {
      filteredList = filteredList.filter(isMallWorker);
    } else if (filters.serviceType === "residence") {
      filteredList = filteredList.filter(
        (w) => normalizeServiceType(w) === "residence",
      );
    }

    if (filters.building && filters.building !== "all") {
      filteredList = filteredList.filter((w) => {
        return (
          w.buildings &&
          (w.buildings.includes(filters.building) ||
            w.buildings.some(
              (b) => b === filters.building || b._id === filters.building,
            ))
        );
      });
    }

    filteredList.forEach((w) => options.push({ value: w._id, label: w.name }));
    return options;
  }, [workers, filters.building, filters.serviceType]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 relative">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 rounded-t-2xl"></div>

        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Filter className="w-4 h-4" /> Report Parameters
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 items-end">
            {pp.isToolbarVisible("serviceTypeFilter") && (
              <div className="md:col-span-1">
                <CustomDropdown
                  label="Service Type"
                  value={filters.serviceType}
                  onChange={(val) => handleFilterChange("serviceType", val)}
                  options={[
                    { value: "residence", label: "Residence", icon: Layers },
                    { value: "onewash", label: "One Wash", icon: Filter },
                  ]}
                  icon={Layers}
                />
              </div>
            )}
            {pp.isToolbarVisible("buildingFilter") && (
              <div className="md:col-span-1 xl:col-span-1">
                <CustomDropdown
                  label="Building"
                  value={filters.building}
                  onChange={(val) => handleFilterChange("building", val)}
                  options={buildingList}
                  icon={Building}
                  searchable
                />
              </div>
            )}
            {pp.isToolbarVisible("workerFilter") && (
              <div className="md:col-span-1 xl:col-span-1">
                <CustomDropdown
                  label="Worker"
                  value={filters.worker}
                  onChange={(val) => handleFilterChange("worker", val)}
                  options={workerList}
                  icon={User}
                  searchable
                />
              </div>
            )}
            {pp.isToolbarVisible("monthFilter") && (
              <div className="md:col-span-1">
                <CustomDropdown
                  label="Month"
                  value={filters.month}
                  onChange={(val) => handleFilterChange("month", Number(val))}
                  options={availableMonths}
                  icon={Calendar}
                  disabled={availableMonths.length === 0}
                />
              </div>
            )}
            {pp.isToolbarVisible("yearFilter") && (
              <div className="md:col-span-1">
                <CustomDropdown
                  label="Year"
                  value={filters.year}
                  onChange={(val) => handleFilterChange("year", Number(val))}
                  options={yearOptions}
                  icon={Calendar}
                />
              </div>
            )}
            <div className="md:col-span-1 flex gap-2">
              {pp.isToolbarVisible("exportExcel") && (
                <button
                  onClick={handleDownloadExcel}
                  disabled={
                    downloading ||
                    availableMonths.length === 0 ||
                    filters.worker === "all"
                  }
                  className="flex-1 h-[42px] bg-white border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-xs"
                >
                  {downloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}{" "}
                  Excel
                </button>
              )}
              {pp.isToolbarVisible("exportPdf") && (
                <button
                  onClick={handleDownloadPDF}
                  disabled={
                    pdfLoading ||
                    availableMonths.length === 0 ||
                    filters.worker === "all"
                  }
                  className="flex-1 h-[42px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-xs"
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

      {/* --- WORKSHEET VIEW (Table Below) --- */}
      <div className="max-w-7xl mx-auto mt-8">
        {/* Only show data when a specific worker is selected */}
        {filters.worker === "all" ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-lg border border-slate-100">
            <Users className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg font-semibold">
              Please select a specific worker
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Choose a worker from the dropdown to view their collection sheet
            </p>
          </div>
        ) : viewLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : viewData.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
            {viewData.map((group, gIdx) => (
              <div
                key={gIdx}
                className="border-b border-slate-200 last:border-0"
              >
                {group.workers.map((wGroup, wIdx) => (
                  <div key={wIdx} className="p-4">
                    <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 text-sm mb-3">
                      {wGroup.workerName} | {group.buildingName}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-500 font-bold uppercase">
                          <tr>
                            <th className="px-3 py-2">Sl</th>
                            <th className="px-3 py-2">Parking</th>
                            <th className="px-3 py-2">Car No</th>
                            <th className="px-3 py-2">Total</th>
                            <th className="px-3 py-2">Paid</th>
                            <th className="px-3 py-2">Balance</th>
                            <th className="px-3 py-2">Due Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {wGroup.payments.map((p, pIdx) => (
                            <tr key={pIdx} className="hover:bg-slate-50">
                              <td className="px-3 py-2">{p.slNo}</td>
                              <td className="px-3 py-2">{p.parkingNo}</td>
                              <td className="px-3 py-2">{p.carNo}</td>
                              <td className="px-3 py-2 font-bold text-slate-700">
                                {p.totalDue}
                              </td>
                              <td className="px-3 py-2 text-green-600">
                                {p.paid}
                              </td>
                              <td className="px-3 py-2 text-red-500 font-bold">
                                {p.balance}
                              </td>
                              <td className="px-3 py-2">{p.dueDate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 opacity-60">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">
              No records found for selected criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionSheet;
