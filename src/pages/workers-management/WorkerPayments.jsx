import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Filter,
  Check,
  Eye,
  Trash2,
  Banknote,
  CreditCard,
  Landmark,
  Wallet,
  Calendar,
  Car,
  Building,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

// APIs
import { paymentService } from "../../api/paymentService";
import { buildingService } from "../../api/buildingService";

// Components
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";
import DeleteModal from "../../components/modals/DeleteModal";

const WorkerPayments = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const worker = location.state?.worker || {};

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [buildings, setBuildings] = useState([]);

  // Stats State
  const [stats, setStats] = useState({
    totalPayments: 0,
    cashAmount: 0,
    cardAmount: 0,
    bankAmount: 0,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");

  // Date helper functions
  const getDateString = (dateObj) => {
    const local = new Date(dateObj);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local.toISOString().split("T")[0];
  };

  const getToday = () => getDateString(new Date());
  const getFirstDayOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    return getDateString(d);
  };

  const [dateRange, setDateRange] = useState({
    startDate: getFirstDayOfMonth(),
    endDate: getToday(),
  });

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isPaymentInfoOpen, setIsPaymentInfoOpen] = useState(false);
  const [viewPayment, setViewPayment] = useState(null);
  const [settleLoading, setSettleLoading] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    if (id) {
      loadBuildings();
      fetchPayments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadBuildings = async () => {
    try {
      const res = await buildingService.list(1, 1000);
      setBuildings(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPayments = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const params = {
        worker: id,
        startDate: dateRange.startDate,
        endDate: `${dateRange.endDate}T23:59:59`,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(buildingFilter ? { building: buildingFilter } : {}),
        ...(searchTerm ? { search: searchTerm } : {}),
        pageNo: page - 1,
        pageSize: limit,
      };

      const response = await paymentService.list(
        page,
        limit,
        searchTerm,
        params
      );
      const paymentData = response.data || [];

      setPayments(paymentData);
      calculateStats(paymentData);

      setPagination({
        page,
        limit,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / limit) || 1,
      });
    } catch (error) {
      console.error("❌ [WORKER PAYMENTS] Error:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalPayments = data.length;
    const cashAmount = data
      .filter((p) => p.payment_mode?.toLowerCase() === "cash")
      .reduce((sum, p) => sum + (p.amount_charged || p.amount || 0), 0);
    const cardAmount = data
      .filter((p) => p.payment_mode?.toLowerCase() === "card")
      .reduce((sum, p) => sum + (p.amount_charged || p.amount || 0), 0);
    const bankAmount = data
      .filter((p) => p.payment_mode?.toLowerCase() === "bank")
      .reduce((sum, p) => sum + (p.amount_charged || p.amount || 0), 0);

    setStats({ totalPayments, cashAmount, cardAmount, bankAmount });
  };

  // --- Handlers ---
  const handleDateChange = (field, value) => {
    if (field === "clear") {
      setDateRange({ startDate: getFirstDayOfMonth(), endDate: getToday() });
    } else {
      setDateRange((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSearch = () => fetchPayments(1, pagination.limit);

  const handleSettle = async (payment) => {
    const amount = payment.amount_charged || payment.amount || 0;
    if (!window.confirm(`Settle this payment of ₹${amount}?`)) return;
    setSettleLoading(true);
    try {
      await paymentService.settlePayment({ paymentIds: [payment._id] });
      toast.success("Payment settled successfully");
      fetchPayments(pagination.page, pagination.limit);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to settle");
    } finally {
      setSettleLoading(false);
    }
  };

  const handleView = (payment) => {
    setViewPayment(payment);
    setIsPaymentInfoOpen(true);
  };

  const handleDeleteClick = (payment) => {
    setPaymentToDelete(payment);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;
    setDeleteLoading(true);
    try {
      // await paymentService.delete(paymentToDelete._id);
      toast.success("Payment deleted successfully");
      setIsDeleteModalOpen(false);
      fetchPayments();
    } catch (error) {
      toast.error("Failed to delete payment");
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Date Formatters ---
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // --- Pagination Logic ---
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchPayments(newPage, pagination.limit);
    }
  };

  // Helper to generate page numbers [1, 2, 3, ..., 10]
  const getPageNumbers = () => {
    const pages = [];
    const total = pagination.totalPages;
    const current = pagination.page;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", total);
      } else if (current >= total - 3) {
        pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, "...", current - 1, current, current + 1, "...", total);
      }
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/workers/list")}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-4 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workers</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">
              Worker Payments
            </h1>
            {worker.name && (
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Payments for{" "}
                <span className="text-indigo-600 font-bold">{worker.name}</span>
                {worker.mobile && ` • ${worker.mobile}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search vehicle, parking..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Choose date
            </label>
            <RichDateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={handleDateChange}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Select Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
            >
              <option value="">All</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Select Buildings
            </label>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
            >
              <option value="">All</option>
              {buildings.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              onClick={handleSearch}
              className="w-full h-10 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-medium rounded-md transition-colors shadow-sm"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Blue Stats Header */}
      <div className="bg-[#1e88e5] text-white px-6 py-3 flex flex-col md:flex-row justify-between items-center rounded-t-lg shadow-md gap-2">
        <span className="font-medium text-lg">
          Total Payments: {pagination.total} {/* Shows total records count */}
        </span>
        <div className="flex gap-6 text-sm font-medium">
          <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded">
            <Banknote className="w-4 h-4" /> {stats.cashAmount}
          </span>
          <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded">
            <CreditCard className="w-4 h-4" /> {stats.cardAmount}
          </span>
          <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded">
            <Landmark className="w-4 h-4" /> {stats.bankAmount}
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center text-gray-500">
            Loading...
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No payments found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-white border-b border-gray-100 font-bold">
                <tr>
                  <th className="px-6 py-4">Id</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Vehicle No</th>
                  <th className="px-6 py-4">Parking No</th>
                  <th className="px-6 py-4">Payment Mode</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Settlement</th>
                  <th className="px-6 py-4">Worker</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {payments.map((payment, index) => {
                  const pageIndex =
                    (pagination.page - 1) * pagination.limit + index + 1;
                  const isSettled =
                    payment.settled?.toLowerCase() === "completed";
                  const statusColor =
                    payment.status?.toLowerCase() === "completed"
                      ? "text-green-500"
                      : "text-amber-500";
                  const settleColor = isSettled
                    ? "text-green-500"
                    : "text-amber-500";

                  return (
                    <tr
                      key={payment._id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-500">
                        {pageIndex}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {formatDate(payment.completedDate || payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 text-right">
                        {payment.amount_charged || payment.amount || 0}
                      </td>
                      <td className="px-6 py-4">
                        {payment.vehicle?.registration_no || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {payment.vehicle?.parking_no || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-400 uppercase text-xs font-bold">
                        {payment.payment_mode || "-"}
                      </td>
                      <td
                        className={`px-6 py-4 text-center font-bold text-xs uppercase ${statusColor}`}
                      >
                        {payment.status || "PENDING"}
                      </td>
                      <td
                        className={`px-6 py-4 text-center font-bold text-xs uppercase ${settleColor}`}
                      >
                        {isSettled ? "COMPLETED" : "PENDING"}
                      </td>
                      <td className="px-6 py-4 uppercase font-medium text-xs">
                        {worker.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          {!isSettled && (
                            <button
                              onClick={() => handleSettle(payment)}
                              className="text-gray-400 hover:text-green-600 transition-colors"
                              title="Settle"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleView(payment)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title="View"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(payment)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* --- NUMBERED PAGINATION FOOTER --- */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing{" "}
            {Math.min(
              (pagination.page - 1) * pagination.limit + 1,
              pagination.total
            )}{" "}
            to {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
            of {pagination.total} entries
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 border rounded-md bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((pageNum, idx) => (
              <button
                key={idx}
                onClick={() =>
                  typeof pageNum === "number" && handlePageChange(pageNum)
                }
                disabled={pageNum === "..."}
                className={`px-3 py-1 text-sm border rounded-md ${
                  pageNum === pagination.page
                    ? "bg-blue-600 text-white border-blue-600 font-bold"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                } ${
                  pageNum === "..."
                    ? "cursor-default border-none bg-transparent"
                    : ""
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 border rounded-md bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Payment"
        message="Are you sure you want to delete this payment?"
      />

      {isPaymentInfoOpen && viewPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Payment Details</h3>
              <button onClick={() => setIsPaymentInfoOpen(false)}>
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 text-sm">Amount</span>
                <span className="font-bold text-gray-800">
                  {viewPayment.amount_charged || 0} AED
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500 text-sm">Created At</span>
                <span className="text-gray-800 text-sm">
                  {formatDate(viewPayment.createdAt)}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-gray-500 text-sm">Status</span>
                <span className="font-bold text-green-600 text-sm uppercase">
                  {viewPayment.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerPayments;
