import React from "react";

const COMPLETED_STATUSES = new Set(["COMPLETED", "DONE", "COLLECTED"]);

const toNumberSafe = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value) => toNumberSafe(value).toFixed(2);

const buildPeriodCode = () => {
  const now = new Date();
  const monthCode = now
    .toLocaleString("default", { month: "short" })
    .toUpperCase();
  const yearCode = String(now.getFullYear()).slice(-2);
  return `${monthCode}/${yearCode} SOA`;
};

const getMonthLabel = (monthKey) => {
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

const SOAPrintSlip = ({ soaData, selectedVehicleLabel, monthRangeLabel }) => {
  const customer = soaData?.customer || {};
  const summary = soaData?.summary || {};
  const monthly = Array.isArray(soaData?.monthly) ? soaData.monthly : [];
  const transactions = soaData?.transactions || [];
  const washActivityEntries = soaData?.washActivity?.entries || [];
  const oneWashTransactions = soaData?.oneWash?.transactions || [];
  const fromMonth = soaData?.filters?.fromMonth || "";
  const toMonth = soaData?.filters?.toMonth || "";

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
      if (fromMonth && key < fromMonth) return false;
      if (toMonth && key > toMonth) return false;
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

  const monthlyRows = monthKeys.map((monthKey) => {
    const monthRow = paymentByMonth.get(monthKey) || {};
    const meta = paymentMetaByMonth.get(monthKey) || { modes: new Set() };
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

    return {
      monthLabel: getMonthLabel(monthKey),
      openingBalance: monthRow.openingBalance || 0,
      subscriptionAmount: monthRow.subscriptionAmount || 0,
      billedAmount: monthRow.billedAmount || 0,
      paidAmount: monthRow.paidAmount || 0,
      dueAmount: monthRow.dueAmount || 0,
      paidDate: meta.paidDate || "-",
      paymentMode,
      residenceCount: washCounts.residence,
      onewashCount: washCounts.onewash,
    };
  });

  const baseTh = {
    border: "1px solid #64748b",
    backgroundColor: "#1e293b",
    color: "#ffffff",
    padding: "5px",
    textTransform: "uppercase",
    fontWeight: 700,
    textAlign: "center",
  };

  const baseTd = {
    border: "1px solid #94a3b8",
    padding: "4px 6px",
    verticalAlign: "middle",
  };

  const styles = {
    sheet: {
      width: "297mm",
      minHeight: "210mm",
      padding: "8mm",
      backgroundColor: "#ffffff",
      color: "#1f2937",
      fontFamily: "Arial, Helvetica, sans-serif",
      boxSizing: "border-box",
      border: "1px solid #e5e7eb",
      boxShadow: "none",
      overflow: "hidden",
    },
    topTitle: {
      margin: 0,
      textAlign: "center",
      color: "#dc2626",
      fontWeight: 800,
      fontSize: "11pt",
      letterSpacing: "1px",
      textTransform: "uppercase",
    },
    topRule: {
      borderTop: "3px solid #ef4444",
      margin: "6px 0 10px",
    },
    infoTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "8px",
      fontSize: "8pt",
      fontWeight: 700,
      textTransform: "uppercase",
    },
    summaryTable: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "8pt",
      marginBottom: "8px",
    },
    monthlyTable: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "7.5pt",
      marginBottom: "8px",
    },
    th: baseTh,
    thSmall: { ...baseTh, fontSize: "7pt" },
    td: baseTd,
    tdRight: { ...baseTd, textAlign: "right" },
    tdSmall: { ...baseTd, fontSize: "7pt" },
    tdRightSmall: { ...baseTd, textAlign: "right", fontSize: "7pt" },
    signatureWrap: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "22px",
      fontSize: "8.5pt",
      fontWeight: 700,
    },
    signatureItem: {
      width: "38%",
      borderTop: "2px solid #64748b",
      paddingTop: "7px",
      textAlign: "center",
    },
  };

  return (
    <div className="soa-print-only" aria-hidden="true">
      <div id="printable-soa-slip" style={styles.sheet}>
        <h2 style={styles.topTitle}>Baba Car Washing And Cleaning LLC</h2>
        <div style={styles.topRule} />

        <table style={styles.infoTable}>
          <tbody>
            <tr>
              <td style={{ ...styles.td, width: "40%" }}>
                NAME : {String(customer.fullName || "-").toUpperCase()}
              </td>
              <td style={{ ...styles.td, width: "30%", textAlign: "center" }}>
                CODE : {customer.customerCode || "-"}
              </td>
              <td style={{ ...styles.td, width: "30%", textAlign: "right" }}>
                {buildPeriodCode()}
              </td>
            </tr>
            <tr>
              <td style={styles.td}>MOBILE : {customer.mobile || "-"}</td>
              <td style={{ ...styles.td, textAlign: "center" }}>
                SCOPE :{" "}
                {String(selectedVehicleLabel || "All Vehicles").toUpperCase()}
              </td>
              <td style={{ ...styles.td, textAlign: "right" }}>
                RANGE : {String(monthRangeLabel || "All Months").toUpperCase()}
              </td>
            </tr>
          </tbody>
        </table>

        <table style={styles.summaryTable}>
          <thead>
            <tr>
              <th style={styles.th}>Metric</th>
              <th style={styles.th}>Value</th>
              <th style={styles.th}>Metric</th>
              <th style={styles.th}>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>Total Opening</td>
              <td style={styles.tdRight}>
                {formatMoney(summary.totalOpeningBalance)}
              </td>
              <td style={styles.td}>Total Subscription</td>
              <td style={styles.tdRight}>
                {formatMoney(summary.totalSubscription)}
              </td>
            </tr>
            <tr>
              <td style={styles.td}>Total Billed</td>
              <td style={styles.tdRight}>{formatMoney(summary.totalBilled)}</td>
              <td style={styles.td}>Total Paid</td>
              <td style={styles.tdRight}>{formatMoney(summary.totalPaid)}</td>
            </tr>
            <tr>
              <td style={styles.td}>Total Due</td>
              <td style={styles.tdRight}>{formatMoney(summary.totalDue)}</td>
              <td style={styles.td}>Collection %</td>
              <td style={styles.tdRight}>
                {Number(summary.collectionPercent || 0).toFixed(1)}%
              </td>
            </tr>
            <tr>
              <td style={styles.td}>Residence Washes</td>
              <td style={styles.tdRight}>{summary.washCompletedCount || 0}</td>
              <td style={styles.td}>OneWash Washes</td>
              <td style={styles.tdRight}>{summary.oneWashCount || 0}</td>
            </tr>
          </tbody>
        </table>

        <table style={styles.monthlyTable}>
          <thead>
            <tr>
              <th style={styles.thSmall}>Month</th>
              <th style={styles.thSmall}>Opening</th>
              <th style={styles.thSmall}>Subscription</th>
              <th style={styles.thSmall}>Billed</th>
              <th style={styles.thSmall}>Paid</th>
              <th style={styles.thSmall}>Due</th>
              <th style={styles.thSmall}>Paid Date</th>
              <th style={styles.thSmall}>Mode</th>
              <th style={styles.thSmall}>Residence</th>
              <th style={styles.thSmall}>OneWash</th>
            </tr>
          </thead>
          <tbody>
            {monthlyRows.length === 0 && (
              <tr>
                <td style={styles.tdSmall} colSpan={10}>
                  NO MONTHLY RECORDS AVAILABLE
                </td>
              </tr>
            )}
            {monthlyRows.map((row, index) => (
              <tr key={`${row.monthLabel}-${index}`}>
                <td style={styles.tdSmall}>{row.monthLabel}</td>
                <td style={styles.tdRightSmall}>
                  {formatMoney(row.openingBalance)}
                </td>
                <td style={styles.tdRightSmall}>
                  {formatMoney(row.subscriptionAmount)}
                </td>
                <td style={styles.tdRightSmall}>
                  {formatMoney(row.billedAmount)}
                </td>
                <td style={styles.tdRightSmall}>
                  {formatMoney(row.paidAmount)}
                </td>
                <td style={styles.tdRightSmall}>
                  {formatMoney(row.dueAmount)}
                </td>
                <td style={styles.tdSmall}>{row.paidDate || "-"}</td>
                <td style={styles.tdSmall}>{row.paymentMode || "-"}</td>
                <td style={styles.tdRightSmall}>{row.residenceCount}</td>
                <td style={styles.tdRightSmall}>{row.onewashCount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={styles.signatureWrap}>
          <div style={styles.signatureItem}>Prepared By</div>
          <div style={styles.signatureItem}>Approved By</div>
        </div>
      </div>
    </div>
  );
};

export default SOAPrintSlip;
