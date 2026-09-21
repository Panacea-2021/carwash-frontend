import React, { useMemo } from "react";
import {
  Building2,
  CalendarDays,
  Car,
  Check,
  Phone,
  User,
  X,
} from "lucide-react";

const moneyFormatter = new Intl.NumberFormat("en-AE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatAmount = (value) =>
  `AED ${moneyFormatter.format(Number(value || 0))}`;

const COMPLETED_STATUSES = new Set(["COMPLETED", "DONE", "COLLECTED"]);

const dayNameToNumber = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

const buildVehicleLabel = (registrationNo, parkingNo) => {
  const reg = String(registrationNo || "").trim();
  const parking = String(parkingNo || "").trim();
  const joined = [reg, parking].filter(Boolean).join(" / ");
  return joined || "-";
};

const parseDateValue = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const raw = String(value || "").trim();
  const parts = raw.split("-");
  if (parts.length === 3) {
    const [dayText, monthText, yearText] = parts;
    const day = Number(dayText);
    const year = Number(yearText);
    const monthMap = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    const month = monthMap[String(monthText || "").toLowerCase()] ?? null;
    if (Number.isFinite(day) && Number.isFinite(year) && month !== null) {
      const date = new Date(year, month, day);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  return null;
};

const toDateKey = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeToStartOfDay = (date) => {
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const parseScheduleDays = (raw) => {
  const unique = new Set();
  const addDay = (value) => {
    const key = String(value || "")
      .trim()
      .toLowerCase();
    if (!key) return;
    const mapped = dayNameToNumber[key];
    if (mapped === 0 || Number.isFinite(mapped)) {
      unique.add(mapped);
    }
  };

  if (Array.isArray(raw)) {
    raw.forEach((entry) => {
      if (!entry) return;
      if (typeof entry === "object") {
        if (Number.isFinite(Number(entry.value))) {
          unique.add(Number(entry.value));
          return;
        }
        if (entry.day) {
          addDay(entry.day);
        }
        return;
      }

      if (typeof entry === "string") {
        entry
          .split(/[,\s]+/)
          .filter(Boolean)
          .forEach(addDay);
      }
    });
  } else if (typeof raw === "string") {
    raw
      .split(/[,\s]+/)
      .filter(Boolean)
      .forEach(addDay);
  } else if (raw && typeof raw === "object" && raw.day) {
    addDay(raw.day);
  }

  return Array.from(unique.values()).sort();
};

const formatServiceMonthLabel = (monthKey) => {
  if (!monthKey) return "-";
  const [year, month] = String(monthKey).split("-").map(Number);
  if (!year || !month) return monthKey;
  const date = new Date(year, month - 1, 1);
  return date
    .toLocaleString("default", { month: "short", year: "numeric" })
    .toUpperCase();
};

const formatPaymentMonthLabel = (monthKey) => {
  if (!monthKey) return "-";
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

const getMonthKeyFromDate = (value) => {
  const date = parseDateValue(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const SOATemplateCard = ({ soaData }) => {
  const customer = soaData?.customer || {};
  const summary = soaData?.summary || {};
  const monthly = soaData?.monthly || [];
  const transactions = soaData?.transactions || [];
  const washActivityEntries = soaData?.washActivity?.entries || [];
  const oneWashTransactions = soaData?.oneWash?.transactions || [];
  const selectedVehicle = soaData?.selectedVehicle;
  const vehicles = soaData?.vehicles || [];
  const fromMonth = soaData?.filters?.fromMonth || "";
  const toMonth = soaData?.filters?.toMonth || "";

  const monthKeys = useMemo(() => {
    const paymentMonths = monthly
      .map((entry) => String(entry?.month || "").trim())
      .filter(isValidMonthKey);

    const fallback = new Set(
      transactions
        .map((entry) => String(entry?.billingMonth || "").trim())
        .filter(isValidMonthKey),
    );

    const base =
      paymentMonths.length > 0 ? paymentMonths : Array.from(fallback);

    return base
      .filter((key) => {
        if (fromMonth && key < fromMonth) return false;
        if (toMonth && key > toMonth) return false;
        return true;
      })
      .sort((a, b) => a.localeCompare(b));
  }, [monthly, transactions, fromMonth, toMonth]);

  const buildScopeLabel = (formatter) => {
    const hasFrom = Boolean(fromMonth);
    const hasTo = Boolean(toMonth);
    if (!hasFrom && !hasTo) return "";

    const fromLabel = formatter(fromMonth);
    const toLabel = formatter(toMonth);

    if (hasFrom && hasTo) {
      if (fromMonth === toMonth) {
        return `(${fromLabel})`;
      }
      return `(${fromLabel} to ${toLabel})`;
    }

    if (hasFrom && !hasTo) {
      return `(From ${fromLabel})`;
    }

    return `(Up to ${toLabel})`;
  };

  const paymentScopeLabel = useMemo(
    () => buildScopeLabel(formatPaymentMonthLabel),
    [fromMonth, toMonth],
  );

  const scheduleScopeLabel = useMemo(
    () => buildScopeLabel(formatServiceMonthLabel),
    [fromMonth, toMonth],
  );

  const monthMeta = useMemo(
    () =>
      monthKeys.map((monthKey) => {
        const [year, month] = String(monthKey).split("-").map(Number);
        const daysInMonth =
          year && month ? new Date(year, month, 0).getDate() : 30;
        return {
          key: monthKey,
          labelPayment: formatPaymentMonthLabel(monthKey),
          labelService: formatServiceMonthLabel(monthKey),
          year,
          month,
          daysInMonth,
        };
      }),
    [monthKeys],
  );

  const paymentByMonth = useMemo(() => {
    const map = new Map();
    monthly.forEach((entry) => {
      if (entry?.month) {
        map.set(entry.month, entry);
      }
    });
    return map;
  }, [monthly]);

  const paymentMetaByMonth = useMemo(() => {
    const map = new Map();

    transactions.forEach((entry) => {
      const monthKey = entry?.billingMonth;
      if (!monthKey) return;

      const meta = map.get(monthKey) || {
        modes: new Set(),
        paidDate: "-",
        latestAt: 0,
      };

      if (entry?.paymentMode) {
        meta.modes.add(String(entry.paymentMode).trim());
      }

      if (Number(entry?.paidAmount || 0) > 0) {
        const paidDate = parseDateValue(entry?.paymentDate);
        const fallbackDate = parseDateValue(entry?.createdAt);
        const timestamp =
          (paidDate && paidDate.getTime()) ||
          (fallbackDate && fallbackDate.getTime()) ||
          0;
        if (timestamp >= meta.latestAt) {
          meta.latestAt = timestamp;
          meta.paidDate = entry?.paymentDate || "-";
        }
      }

      map.set(monthKey, meta);
    });

    return map;
  }, [transactions]);

  const washCountsByMonth = useMemo(() => {
    const map = new Map();

    washActivityEntries.forEach((entry) => {
      const monthKey =
        entry?.billingMonth ||
        getMonthKeyFromDate(entry?.assignedDate || entry?.date);
      if (!monthKey) return;

      const status = String(entry?.status || "").toUpperCase();
      if (!COMPLETED_STATUSES.has(status)) return;

      const data = map.get(monthKey) || { residence: 0, onewash: 0 };
      const activityType = String(entry?.activityType || "").toUpperCase();

      if (activityType === "ONEWASH") {
        data.onewash += 1;
      } else {
        data.residence += 1;
      }

      map.set(monthKey, data);
    });

    return map;
  }, [washActivityEntries]);

  const monthlyRows = useMemo(() => {
    return monthMeta.map((meta) => {
      const paymentRow = paymentByMonth.get(meta.key) || {
        openingBalance: 0,
        subscriptionAmount: 0,
        billedAmount: 0,
        paidAmount: 0,
        dueAmount: 0,
      };

      const paymentMeta = paymentMetaByMonth.get(meta.key);
      const modes = paymentMeta?.modes || new Set();
      const paymentMode =
        modes.size === 0
          ? "-"
          : modes.size === 1
            ? Array.from(modes)[0]
            : "MULTIPLE";

      const washCounts = washCountsByMonth.get(meta.key) || {
        residence: 0,
        onewash: 0,
      };

      return {
        monthKey: meta.key,
        monthLabel: meta.labelPayment,
        openingBalance: paymentRow.openingBalance || 0,
        subscriptionAmount: paymentRow.subscriptionAmount || 0,
        billedAmount: paymentRow.billedAmount || 0,
        paidAmount: paymentRow.paidAmount || 0,
        dueAmount: paymentRow.dueAmount || 0,
        paidDate: paymentMeta?.paidDate || "-",
        paymentMode,
        residenceCount: washCounts.residence,
        onewashCount: washCounts.onewash,
      };
    });
  }, [monthMeta, paymentByMonth, paymentMetaByMonth, washCountsByMonth]);

  const scheduleVehicles = useMemo(() => {
    if (selectedVehicle) return [selectedVehicle];
    return vehicles;
  }, [selectedVehicle, vehicles]);

  const completedDaysByVehicle = useMemo(() => {
    const map = new Map();

    washActivityEntries.forEach((entry) => {
      if (String(entry?.activityType || "").toUpperCase() !== "SCHEDULED") {
        return;
      }

      const status = String(entry?.status || "").toUpperCase();
      if (!COMPLETED_STATUSES.has(status)) return;

      const dateValue = parseDateValue(entry?.assignedDate || entry?.date);
      if (!dateValue) return;

      const key = toDateKey(dateValue);
      const vehicleId = String(entry?.vehicleId || "").trim();
      if (!vehicleId) return;

      if (!map.has(vehicleId)) {
        map.set(vehicleId, new Set());
      }
      map.get(vehicleId).add(key);
    });

    return map;
  }, [washActivityEntries]);

  const today = normalizeToStartOfDay(new Date());

  const buildScheduleRows = (vehicle) => {
    const scheduleType = String(vehicle?.scheduleType || "").toLowerCase();
    const scheduleDays = parseScheduleDays(
      vehicle?.scheduleDaysRaw || vehicle?.scheduleDays,
    );
    const startDate = normalizeToStartOfDay(
      parseDateValue(vehicle?.startDate || vehicle?.onboardDate),
    );
    const endDate = normalizeToStartOfDay(
      parseDateValue(vehicle?.deactivateDate),
    );

    const completedDays =
      completedDaysByVehicle.get(String(vehicle?.vehicleId || "").trim()) ||
      new Set();

    return monthMeta.map((meta) => {
      const days = [];
      for (let day = 1; day <= meta.daysInMonth; day += 1) {
        const date = new Date(meta.year, meta.month - 1, day);
        const dateStart = normalizeToStartOfDay(date);
        const dateKey = toDateKey(date);

        const isFuture = today && dateStart > today;
        const isBeforeStart = startDate && dateStart < startDate;
        const isAfterEnd = endDate && dateStart > endDate;

        let isScheduled = false;
        if (!isBeforeStart && !isAfterEnd) {
          if (scheduleType === "daily") {
            isScheduled = date.getDay() !== 0;
          } else if (scheduleType === "weekly") {
            isScheduled = scheduleDays.includes(date.getDay());
          }
        }

        if (!isScheduled || isFuture) {
          days.push("none");
        } else if (completedDays.has(dateKey)) {
          days.push("done");
        } else {
          days.push("missed");
        }
      }
      return {
        monthKey: meta.key,
        label: meta.labelService,
        days,
        daysInMonth: meta.daysInMonth,
      };
    });
  };

  return (
    <div
      id="soa-template-card"
      className="soa-print-card bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
    >
      <div className="soa-print-section bg-gradient-to-r from-sky-700 via-indigo-700 to-blue-800 px-6 py-5 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="flex items-center mb-2">
              <img
                src="/carwash.jpeg"
                alt="BCW"
                className="h-10 w-10 object-contain bg-white rounded-full p-1 shadow"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-blue-100 font-bold">
              Statement Of Account
            </p>
            <h2 className="text-2xl font-extrabold mt-1">SOA</h2>
            <p className="text-sm text-blue-100 mt-1">
              Monthly paid vs due summary for customer billing records.
            </p>
          </div>

          <div className="bg-white/15 border border-white/30 rounded-xl px-4 py-3 min-w-[260px]">
            <p className="text-[11px] uppercase tracking-[0.14em] text-blue-100 font-bold">
              Scope
            </p>
            <p className="text-sm font-semibold mt-1">
              {selectedVehicle
                ? buildVehicleLabel(
                    selectedVehicle.registrationNo,
                    selectedVehicle.parkingNo,
                  )
                : "All Vehicles"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="soa-print-section grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
          <div className="soa-compact-trim rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Customer
            </p>
            <p className="mt-1 text-slate-800 font-bold">
              {customer.fullName || "-"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Code: {customer.customerCode || "-"}
            </p>
          </div>

          <div className="soa-compact-trim rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Mobile
            </p>
            <p className="mt-1 text-slate-800 font-bold">
              {customer.mobile || "-"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Status: {customer.status || "-"}
            </p>
          </div>

          <div className="soa-compact-trim rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Building
            </p>
            <p className="mt-1 text-slate-800 font-bold">
              {customer.buildingName || "-"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Flat: {customer.flatNo || "-"}
            </p>
          </div>

          <div className="soa-compact-trim rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold flex items-center gap-1">
              <Car className="w-3.5 h-3.5" /> Vehicles
            </p>
            <p className="mt-1 text-slate-800 font-bold">
              {vehicles.length || 0}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Payments: {summary.paymentsCount || 0}
            </p>
          </div>
        </div>

        <div className="soa-print-section rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600">
            Payment Summary {paymentScopeLabel}
          </div>
          <div className="overflow-x-auto">
            <table className="soa-print-table w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2 font-bold">Metric</th>
                  <th className="text-right px-3 py-2 font-bold">Value</th>
                  <th className="text-left px-3 py-2 font-bold">Metric</th>
                  <th className="text-right px-3 py-2 font-bold">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="soa-compact-trim border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-700 font-semibold">
                    Total Opening
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {formatAmount(summary.totalOpeningBalance)}
                  </td>
                  <td className="px-3 py-2 text-slate-700 font-semibold">
                    Total Subscription
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {formatAmount(summary.totalSubscription)}
                  </td>
                </tr>
                <tr className="soa-compact-trim border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-700 font-semibold">
                    Total Billed
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {formatAmount(summary.totalBilled)}
                  </td>
                  <td className="px-3 py-2 text-slate-700 font-semibold">
                    Total Paid
                  </td>
                  <td className="px-3 py-2 text-right text-emerald-700 font-semibold">
                    {formatAmount(summary.totalPaid)}
                  </td>
                </tr>
                <tr className="soa-compact-trim border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-700 font-semibold">
                    Total Due
                  </td>
                  <td className="px-3 py-2 text-right text-rose-600 font-semibold">
                    {formatAmount(summary.totalDue)}
                  </td>
                  <td className="px-3 py-2 text-slate-700 font-semibold">
                    Collection %
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {Number(summary.collectionPercent || 0).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="soa-print-section rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" /> Monthly Payments + Washes{" "}
            {paymentScopeLabel}
          </div>
          <div className="overflow-x-auto">
            <table className="soa-print-table w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2 font-bold">Month</th>
                  <th className="text-right px-3 py-2 font-bold">Opening</th>
                  <th className="text-right px-3 py-2 font-bold">
                    Subscription
                  </th>
                  <th className="text-right px-3 py-2 font-bold">Billed</th>
                  <th className="text-right px-3 py-2 font-bold">Paid</th>
                  <th className="text-right px-3 py-2 font-bold">Due</th>
                  <th className="text-center px-3 py-2 font-bold">Paid Date</th>
                  <th className="text-center px-3 py-2 font-bold">Mode</th>
                  <th className="text-center px-3 py-2 font-bold">Residence</th>
                  <th className="text-center px-3 py-2 font-bold">OneWash</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-3 py-5 text-center text-slate-400 italic"
                    >
                      No month-wise records found for selected filters.
                    </td>
                  </tr>
                )}
                {monthlyRows.map((row) => (
                  <tr
                    key={row.monthKey}
                    className="soa-compact-trim border-t border-slate-100"
                  >
                    <td className="px-3 py-2 font-semibold text-slate-700">
                      {row.monthLabel}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      {formatAmount(row.openingBalance)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      {formatAmount(row.subscriptionAmount)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-700">
                      {formatAmount(row.billedAmount)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                      {formatAmount(row.paidAmount)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-bold ${
                        Number(row.dueAmount || 0) > 0
                          ? "text-rose-600"
                          : "text-slate-600"
                      }`}
                    >
                      {formatAmount(row.dueAmount)}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600">
                      {row.paidDate || "-"}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600">
                      {row.paymentMode || "-"}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-700 font-semibold">
                      {row.residenceCount}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-700 font-semibold">
                      {row.onewashCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="soa-print-section rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600">
            Wash Activity Schedule {scheduleScopeLabel}
          </div>
          <div className="px-4 py-2 text-[11px] text-slate-500 border-b border-slate-100 bg-slate-50">
            <span className="inline-flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700">
                <Check className="w-3 h-3" />
              </span>
              Done
            </span>
            <span className="mx-2">|</span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-100 text-rose-700">
                <X className="w-3 h-3" />
              </span>
              Missed
            </span>
          </div>
          {scheduleVehicles.length === 0 && (
            <div className="px-4 py-5 text-center text-slate-400 italic">
              No vehicles available for schedule view.
            </div>
          )}
          {scheduleVehicles.map((vehicle) => {
            const scheduleRows = buildScheduleRows(vehicle);
            const vehicleLabel = buildVehicleLabel(
              vehicle.registrationNo,
              vehicle.parkingNo,
            );

            return (
              <div
                key={vehicle.vehicleId || vehicleLabel}
                className="border-t border-slate-100"
              >
                <div className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-2">
                  <Car className="w-3.5 h-3.5" /> {vehicleLabel}
                </div>
                <div className="overflow-x-auto">
                  <table className="soa-print-table w-full text-[11px]">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="text-left px-3 py-2 font-bold">Month</th>
                        {Array.from({ length: 31 }, (_, index) => (
                          <th
                            key={`day-${index + 1}`}
                            className="text-center px-2 py-2 font-bold"
                          >
                            {index + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={32}
                            className="px-3 py-5 text-center text-slate-400 italic"
                          >
                            No schedule data available for selected months.
                          </td>
                        </tr>
                      )}
                      {scheduleRows.map((row) => (
                        <tr
                          key={`${vehicle.vehicleId || vehicleLabel}-${row.monthKey}`}
                          className="soa-compact-trim border-t border-slate-100"
                        >
                          <td className="px-3 py-2 font-semibold text-slate-700">
                            {row.label}
                          </td>
                          {Array.from({ length: 31 }, (_, index) => {
                            const value = row.days[index] || "none";
                            if (value === "done") {
                              return (
                                <td
                                  key={`${row.monthKey}-done-${index}`}
                                  className="px-2 py-2 text-center"
                                >
                                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700">
                                    <Check className="w-3 h-3" />
                                  </span>
                                </td>
                              );
                            }

                            if (value === "missed") {
                              return (
                                <td
                                  key={`${row.monthKey}-missed-${index}`}
                                  className="px-2 py-2 text-center"
                                >
                                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-100 text-rose-700">
                                    <X className="w-3 h-3" />
                                  </span>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={`${row.monthKey}-none-${index}`}
                                className="px-2 py-2"
                              />
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SOATemplateCard;
