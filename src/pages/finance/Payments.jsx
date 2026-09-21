// import React, { useState, useEffect } from "react";
// import {
//   Download,
//   Search,
//   Filter,
//   Check,
//   Eye,
//   Trash2,
//   Banknote,
//   CreditCard,
//   Landmark,
//   DollarSign,
//   Wallet,
//   Calendar as CalendarIcon,
//   LayoutDashboard,
//   User,
//   Car,
// } from "lucide-react";
// import toast from "react-hot-toast";

// // Components
// import DataTable from "../../components/DataTable";
// import PaymentModal from "../../components/modals/PaymentModal";
// import DeleteModal from "../../components/modals/DeleteModal";
// import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";

// // API
// import { paymentService } from "../../api/paymentService";
// import { workerService } from "../../api/workerService";
// import { mallService } from "../../api/mallService";

// const Payments = () => {
//   const [loading, setLoading] = useState(false);
//   const [data, setData] = useState([]);
//   const [workers, setWorkers] = useState([]);
//   const [malls, setMalls] = useState([]);

//   // Stats State
//   const [stats, setStats] = useState({
//     totalAmount: 0,
//     totalJobs: 0,
//     cash: 0,
//     card: 0,
//     bank: 0,
//   });

//   // --- DATES HELPER (Local Time) ---
//   const getDateString = (dateObj) => {
//     const local = new Date(dateObj);
//     local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
//     return local.toISOString().split("T")[0];
//   };

//   const getToday = () => getDateString(new Date());

//   const getFirstDayOfMonth = () => {
//     const d = new Date();
//     d.setDate(1);
//     return getDateString(d);
//   };

//   // Added missing helper to prevent ReferenceError
//   const getYesterday = () => {
//     const d = new Date();
//     d.setDate(d.getDate() - 1);
//     return getDateString(d);
//   };

//   // --- FILTER STATE ---
//   const [filters, setFilters] = useState({
//     startDate: getFirstDayOfMonth(),
//     endDate: getToday(),
//     worker: "",
//     status: "",
//     mall: "",
//   });

//   const [searchTerm, setSearchTerm] = useState("");

//   const [pagination, setPagination] = useState({
//     page: 1,
//     limit: 100,
//     total: 0,
//     totalPages: 1,
//   });

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedPayment, setSelectedPayment] = useState(null);

//   // These seem unused in the original code provided, but keeping state just in case you expand functionality
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [paymentToDelete, setPaymentToDelete] = useState(null);
//   const [deleteLoading, setDeleteLoading] = useState(false);

//   // --- Initial Load ---
//   useEffect(() => {
//     const loadInitialData = async () => {
//       try {
//         const [workersRes, mallsRes] = await Promise.all([
//           workerService.list(1, 1000),
//           mallService.list(1, 1000),
//         ]);
//         setWorkers(workersRes.data || []);
//         setMalls(mallsRes.data || []);
//       } catch (e) {
//         console.error(e);
//       }
//     };
//     loadInitialData();
//     fetchData(1, 50);
//   }, []);

//   // --- Fetch Data ---
//   const fetchData = async (page = 1, limit = 100) => {
//     setLoading(true);
//     try {
//       const apiFilters = { ...filters };

//       if (apiFilters.endDate && apiFilters.endDate.length === 10) {
//         apiFilters.endDate = `${apiFilters.endDate}T23:59:59`;
//       }

//       const res = await paymentService.list(
//         page,
//         limit,
//         searchTerm,
//         apiFilters,
//       );

//       setData(res.data || []);

//       if (res.counts) {
//         setStats(res.counts);
//       }

