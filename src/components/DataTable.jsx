import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  Inbox,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DataTable = ({
  title = "Data List",
  columns = [],
  data = [],
  loading = false,
  pagination,
  onPageChange,
  onLimitChange,
  onSearch,
  hideSearch = false,
  actionButton,
  renderExpandedRow,
}) => {
  const isServer = !!(pagination && onPageChange);

  const [localPage, setLocalPage] = useState(1);
  const [localLimit, setLocalLimit] = useState(100);
  const [localSearch, setLocalSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState(null); // Changed from array to single value

  const handleSearch = (e) => {
    const value = e.target.value;
    if (isServer && onSearch) onSearch(value);
    else {
      setLocalSearch(value);
      setLocalPage(1);
    }
  };

  const processed = useMemo(() => {
    if (!isServer && localSearch) {
      return data.filter((row) =>
        Object.values(row).some((v) =>
          String(v).toLowerCase().includes(localSearch.toLowerCase()),
        ),
      );
    }
    return data;
  }, [data, localSearch, isServer]);

  const limit = isServer ? pagination.limit : localLimit;
  const page = isServer ? pagination.page : localPage;
  const total = isServer ? pagination.total : processed.length;
  const displayTotal =
    isServer && pagination.displayTotal !== undefined
      ? pagination.displayTotal
      : total;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const rows = isServer
    ? data
    : processed.slice((page - 1) * limit, page * limit);

  const changePage = (p) => {
    if (p < 1 || p > totalPages) return;
    if (isServer) onPageChange(p);
    else setLocalPage(p);
  };

  const changeLimit = (l) => {
    if (isServer && onLimitChange) onLimitChange(l);
    else {
      setLocalLimit(l);
      setLocalPage(1);
    }
  };

  const pages = (() => {
    const list = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) list.push(i);
    } else if (page <= 3) list.push(1, 2, 3, 4, "...", totalPages);
    else if (page >= totalPages - 2)
      list.push(
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      );
    else list.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    return list;
  })();

  return (
    <div className="flex flex-col w-full h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
      {/* HEADER */}
      <div className="p-5 border-b flex flex-col sm:flex-row justify-between gap-4 flex-shrink-0 bg-white z-20">
        <div>
          <h2 className="text-xl md:text-lg font-bold text-slate-800">
            {title}
          </h2>
          <p className="text-base md:text-sm text-slate-500 mt-1">
            Found {displayTotal} records
          </p>
        </div>

        <div className="flex gap-2 items-center w-full sm:w-auto">
          {!hideSearch && (
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                placeholder="Search..."
                defaultValue={isServer ? "" : localSearch}
                onChange={handleSearch}
                className="pl-10 pr-4 py-2.5 bg-slate-50 border rounded-lg text-base md:text-sm w-full sm:w-[240px] outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          )}
          {actionButton}
        </div>
      </div>

      {/* TABLE AREA CONTAINER */}
      <div className="flex-1 relative w-full overflow-hidden flex flex-col">
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center"
            >
              <div className="bg-white p-4 rounded-lg shadow-lg border flex items-center gap-3">
                <Loader2 className="w-8 h-8 md:w-6 md:h-6 text-indigo-600 animate-spin" />
                <span className="text-lg md:text-base font-semibold text-slate-700">
                  Updating...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SCROLLABLE TABLE WRAPPER */}
        <div className="flex-1 w-full overflow-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full whitespace-nowrap text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b z-10 shadow-sm">
                <tr>
                  <th className="px-3 py-3 text-xs font-bold uppercase text-slate-600 tracking-wider bg-slate-50 w-12 text-center">
                    #
                  </th>
                  {columns.map((c, i) => (
                    <th
                      key={i}
                      // ✅ REDUCED GAP: Changed px-6 py-4 to px-3 py-3
                      className={`px-3 py-3 text-xs font-bold uppercase text-slate-600 tracking-wider bg-slate-50 ${
                        c.className || ""
                      }`}
                    >
                      {c.header}
                    </th>
                  ))}
                  {renderExpandedRow && (
                    <th className="w-10 px-3 bg-slate-50" /> // ✅ REDUCED: width and padding
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {!loading && rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length + 1 + (renderExpandedRow ? 1 : 0)}
                      className="py-20 text-center text-slate-400"
                    >
                      <Inbox className="w-16 h-16 md:w-10 md:h-10 mx-auto mb-4 opacity-20" />
                      <p className="text-xl md:text-sm font-medium">
                        No records found
                      </p>
                    </td>
                  </tr>
                )}

                {rows.map((row, i) => {
                  const id = row._id || row.id || i;
                  const expanded = expandedRow === id; // Compare with single value

                  return (
                    <React.Fragment key={id}>
                      <tr
                        className={`hover:bg-slate-50 transition-colors ${
                          expanded ? "bg-slate-50" : ""
                        }`}
                      >
                        <td className="px-3 py-3 text-sm font-semibold text-slate-500 text-center w-12">
                          {(page - 1) * limit + i + 1}
                        </td>
                        {columns.map((c, j) => (
                          <td
                            key={j}
                            // ✅ REDUCED GAP: Changed px-6 py-5 to px-3 py-3
                            className={`px-3 py-3 text-sm font-medium text-slate-700 border-b border-transparent ${
                              c.className || ""
                            }`}
                          >
                            {c.render ? c.render(row, i) : row[c.accessor]}
                          </td>
                        ))}

                        {renderExpandedRow && (
                          <td className="px-3 py-3 text-right">
                            {" "}
                            {/* ✅ REDUCED PADDING */}
                            <button
                              onClick={
                                () => setExpandedRow(expanded ? null : id) // Toggle single value: null or id
                              }
                              className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 transition-all"
                            >
                              {expanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        )}
                      </tr>

                      {expanded && renderExpandedRow && (
                        <tr>
                          <td
                            colSpan={columns.length + 2}
                            className="p-0 border-b-0"
                          >
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-slate-50/50"
                            >
                              <div className="p-4 border-t border-b border-slate-100">
                                {renderExpandedRow(row)}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="px-6 py-4 border-t bg-white z-20 flex flex-col sm:flex-row gap-5 items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
          <span>Show</span>
          <select
            value={limit}
            onChange={(e) => changeLimit(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded px-3 py-1 outline-none focus:border-indigo-500 cursor-pointer text-sm"
          >
            {[5, 10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>rows</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={page === 1 || loading}
            onClick={() => changePage(page - 1)}
            className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex gap-1">
            {pages.map((p, i) => (
              <button
                key={i}
                disabled={p === "..." || loading}
                onClick={() => typeof p === "number" && changePage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  p === page
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                } ${
                  p === "..."
                    ? "border-none hover:bg-transparent cursor-default"
                    : ""
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <span className="sm:hidden text-lg font-bold text-slate-600 px-3">
            {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages || loading}
            onClick={() => changePage(page + 1)}
            className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-500"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
