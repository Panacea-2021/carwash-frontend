import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import DataTable from "../../components/DataTable";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toDateValue = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatMoney = (value) => {
  const number = toNumber(value, 0);
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(number);
};

const formatShortDate = (value) => {
  const date = toDateValue(value);
  if (!date) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  const date = toDateValue(value);
  if (!date) return "";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toDateOnly = (value = "") => {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.includes("T") ? text.split("T")[0] : text;
};

const normalizePaymentMode = (value) => {
  const mode = String(value || "").trim();
  return mode ? mode.toUpperCase() : "-";
};

const getVehicleRegNo = (row = {}) =>
  row?.vehicle?.registration_no || row?.registration_no || "-";

const getParkingNo = (row = {}) =>
  row?.vehicle?.parking_no || row?.parking_no || "-";

const getWorkerName = (row = {}) => row?.worker?.name || "-";

const getBuildingName = (row = {}) =>
  row?.building?.name || row?.customer?.building?.name || "-";

const formatReceiptNo = (row = {}) => {
  if (row.receipt_no) return String(row.receipt_no);
  if (row.id !== undefined && row.id !== null && String(row.id).trim() !== "") {
    return `RCP${String(row.id).padStart(6, "0")}`;
  }
  return "-";
};

const statusClassName = (status = "") => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (normalized === "cancelled") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }

  return "bg-amber-50 text-amber-700 border-amber-200";
};

const modeClassName = (mode = "") => {
  const normalized = String(mode || "").toLowerCase();
  if (normalized === "cash")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (normalized === "card") return "bg-blue-50 text-blue-700 border-blue-200";
  if (normalized === "bank" || normalized === "bank transfer") {
    return "bg-purple-50 text-purple-700 border-purple-200";
  }

  return "bg-slate-50 text-slate-600 border-slate-200";
};

const buildLink = (path = "", filters = {}) => {
  const normalizedPath = String(path || "").trim();
  if (!normalizedPath) return "";

  const query = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    const normalized =
      value === null || value === undefined ? "" : String(value).trim();
    if (!normalized) return;
    query.set(key, normalized);
  });

  const encoded = query.toString();
  return encoded ? `${normalizedPath}?${encoded}` : normalizedPath;
};

const resolveOneWashType = (row = {}) => {
  const explicit = String(row.display_service_type || "").trim();
  if (explicit) return explicit;

  const serviceType = String(row.service_type || "").toLowerCase();
  if (serviceType === "residence") return "Residence";

  const washType = String(row.wash_type || "").toLowerCase();
  if (washType === "outside") return "Outside";
  if (washType === "inside") return "Inside";
  if (washType === "total") return "Inside + Outside";

  if (row.mall) return "Mall";
  return "One Wash";
};

const resolveOneWashTotal = (row = {}) => {
  if (row.amount !== undefined && row.amount !== null) {
    return toNumber(row.amount, 0);
  }

  if (row.total_amount !== undefined && row.total_amount !== null) {
    return toNumber(row.total_amount, 0);
  }

  return toNumber(row.amount_paid, 0);
};

const DateRangeToolbar = ({
  startDate,
  endDate,
  onChange,
  onApply,
  disabled,
}) => {
  return (
    <div className="mb-3 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 md:flex-row md:items-end md:justify-between">
      <div className="w-full max-w-[320px]">
        <RichDateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={onChange}
        />
      </div>

      <button
        type="button"
        onClick={onApply}
        disabled={disabled}
        className="h-[42px] rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
      >
        Apply Date In Chat
      </button>
    </div>
  );
};