//       const totalCount = res.total || 0;
//       setPagination({
//         page: page,
//         limit: limit,
//         total: totalCount,
//         totalPages: Math.ceil(totalCount / limit) || 1,
//       });
//     } catch (e) {
//       toast.error("Failed to load payments");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- Handlers ---
//   const handleDateChange = (field, value) => {
//     if (field === "clear") {
//       setFilters((prev) => ({
//         ...prev,
//         startDate: getFirstDayOfMonth(), // Reset to default logic
//         endDate: getToday(),
//       }));
//     } else {
//       setFilters((prev) => ({ ...prev, [field]: value }));
//     }
//   };

//   const handleFilterChange = (e) => {
//     setFilters({ ...filters, [e.target.name]: e.target.value });
//   };

//   const handleSearch = () => {
//     fetchData(1, pagination.limit);
//   };

//   const handleCollect = (row) => {
//     setSelectedPayment(row);
//     setIsModalOpen(true);
//   };

//   const handleExport = async () => {
//     const toastId = toast.loading("Preparing download...");
//     try {
//       const exportParams = {
//         search: searchTerm,
//         ...filters,
//       };
//       if (exportParams.endDate && exportParams.endDate.length === 10) {
//         exportParams.endDate = `${exportParams.endDate}T23:59:59`;
//       }

//       const blob = await paymentService.exportData(exportParams);
//       const url = window.URL.createObjectURL(new Blob([blob]));
//       const link = document.createElement("a");
//       link.href = url;
//       const dateStr = new Date().toISOString().split("T")[0];
//       link.setAttribute("download", `payments_report_${dateStr}.xlsx`);
//       document.body.appendChild(link);
//       link.click();
//       link.parentNode.removeChild(link);

//       toast.success("Download started", { id: toastId });
//     } catch (e) {
//       console.error("Export Error:", e);
//       toast.error("Export failed", { id: toastId });
//     }
//   };

//   // --- Columns ---
//   const columns = [
//     {
//       header: "#",
//       accessor: "id",
//       className: "w-16 text-center",
//       render: (row, idx) => (
//         <div className="flex justify-center">
//           <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs font-mono border border-slate-200">
//             {(pagination.page - 1) * pagination.limit + idx + 1}
//           </span>
//         </div>
//       ),
//     },
//     {
//       header: "Date",
//       accessor: "createdAt",
//       render: (row) => (
//         <div className="flex items-center gap-2">
//           <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
//             <CalendarIcon className="w-3.5 h-3.5" />
//           </div>
//           <div className="flex flex-col">
//             <span className="text-slate-700 font-bold text-xs">
//               {new Date(row.createdAt).toLocaleDateString("en-US", {
//                 month: "short",
//                 day: "numeric",
//                 year: "numeric",
//               })}
//             </span>
//             <span className="text-[10px] text-slate-400 font-mono">
//               {new Date(row.createdAt).toLocaleTimeString([], {
//                 hour: "2-digit",
//                 minute: "2-digit",
//               })}
//             </span>
//           </div>
//         </div>
//       ),
//     },
//     {
//       header: "Vehicle Info",
//       accessor: "vehicle.registration_no",
//       render: (row) => (
//         <div className="flex flex-col gap-1">
//           <div className="flex items-center gap-1.5">
//             <Car className="w-3 h-3 text-slate-400" />
//             <span className="font-bold text-slate-700 text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
//               {row.vehicle?.registration_no || "N/A"}
//             </span>
//           </div>
//           {row.vehicle?.parking_no && (
//             <span className="text-[10px] text-slate-500 ml-5">
//               Slot: {row.vehicle.parking_no}
//             </span>
//           )}
//         </div>
//       ),
//     },
//     {
//       header: "Amount",
//       accessor: "amount_charged",
//       className: "text-right",
//       render: (row) => (
//         <span className="font-bold text-slate-800 text-sm">
//           {row.amount_charged || 0}{" "}
//           <span className="text-[10px] text-slate-400 font-normal">AED</span>
//         </span>
//       ),
//     },
//     {
//       header: "Tip",
//       accessor: "tip_amount",
//       className: "text-right",
//       render: (row) => (
//         <span className="text-slate-500 text-xs font-medium">
//           {row.tip_amount > 0 ? `+${row.tip_amount}` : "-"}
//         </span>
//       ),
//     },
//     {
//       header: "Balance",
//       accessor: "balance",
//       className: "text-right",
//       render: (row) => {
//         const bal = row.balance || 0;
//         return (
//           <span
//             className={`text-xs font-bold px-2 py-1 rounded-full ${
//               bal > 0
//                 ? "bg-red-50 text-red-600 border border-red-100"
//                 : "text-emerald-600 bg-emerald-50 border border-emerald-100"
//             }`}
//           >
//             {bal > 0 ? `-${bal}` : "0"}
//           </span>
//         );
//       },
//     },
//     {
//       header: "Mode",
//       accessor: "payment_mode",
//       className: "text-center",
//       render: (row) => (
//         <span className="text-[10px] font-bold uppercase text-slate-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">
//           {row.payment_mode || "N/A"}
//         </span>
//       ),
//     },
//     {
//       header: "Status",
//       accessor: "status",
//       className: "text-center",
//       render: (row) => {
//         const s = (row.status || "pending").toLowerCase();
//         if (s === "completed")
//           return (
//             <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full uppercase">
//               <Check className="w-3 h-3" /> COMPLETED
//             </span>
//           );
//         return (
//           <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full uppercase">
//             <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>{" "}
//             PENDING
//           </span>
//         );
//       },
//     },
//     {
//       header: "Worker",
//       accessor: "worker.name",
//       render: (row) => (
//         <div className="flex items-center gap-1.5">
//           <User className="w-3 h-3 text-slate-400" />
//           <span
//             className="text-xs font-semibold text-slate-700 truncate max-w-[100px]"
//             title={row.worker?.name}
//           >
//             {row.worker?.name || "Unassigned"}
//           </span>
//         </div>
//       ),
//     },
//     {
//       header: "Action",
//       className:
//         "text-right w-24 sticky right-0 bg-white shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]",
//       render: (row) => {
//         const total = row.amount_charged || row.total_amount || 0;
//         const paid = row.amount_paid || 0;
//         const remaining = total - paid;

