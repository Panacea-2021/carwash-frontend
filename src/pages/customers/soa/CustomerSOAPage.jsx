import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Car,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
} from "lucide-react";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { customerService } from "../../../api/customerService";
import CustomDropdown from "../../../components/ui/CustomDropdown";
import SOATemplateCard from "./SOATemplateCard";
import SOAPrintSlip from "./SOAPrintSlip";
import "./soa-print.css";

const moneyFormatter = new Intl.NumberFormat("en-AE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatAmount = (value) =>
  `AED ${moneyFormatter.format(Number(value || 0))}`;

const BRAND = {
  reportTitle: "Statement Of Account",
  logoPath: "/carwash.jpeg",
};

const COMPLETED_STATUSES = new Set(["COMPLETED", "DONE", "COLLECTED"]);

const HIDDEN_EXPORT_VALUES = new Set([
  "",
  "-",
  "N/A",
  "NA",
  "UNKNOWN",
  "UNKNOWN CUSTOMER",
  "UNNAMED CUSTOMER",
  "NULL",
  "UNDEFINED",
]);

const sanitizeFilePart = (value) => {
  return String(value || "SOA")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
};

const normalizeTextValue = (value) => String(value ?? "").trim();

const hasDisplayValue = (value) => {
  const normalized = normalizeTextValue(value);
  if (!normalized) return false;
  return !HIDDEN_EXPORT_VALUES.has(normalized.toUpperCase());
};

const cleanTextValue = (value) =>
  hasDisplayValue(value) ? normalizeTextValue(value) : "";

const buildVehicleLabel = (registrationNo, parkingNo) => {
  const values = [
    cleanTextValue(registrationNo),
    cleanTextValue(parkingNo),
  ].filter(Boolean);
  return values.join(" / ");
};

const pushIfPresent = (rows, label, value) => {
  if (hasDisplayValue(value)) {
    rows.push([label, normalizeTextValue(value)]);
  }
};

const getAgingBucketRows = (summary = {}) => {
  const source = summary.agingBuckets || {};

  return [
    {
      label: "0-30 Days",
      amount: Number(source.bucket_0_30?.amount || 0),
      months: Number(source.bucket_0_30?.months || 0),
    },
    {
      label: "31-60 Days",
      amount: Number(source.bucket_31_60?.amount || 0),
      months: Number(source.bucket_31_60?.months || 0),
    },
    {
      label: "61-90 Days",
      amount: Number(source.bucket_61_90?.amount || 0),
      months: Number(source.bucket_61_90?.months || 0),
    },
    {
      label: "90+ Days",
      amount: Number(source.bucket_90_plus?.amount || 0),
      months: Number(source.bucket_90_plus?.months || 0),
    },
  ];
};

const resolveFileBaseName = ({ customer, scope }) => {
  const preferredCustomerName = hasDisplayValue(customer?.fullName)
    ? customer.fullName
    : hasDisplayValue(customer?.customerCode)
      ? `Customer_${customer.customerCode}`
      : "SOA";
  const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${sanitizeFilePart(preferredCustomerName)}_SOA_${scope}_${dateTag}`;
};

const loadImageAsDataURL = (path) => {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");

      if (!context) {
        resolve(null);
        return;
      }

      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => resolve(null);
    image.src = path;
  });
};

const getMonthLabel = (monthKey) => {
  if (!monthKey) return "All Months";
  const [year, month] = String(monthKey).split("-").map(Number);
  if (!year || !month) return monthKey;
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + 1);
  return date
    .toLocaleString("default", { month: "short", year: "numeric" })
    .toUpperCase();
};

const isValidMonthKey = (value) =>
  /^\d{4}-\d{2}$/.test(String(value || "").trim());

const CustomerSOAPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const vehicleIdParam = searchParams.get("vehicleId") || "";
  const fromMonthParam = searchParams.get("fromMonth") || "";
  const toMonthParam = searchParams.get("toMonth") || "";

  const [soaData, setSoaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const hasAppliedDefaultMonth = useRef(false);

  const loadSOA = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await customerService.getSOA(id, {
        vehicleId: vehicleIdParam,
        fromMonth: fromMonthParam,
        toMonth: toMonthParam,
      });

      const payload = response?.data || response;
      setSoaData(payload || null);
    } catch (error) {
      console.error("Failed to fetch SOA", error);
      toast.error("Failed to load SOA");
      setSoaData(null);
    } finally {
      setLoading(false);
    }
  }, [id, vehicleIdParam, fromMonthParam, toMonthParam]);

  useEffect(() => {
    loadSOA();
  }, [loadSOA]);

  const availableMonths = useMemo(
    () =>
      Array.isArray(soaData?.availableMonths) ? soaData.availableMonths : [],
    [soaData],
  );
  const vehicles = useMemo(
    () => (Array.isArray(soaData?.vehicles) ? soaData.vehicles : []),
    [soaData],
  );

  const selectedVehicleLabel = useMemo(() => {
    if (!soaData?.filters?.vehicleId) {
      return "All Vehicles";
    }

    const selected = vehicles.find(
      (vehicle) =>
        String(vehicle.vehicleId) === String(soaData.filters.vehicleId),
    );

    if (selected) {
      const selectedLabel = buildVehicleLabel(
        selected.registrationNo,
        selected.parkingNo,
      );
      if (selectedLabel) {
        return selectedLabel;
      }
    }

    if (soaData?.selectedVehicle) {
      const selectedFallbackLabel = buildVehicleLabel(
        soaData.selectedVehicle.registrationNo,
        soaData.selectedVehicle.parkingNo,
      );
      if (selectedFallbackLabel) {
        return selectedFallbackLabel;
      }
    }

    return "Selected Vehicle";
  }, [soaData, vehicles]);

  const monthRangeLabel = useMemo(() => {
    const fromKey = soaData?.filters?.fromMonth || "";
    const toKey = soaData?.filters?.toMonth || "";

    if (!fromKey && !toKey) {
      return "All Months";
    }

    const fromLabel = getMonthLabel(fromKey);
    const toLabel = getMonthLabel(toKey);

    if (fromKey && (!toKey || fromKey === toKey)) {
      return fromLabel;
    }
    if (!fromKey && toKey) {
      return `Up to ${toLabel}`;
    }
    if (fromKey && !toKey) {
      return `From ${fromLabel}`;
    }

    return `${fromLabel} to ${toLabel}`;
  }, [soaData]);

  const applyInstantFilters = useCallback(
    (updates = {}) => {
      const nextFilters = {
        vehicleId: vehicleIdParam,
        fromMonth: fromMonthParam,
        toMonth: toMonthParam,
        ...updates,
      };

      if (
        nextFilters.fromMonth &&
        nextFilters.toMonth &&
        String(nextFilters.fromMonth) > String(nextFilters.toMonth)
      ) {
        if (Object.prototype.hasOwnProperty.call(updates, "fromMonth")) {
          nextFilters.toMonth = nextFilters.fromMonth;
        }

        if (Object.prototype.hasOwnProperty.call(updates, "toMonth")) {
          nextFilters.fromMonth = nextFilters.toMonth;
        }
      }

      const nextParams = new URLSearchParams();
      if (nextFilters.vehicleId) {
        nextParams.set("vehicleId", nextFilters.vehicleId);
      }
      if (nextFilters.fromMonth) {
        nextParams.set("fromMonth", nextFilters.fromMonth);
      }
      if (nextFilters.toMonth) {
        nextParams.set("toMonth", nextFilters.toMonth);
      }

      setSearchParams(nextParams);
    },
    [vehicleIdParam, fromMonthParam, toMonthParam, setSearchParams],
  );

  useEffect(() => {
    if (hasAppliedDefaultMonth.current) return;
    if (fromMonthParam || toMonthParam) {
      hasAppliedDefaultMonth.current = true;
      return;
    }
    if (!availableMonths.length) return;

    const latestMonth = availableMonths[availableMonths.length - 1]?.value;
    if (!latestMonth) return;

    hasAppliedDefaultMonth.current = true;
    applyInstantFilters({
      fromMonth: String(latestMonth),
      toMonth: String(latestMonth),
    });
  }, [availableMonths, fromMonthParam, toMonthParam, applyInstantFilters]);

  const vehicleOptions = useMemo(
    () => [
      { value: "", label: "All Vehicles" },
      ...vehicles.map((vehicle, index) => ({
        value: String(vehicle.vehicleId || ""),
        label:
          buildVehicleLabel(vehicle.registrationNo, vehicle.parkingNo) ||
          `Vehicle ${index + 1}`,
      })),
    ],
    [vehicles],
  );

  const monthOptions = useMemo(
    () => [
      { value: "", label: "All" },
      ...availableMonths.map((monthOption) => ({
        value: String(monthOption.value || ""),
        label: getMonthLabel(monthOption.value),
      })),
    ],
    [availableMonths],
  );

  const handleDownloadExcel = () => {
    if (!soaData) {
      toast.error("No SOA data available");
      return;
    }

    setDownloadingExcel(true);
    try {
      const customer = soaData.customer || {};
      const summary = soaData.summary || {};
      const monthly = soaData.monthly || [];
      const transactions = soaData.transactions || [];
      const oneWashTransactions = soaData.oneWash?.transactions || [];
      const washActivityEntries = soaData.washActivity?.entries || [];

      const summaryRows = [
        ["STATEMENT OF ACCOUNT (SOA)"],
        ["Generated On", new Date().toLocaleString("en-GB")],
      ];

      const metadataRows = [];
      pushIfPresent(metadataRows, "Customer Name", customer.fullName);
      pushIfPresent(metadataRows, "Customer Code", customer.customerCode);
      pushIfPresent(metadataRows, "Mobile", customer.mobile);
      pushIfPresent(metadataRows, "Building", customer.buildingName);
      pushIfPresent(metadataRows, "Flat", customer.flatNo);
      pushIfPresent(metadataRows, "Vehicle Scope", selectedVehicleLabel);
      pushIfPresent(metadataRows, "Month Range", monthRangeLabel);

      if (metadataRows.length > 0) {
        summaryRows.push([], ...metadataRows);
      }

      summaryRows.push(
        [],
        ["Total Opening", summary.totalOpeningBalance || 0],
        ["Total Subscription", summary.totalSubscription || 0],
        ["Total Billed", summary.totalBilled || 0],
        ["Total Paid", summary.totalPaid || 0],
        ["Total Due", summary.totalDue || 0],
        ["Collection %", Number(summary.collectionPercent || 0).toFixed(1)],
        ["Residence Washes", summary.washCompletedCount || 0],
        ["OneWash Washes", summary.oneWashCount || 0],
      );

      summaryRows.push(
        [],
        ["Prepared By", "Accounts Team"],
        ["Approved By", "________________"],
        ["Signature", "________________"],
      );

      const paymentMonths = monthly
        .map((row) => String(row?.month || "").trim())
        .filter(isValidMonthKey);

      const fallbackMonths = new Set(
        transactions
          .map((row) => String(row?.billingMonth || "").trim())
          .filter(isValidMonthKey),
      );

      const monthKeys = (
        paymentMonths.length > 0 ? paymentMonths : Array.from(fallbackMonths)
      )
        .filter((key) => {
          if (soaData?.filters?.fromMonth && key < soaData.filters.fromMonth) {
            return false;
          }
          if (soaData?.filters?.toMonth && key > soaData.filters.toMonth) {
            return false;
          }
          return true;
        })
        .sort((a, b) => a.localeCompare(b));

      const paymentByMonth = new Map();
      monthly.forEach((row) => {
        if (row?.month) paymentByMonth.set(row.month, row);
      });

      const paymentMetaByMonth = new Map();
      transactions.forEach((row) => {
        if (!row?.billingMonth) return;
        const meta = paymentMetaByMonth.get(row.billingMonth) || {
          modes: new Set(),
          paidDate: "-",
          latestAt: 0,
        };

        if (row.paymentMode) {
          meta.modes.add(String(row.paymentMode).trim());
        }

        if (Number(row.paidAmount || 0) > 0) {
          const timestamp = new Date(row.createdAt || 0).getTime();
          if (timestamp >= meta.latestAt) {
            meta.latestAt = timestamp;
            meta.paidDate = row.paymentDate || "-";
          }
        }

        paymentMetaByMonth.set(row.billingMonth, meta);
      });

      const washCountsByMonth = new Map();
      washActivityEntries.forEach((row) => {
        const monthKey = row?.billingMonth;
        if (!monthKey) return;
        const status = String(row?.status || "").toUpperCase();
        if (!COMPLETED_STATUSES.has(status)) return;

        const counts = washCountsByMonth.get(monthKey) || {
          residence: 0,
          onewash: 0,
        };
        const activityType = String(row?.activityType || "").toUpperCase();
        if (activityType === "ONEWASH") {
          counts.onewash += 1;
        } else {
          counts.residence += 1;
        }

        washCountsByMonth.set(monthKey, counts);
      });

      const monthlyRows = [
        [
          "Month",
          "Opening Balance",
          "Subscription",
          "Billed",
          "Paid",
          "Due",
          "Paid Date",
          "Mode",
          "Residence Washes",
          "OneWash Washes",
        ],
        ...monthKeys.map((monthKey) => {
          const monthRow = paymentByMonth.get(monthKey) || {};
          const meta = paymentMetaByMonth.get(monthKey) || { modes: new Set() };
          const modes = meta.modes;
          const paymentMode =
            modes.size === 0
              ? ""
              : modes.size === 1
                ? Array.from(modes)[0]
                : "MULTIPLE";
          const washCounts = washCountsByMonth.get(monthKey) || {
            residence: 0,
            onewash: 0,
          };

          return [
            getMonthLabel(monthKey),
            Number(monthRow.openingBalance || 0),
            Number(monthRow.subscriptionAmount || 0),
            Number(monthRow.billedAmount || 0),
            Number(monthRow.paidAmount || 0),
            Number(monthRow.dueAmount || 0),
            cleanTextValue(meta.paidDate),
            cleanTextValue(paymentMode),
            Number(washCounts.residence || 0),
            Number(washCounts.onewash || 0),
          ];
        }),
      ];

      const workbook = XLSX.utils.book_new();

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
      summarySheet["!cols"] = [{ wch: 24 }, { wch: 40 }];

      const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyRows);
      monthlySheet["!cols"] = [
        { wch: 14 },
        { wch: 16 },
        { wch: 16 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 18 },
        { wch: 12 },
        { wch: 16 },
        { wch: 16 },
      ];

      XLSX.utils.book_append_sheet(workbook, summarySheet, "SOA Summary");
      XLSX.utils.book_append_sheet(workbook, monthlySheet, "Month Wise");

      const fileBase = resolveFileBaseName({
        customer,
        scope: vehicleIdParam ? "Vehicle" : "AllVehicles",
      });
      XLSX.writeFile(workbook, `${fileBase}.xlsx`);

      toast.success("SOA Excel downloaded");
    } catch (error) {
      console.error("Excel SOA download failed", error);
      toast.error("Failed to download SOA Excel");
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!soaData) {
      toast.error("No SOA data available");
      return;
    }

    setDownloadingPdf(true);

    try {
      const customer = soaData.customer || {};
      const summary = soaData.summary || {};
      const monthly = soaData.monthly || [];
      const transactions = soaData.transactions || [];
      const oneWashTransactions = soaData.oneWash?.transactions || [];
      const washActivityEntries = soaData.washActivity?.entries || [];

      const paymentMonths = monthly
        .map((row) => String(row?.month || "").trim())
        .filter(isValidMonthKey);

      const fallbackMonths = new Set(
        transactions
          .map((row) => String(row?.billingMonth || "").trim())
          .filter(isValidMonthKey),
      );

      const monthKeys = (
        paymentMonths.length > 0 ? paymentMonths : Array.from(fallbackMonths)
      )
        .filter((key) => {
          if (soaData?.filters?.fromMonth && key < soaData.filters.fromMonth) {
            return false;
          }
          if (soaData?.filters?.toMonth && key > soaData.filters.toMonth) {
            return false;
          }
          return true;
        })
        .sort((a, b) => a.localeCompare(b));

      const paymentByMonth = new Map();
      monthly.forEach((row) => {
        if (row?.month) paymentByMonth.set(row.month, row);
      });

      const paymentMetaByMonth = new Map();
      transactions.forEach((row) => {
        if (!row?.billingMonth) return;
        const meta = paymentMetaByMonth.get(row.billingMonth) || {
          modes: new Set(),
          paidDate: "-",
          latestAt: 0,
        };

        if (row.paymentMode) {
          meta.modes.add(String(row.paymentMode).trim());
        }

        if (Number(row.paidAmount || 0) > 0) {
          const timestamp = new Date(row.createdAt || 0).getTime();
          if (timestamp >= meta.latestAt) {
            meta.latestAt = timestamp;
            meta.paidDate = row.paymentDate || "-";
          }
        }

        paymentMetaByMonth.set(row.billingMonth, meta);
      });

      const washCountsByMonth = new Map();
      washActivityEntries.forEach((row) => {
        const monthKey = row?.billingMonth;
        if (!monthKey) return;
        const status = String(row?.status || "").toUpperCase();
        if (!COMPLETED_STATUSES.has(status)) return;

        const counts = washCountsByMonth.get(monthKey) || {
          residence: 0,
          onewash: 0,
        };
        const activityType = String(row?.activityType || "").toUpperCase();
        if (activityType === "ONEWASH") {
          counts.onewash += 1;
        } else {
          counts.residence += 1;
        }

        washCountsByMonth.set(monthKey, counts);
      });
      const logoDataUrl = await loadImageAsDataURL(BRAND.logoPath);

      const doc = new jsPDF("landscape", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      if (logoDataUrl) {
        doc.addImage(logoDataUrl, "PNG", 10, 7, 12, 12);
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("STATEMENT OF ACCOUNT (SOA)", pageWidth / 2, 16, {
        align: "center",
      });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const headerLines = [];
      if (hasDisplayValue(customer.fullName)) {
        headerLines.push(`Customer: ${normalizeTextValue(customer.fullName)}`);
      }
      if (hasDisplayValue(customer.customerCode)) {
        headerLines.push(`Code: ${normalizeTextValue(customer.customerCode)}`);
      }
      if (hasDisplayValue(customer.mobile)) {
        headerLines.push(`Mobile: ${normalizeTextValue(customer.mobile)}`);
      }
      if (hasDisplayValue(customer.buildingName)) {
        headerLines.push(
          `Building: ${normalizeTextValue(customer.buildingName)}`,
        );
      }
      headerLines.push(
        `Vehicle Scope: ${normalizeTextValue(selectedVehicleLabel)}`,
      );
      headerLines.push(`Month Range: ${normalizeTextValue(monthRangeLabel)}`);
      headerLines.push(`Generated: ${new Date().toLocaleDateString("en-GB")}`);

      const leftColumn = headerLines.filter((_, index) => index % 2 === 0);
      const rightColumn = headerLines.filter((_, index) => index % 2 === 1);

      leftColumn.forEach((line, index) => {
        doc.text(line, 10, 24 + index * 6);
      });

      rightColumn.forEach((line, index) => {
        doc.text(line, 145, 24 + index * 6);
      });

      autoTable(doc, {
        startY: 48,
        theme: "grid",
        head: [["Metric", "Value", "Metric", "Value"]],
        body: [
          [
            "Total Opening",
            formatAmount(summary.totalOpeningBalance),
            "Total Subscription",
            formatAmount(summary.totalSubscription),
          ],
          [
            "Total Billed",
            formatAmount(summary.totalBilled),
            "Total Paid",
            formatAmount(summary.totalPaid),
          ],
          [
            "Total Due",
            formatAmount(summary.totalDue),
            "Collection %",
            `${Number(summary.collectionPercent || 0).toFixed(1)}%`,
          ],
          [
            "Residence Washes",
            String(summary.washCompletedCount || 0),
            "OneWash Washes",
            String(summary.oneWashCount || 0),
          ],
        ],
        headStyles: { fillColor: [30, 64, 175] },
        styles: { fontSize: 8 },
      });

      autoTable(doc, {
        startY: (doc.lastAutoTable?.finalY || 48) + 6,
        theme: "grid",
        head: [
          [
            "Month",
            "Opening",
            "Subscription",
            "Billed",
            "Paid",
            "Due",
            "Paid Date",
            "Mode",
            "Residence",
            "OneWash",
          ],
        ],
        body:
          monthKeys.length > 0
            ? monthKeys.map((monthKey) => {
                const monthRow = paymentByMonth.get(monthKey) || {};
                const meta = paymentMetaByMonth.get(monthKey) || {
                  modes: new Set(),
                  paidDate: "-",
                };
                const modes = meta.modes;
                const paymentMode =
                  modes.size === 0
                    ? "-"
                    : modes.size === 1
                      ? Array.from(modes)[0]
                      : "MULTIPLE";
                const washCounts = washCountsByMonth.get(monthKey) || {
                  residence: 0,
                  onewash: 0,
                };

                return [
                  getMonthLabel(monthKey),
                  formatAmount(monthRow.openingBalance),
                  formatAmount(monthRow.subscriptionAmount),
                  formatAmount(monthRow.billedAmount),
                  formatAmount(monthRow.paidAmount),
                  formatAmount(monthRow.dueAmount),
                  cleanTextValue(meta.paidDate),
                  cleanTextValue(paymentMode),
                  String(washCounts.residence || 0),
                  String(washCounts.onewash || 0),
                ];
              })
            : [["No records", "-", "-", "-", "-", "-", "-", "-", "-", "-"]],
        headStyles: { fillColor: [15, 118, 110] },
        styles: { fontSize: 7 },
      });

      let signatureY = (doc.lastAutoTable?.finalY || 48) + 10;
      if (signatureY > pageHeight - 16) {
        doc.addPage();
        signatureY = 20;
      }

      doc.setDrawColor(148, 163, 184);
      doc.line(10, signatureY, pageWidth - 10, signatureY);
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("Prepared By: ____________________", 10, signatureY + 6);
      doc.text("Approved By: ____________________", 92, signatureY + 6);
      doc.text("System Generated", pageWidth - 10, signatureY + 6, {
        align: "right",
      });

      const totalPages = doc.getNumberOfPages();
      for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `${BRAND.reportTitle} | Page ${page} of ${totalPages}`,
          pageWidth - 10,
          pageHeight - 4,
          { align: "right" },
        );
      }

      const fileBase = resolveFileBaseName({
        customer,
        scope: vehicleIdParam ? "Vehicle" : "AllVehicles",
      });
      doc.save(`${fileBase}.pdf`);

      toast.success("SOA PDF downloaded");
    } catch (error) {
      console.error("SOA PDF generation failed", error);
      toast.error("Failed to download SOA PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="soa-page-shell min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="soa-print-wrap max-w-7xl mx-auto space-y-4">
        <div className="soa-no-print bg-white rounded-2xl border border-slate-200 shadow-lg p-4 md:p-5">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-bold">
                  Customer Accounts
                </p>
                <h1 className="text-lg md:text-xl font-extrabold text-slate-800">
                  Statement Of Account (SOA)
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPdf || loading || !soaData}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-bold"
              >
                {downloadingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                PDF
              </button>
              <button
                onClick={handleDownloadExcel}
                disabled={downloadingExcel || loading || !soaData}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold"
              >
                {downloadingExcel ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                Excel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
            <div className="xl:col-span-2">
              <CustomDropdown
                label="Vehicle"
                value={vehicleIdParam}
                onChange={(nextValue) =>
                  applyInstantFilters({ vehicleId: String(nextValue || "") })
                }
                options={vehicleOptions}
                placeholder="All Vehicles"
                icon={Car}
                searchable
              />
            </div>

            <div>
              <CustomDropdown
                label="From Month"
                value={fromMonthParam}
                onChange={(nextValue) =>
                  applyInstantFilters({ fromMonth: String(nextValue || "") })
                }
                options={monthOptions}
                placeholder="All"
                icon={CalendarDays}
              />
            </div>

            <div>
              <CustomDropdown
                label="To Month"
                value={toMonthParam}
                onChange={(nextValue) =>
                  applyInstantFilters({ toMonth: String(nextValue || "") })
                }
                options={monthOptions}
                placeholder="All"
                icon={CalendarDays}
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-8 flex items-center justify-center gap-3 text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading SOA...
          </div>
        )}

        {!loading && soaData && (
          <>
            <SOATemplateCard soaData={soaData} />
            <SOAPrintSlip
              soaData={soaData}
              selectedVehicleLabel={selectedVehicleLabel}
              monthRangeLabel={monthRangeLabel}
            />
          </>
        )}

        {!loading && !soaData && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-10 text-center text-slate-500">
            No SOA data available for this customer.
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSOAPage;