const ResidenceTable = ({
  rows,
  openLink,
  startDate,
  endDate,
  onDateChange,
  onApplyDate,
  dateApplyDisabled,
  pagination,
  onPageChange,
  onLimitChange,
}) => {
  const columns = useMemo(
    () => [
      {
        key: "receipt",
        header: "Rcpt#",
        render: (row) => {
          const status = String(row.status || "").toLowerCase();
          if (status !== "completed") {
            return <span className="text-xs text-slate-400">Pending</span>;
          }

          return (
            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
              {formatReceiptNo(row)}
            </span>
          );
        },
      },
      {
        key: "billDate",
        header: "Bill Date",
        render: (row) => (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-700">
              {formatShortDate(row.createdAt)}
            </span>
            <span className="text-[10px] text-slate-400">
              {formatTime(row.createdAt)}
            </span>
          </div>
        ),
      },
      {
        key: "paidDate",
        header: "Paid Date",
        render: (row) => {
          if (!row.collectedDate) {
            return <span className="text-xs text-slate-300">Not Paid</span>;
          }

          return (
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-emerald-700">
                {formatShortDate(row.collectedDate)}
              </span>
              <span className="text-[10px] text-emerald-500">
                {formatTime(row.collectedDate)}
              </span>
            </div>
          );
        },
      },
      {
        key: "vehicle",
        header: "Vehicle Info",
        render: (row) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-slate-700">
              {getVehicleRegNo(row)}
            </span>
            <span className="text-[10px] text-slate-500">
              P: {getParkingNo(row)}
            </span>
          </div>
        ),
      },
      {
        key: "building",
        header: "Building",
        render: (row) => (
          <span className="text-xs font-semibold text-slate-700">
            {getBuildingName(row)}
          </span>
        ),
      },
      {
        key: "subscription",
        header: "Subscription",
        className: "text-right",
        render: (row) => (
          <span className="text-xs text-slate-600">
            {formatMoney(row.amount_charged)}
          </span>
        ),
      },
      {
        key: "previousDue",
        header: "Prev Due",
        className: "text-right",
        render: (row) => (
          <span className="text-xs text-slate-500">
            {formatMoney(row.old_balance)}
          </span>
        ),
      },
      {
        key: "total",
        header: "Total Due",
        className: "text-right",
        render: (row) => (
          <span className="text-xs font-bold text-indigo-600">
            {formatMoney(row.total_amount)}
          </span>
        ),
      },
      {
        key: "paid",
        header: "Paid",
        className: "text-right",
        render: (row) => (
          <span className="text-xs font-bold text-emerald-600">
            {formatMoney(row.amount_paid)}
          </span>
        ),
      },
      {
        key: "balance",
        header: "Balance",
        className: "text-right",
        render: (row) => {
          const value = toNumber(row.balance, 0);
          return (
            <span
              className={`text-xs font-bold ${value > 0 ? "text-rose-600" : "text-slate-500"}`}
            >
              {formatMoney(value)}
            </span>
          );
        },
      },
      {
        key: "mode",
        header: "Mode",
        className: "text-center",
        render: (row) => (
          <span
            className={`rounded border px-2 py-1 text-[10px] font-bold ${modeClassName(
              row.payment_mode,
            )}`}
          >
            {normalizePaymentMode(row.payment_mode)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        className: "text-center",
        render: (row) => (
          <span
            className={`rounded border px-2 py-1 text-[10px] font-bold uppercase ${statusClassName(
              row.status,
            )}`}
          >
            {String(row.status || "pending")}
          </span>
        ),
      },
      {
        key: "worker",
        header: "Worker",
        render: (row) => (
          <span className="text-xs font-semibold text-slate-700">
            {getWorkerName(row)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <DateRangeToolbar
        startDate={startDate}
        endDate={endDate}
        onChange={onDateChange}
        onApply={onApplyDate}
        disabled={dateApplyDisabled}
      />

      <DataTable
        title="Residence Payments"
        columns={columns}
        data={rows}
        hideSearch={true}
        pagination={pagination}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        actionButton={
          openLink ? (
            <Link
              to={openLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Full Page
            </Link>
          ) : null
        }
      />
    </>
  );
};

const OneWashTable = ({
  rows,
  openLink,
  startDate,
  endDate,
  onDateChange,
  onApplyDate,
  dateApplyDisabled,
  pagination,
  onPageChange,
  onLimitChange,
}) => {
  const columns = useMemo(
    () => [
      {
        key: "date",
        header: "Date",
        render: (row) => (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-700">
              {formatShortDate(row.createdAt)}
            </span>
            <span className="text-[10px] text-slate-400">
              {formatTime(row.createdAt)}
            </span>
          </div>
        ),
      },
      {
        key: "vehicle",
        header: "Vehicle",
        render: (row) => (
          <span className="text-xs font-semibold text-slate-700">
            {getVehicleRegNo(row)}
          </span>
        ),
      },
      {
        key: "parking",
        header: "Parking",
        render: (row) => (
          <span className="text-xs text-slate-700">{getParkingNo(row)}</span>
        ),
      },
      {
        key: "service",
        header: "Service Type",
        render: (row) => (
          <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700">
            {resolveOneWashType(row)}
          </span>
        ),
      },
      {
        key: "original",
        header: "Original",
        className: "text-right",
        render: (row) => {
          const total = resolveOneWashTotal(row);
          const tip = toNumber(row.tip_amount, 0);
          return (
            <span className="text-xs font-semibold text-emerald-600">
              {formatMoney(total - tip)}
            </span>
          );
        },
      },
      {
        key: "tip",
        header: "Tip",
        className: "text-right",
        render: (row) => (
          <span className="text-xs text-slate-600">
            {formatMoney(row.tip_amount)}
          </span>
        ),
      },
      {
        key: "total",
        header: "Total",
        className: "text-right",
        render: (row) => (
          <span className="text-xs font-bold text-emerald-600">
            {formatMoney(resolveOneWashTotal(row))}
          </span>
        ),
      },
      {
        key: "mode",
        header: "Mode",
        className: "text-center",
        render: (row) => (
          <span
            className={`rounded border px-2 py-1 text-[10px] font-bold ${modeClassName(
              row.payment_mode,
            )}`}
          >
            {normalizePaymentMode(row.payment_mode)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        className: "text-center",
        render: (row) => (
          <span
            className={`rounded border px-2 py-1 text-[10px] font-bold uppercase ${statusClassName(
              row.status,
            )}`}
          >
            {String(row.status || "pending")}
          </span>
        ),
      },
      {
        key: "worker",
        header: "Worker",
        render: (row) => (
          <span className="text-xs font-semibold text-slate-700">
            {getWorkerName(row)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <DateRangeToolbar
        startDate={startDate}
        endDate={endDate}
        onChange={onDateChange}
        onApply={onApplyDate}
        disabled={dateApplyDisabled}
      />

      <DataTable
        title="One Wash Payments"
        columns={columns}
        data={rows}
        hideSearch={true}
        pagination={pagination}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        actionButton={
          openLink ? (
            <Link
              to={openLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Full Page
            </Link>
          ) : null
        }
      />
    </>
  );
};

const AiPaymentsResultTable = ({
  label,
  rows = [],
  navigation = null,
  selectedPerson = null,
  selectedPeriod = null,
  onApplyDateRange,
  isSearching = false,
  pagination = null,
  onPageChange,
  onLimitChange,
}) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const isOneWashByLabel = String(label || "")
    .toLowerCase()
    .includes("one wash");
  const isOneWashByRows =
    safeRows.length > 0 &&
    safeRows.every(
      (row) =>
        Boolean(row?.onewash) ||
        String(row?.serviceCategory || "").toLowerCase() === "onewash" ||
        String(row?.service_type || "").toLowerCase() === "onewash",
    );
  const isOneWash = isOneWashByLabel || isOneWashByRows;
  const openLink = buildLink(navigation?.path, navigation?.filters);
  const [rangeStart, setRangeStart] = useState(selectedPeriod?.start || "");
  const [rangeEnd, setRangeEnd] = useState(selectedPeriod?.end || "");

  useEffect(() => {
    setRangeStart(selectedPeriod?.start || "");
    setRangeEnd(selectedPeriod?.end || "");
  }, [selectedPeriod?.start, selectedPeriod?.end]);

  const handleDateChange = (field, value) => {
    if (field === "clear") {
      setRangeStart("");
      setRangeEnd("");
      return;
    }

    if (field === "startDate") {
      setRangeStart(value || "");
      return;
    }

    if (field === "endDate") {
      setRangeEnd(value || "");
    }
  };

  const handleApplyDate = () => {
    if (!selectedPerson || !onApplyDateRange) return;
    if (!rangeStart || !rangeEnd) return;

    onApplyDateRange({
      person: selectedPerson,
      startDate: toDateOnly(rangeStart),
      endDate: toDateOnly(rangeEnd),
    });
  };

  const dateApplyDisabled =
    isSearching || !selectedPerson || !rangeStart || !rangeEnd;

  if (isOneWash) {
    return (
      <OneWashTable
        rows={safeRows}
        openLink={openLink}
        startDate={rangeStart}
        endDate={rangeEnd}
        onDateChange={handleDateChange}
        onApplyDate={handleApplyDate}
        dateApplyDisabled={dateApplyDisabled}
        pagination={pagination}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    );
  }

  return (
    <ResidenceTable
      rows={safeRows}
      openLink={openLink}
      startDate={rangeStart}
      endDate={rangeEnd}
      onDateChange={handleDateChange}
      onApplyDate={handleApplyDate}
      dateApplyDisabled={dateApplyDisabled}
      pagination={pagination}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
    />
  );
};

export default AiPaymentsResultTable;