//         if (remaining <= 0)
//           return (
//             <span className="text-[10px] text-emerald-500 font-bold flex items-center justify-end gap-1">
//               <Check className="w-3 h-3" /> Paid
//             </span>
//           );

//         return (
//           <button
//             onClick={() => handleCollect(row)}
//             className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
//           >
//             Collect
//           </button>
//         );
//       },
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
//       {/* --- HEADER --- */}
//       <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div className="flex items-center gap-4">
//           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
//             <Wallet className="w-6 h-6 text-white" />
//           </div>
//           <div>
//             <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-emerald-800 bg-clip-text text-transparent">
//               Payments & Transactions
//             </h1>
//             <p className="text-sm text-slate-500 font-medium">
//               Manage collections and view financial stats
//             </p>
//           </div>
//         </div>
//         <button
//           onClick={handleExport}
//           className="h-10 px-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
//         >
//           <Download className="w-4 h-4" /> Export Report
//         </button>
//       </div>

//       {/* --- STATS DASHBOARD --- */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//         {/* Total Revenue */}
//         <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-2xl shadow-xl shadow-indigo-200 text-white relative overflow-hidden group">
//           <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
//           <div className="flex justify-between items-start mb-4">
//             <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
//               <DollarSign className="w-5 h-5 text-white" />
//             </div>
//             <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 bg-black/20 px-2 py-1 rounded">
//               Total
//             </span>
//           </div>
//           <div>
//             <h3 className="text-2xl font-bold tracking-tight">
//               {stats.totalAmount.toLocaleString()}{" "}
//               <span className="text-sm font-normal opacity-80">AED</span>
//             </h3>
//             <p className="text-xs text-indigo-100 mt-1 opacity-80">
//               Total Revenue Collected
//             </p>
//           </div>
//         </div>

//         {/* Cash */}
//         <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
//           <div className="flex items-center gap-4 mb-3">
//             <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
//               <Banknote className="w-5 h-5" />
//             </div>
//             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
//               Cash
//             </span>
//           </div>
//           <h3 className="text-xl font-bold text-slate-800 ml-1">
//             {stats.cash.toLocaleString()}
//           </h3>
//         </div>

//         {/* Card */}
//         <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
//           <div className="flex items-center gap-4 mb-3">
//             <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
//               <CreditCard className="w-5 h-5" />
//             </div>
//             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
//               Card
//             </span>
//           </div>
//           <h3 className="text-xl font-bold text-slate-800 ml-1">
//             {stats.card.toLocaleString()}
//           </h3>
//         </div>

//         {/* Bank */}
//         <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
//           <div className="flex items-center gap-4 mb-3">
//             <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
//               <Landmark className="w-5 h-5" />
//             </div>
//             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
//               Bank
//             </span>
//           </div>
//           <h3 className="text-xl font-bold text-slate-800 ml-1">
//             {stats.bank.toLocaleString()}
//           </h3>
//         </div>
//       </div>

//       {/* --- FILTERS SECTION --- */}
//       <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-100 mb-6">
//         <div className="flex flex-col xl:flex-row gap-4 items-end">
//           {/* Date Range */}
//           <div className="w-full xl:w-auto min-w-[300px]">
//             <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
//               Date Range
//             </label>
//             <RichDateRangePicker
//               startDate={filters.startDate}
//               endDate={filters.endDate}
//               onChange={handleDateChange}
//             />
//           </div>

//           {/* Dropdowns Group */}
//           <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
//             <div className="relative group">
//               <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
//                 Payment Status
//               </label>
//               <select
//                 name="status"
//                 value={filters.status}
//                 onChange={handleFilterChange}
//                 className="w-full h-[42px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer uppercase font-medium"
//               >
//                 <option value="">All Status</option>
//                 <option value="pending">Pending</option>
//                 <option value="completed">Completed</option>
//               </select>
//               <Filter className="absolute right-3.5 top-[2.1rem] w-4 h-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
//             </div>

//             <div className="relative group">
//               <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
//                 Assigned Worker
//               </label>
//               <select
//                 name="worker"
//                 value={filters.worker}
//                 onChange={handleFilterChange}
//                 className="w-full h-[42px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer font-medium"
//               >
//                 <option value="">All Workers</option>
//                 {workers.map((w) => (
//                   <option key={w._id} value={w._id}>
//                     {w.name}
//                   </option>
//                 ))}
//               </select>
//               <User className="absolute right-3.5 top-[2.1rem] w-4 h-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
//             </div>
//           </div>

//           {/* Search */}
//           <div className="w-full xl:w-64 relative">
//             <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
//               Search
//             </label>
//             <div className="relative">
//               <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
//               <input
//                 type="text"
//                 placeholder="Vehicle / Reg No..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && handleSearch()}
//                 className="w-full h-[42px] pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
//               />
//             </div>
//           </div>

//           {/* Search Button */}
//           <button
//             onClick={handleSearch}
//             className="h-[42px] px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-xl transition-all flex items-center gap-2 active:scale-95"
//           >
//             <Search className="w-4 h-4" /> Search
//           </button>
//         </div>
//       </div>

//       {/* --- TABLE --- */}
//       <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col flex-1">
//         <DataTable
//           columns={columns}
//           data={data}
//           loading={loading}
//           pagination={pagination}
//           onPageChange={(p) => fetchData(p, pagination.limit)}
//           onLimitChange={(l) => fetchData(1, l)}
//         />
//       </div>

//       <PaymentModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         payment={selectedPayment}
//         onSuccess={() => fetchData(pagination.page, pagination.limit)}
//       />
//     </div>
//   );
// };

// export default Payments;
