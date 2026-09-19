import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Users,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Phone,
  Eye,
  EyeOff,
  X,
  LayoutGrid,
  MessageSquare,
  Shield,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { adminStaffService } from "../../api/adminStaffService";
import { adminMessagesService } from "../../api/adminMessagesService";
import AdminChatModal from "../../components/modals/AdminChatModal";
import DataTable from "../../components/DataTable";

const AdminStaff = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [saving, setSaving] = useState(false);

  // Chat Modal
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatStaff, setChatStaff] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  // Create/Edit form
  const [form, setForm] = useState({ name: "", number: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Get current user from localStorage
  const userString = localStorage.getItem("user");
  const currentUser = userString ? JSON.parse(userString) : {};

  // Fetch unread message counts for all staff
  const fetchUnreadCounts = async () => {
    try {
      const response = await adminMessagesService.getAllUnreadCounts();
      setUnreadCounts(response.data || {});
    } catch (error) {
      console.error("Failed to fetch unread counts:", error);
    }
  };

  // Fetch admin staff list
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await adminStaffService.list({ search, limit: 100 });
      setData(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      toast.error(error.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUnreadCounts();

    // Poll for unread counts every 10 seconds
    const pollInterval = setInterval(() => {
      fetchUnreadCounts();
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [search]);

  // Create or Update Staff
  const handleSave = async () => {
    if (!form.name?.trim() || !form.number?.trim()) {
      toast.error("Name and phone number are required");
      return;
    }
    if (!isEditing && !form.password?.trim()) {
      toast.error("Password is required for new staff");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && selectedStaff) {
        const payload = { name: form.name, number: form.number };
        if (form.password?.trim()) payload.password = form.password;
        await adminStaffService.update(selectedStaff._id, payload);
        toast.success("Staff updated successfully");
      } else {
        await adminStaffService.create(form);
        toast.success("Staff created successfully");
      }
      setIsCreateOpen(false);
      setForm({ name: "", number: "", password: "" });
      setSelectedStaff(null);
      setIsEditing(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to save staff");
    } finally {
      setSaving(false);
    }
  };

  // Open Edit — fetch fresh data by ID to always get the latest password
  const handleEdit = async (staff) => {
    setSelectedStaff(staff);
    setForm({ name: staff.name, number: staff.number, password: "" });
    setIsEditing(true);
    setIsCreateOpen(true);
    try {
      const response = await adminStaffService.getById(staff._id);
      const freshStaff = response?.data || response;
      const pw = freshStaff?.password || "";
      setForm({
        name: freshStaff.name || staff.name,
        number: freshStaff.number || staff.number,
        password: pw.includes("$f$") ? "" : pw,
      });
    } catch {
      // Fallback: keep form as-is, user can still type a new password
    }
  };

  // Toggle Block/Unblock
  const handleToggleBlock = async (staff) => {
    try {
      await adminStaffService.update(staff._id, {
        isBlocked: !staff.isBlocked,
      });
      toast.success(staff.isBlocked ? "Staff unblocked" : "Staff blocked");
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to update");
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!selectedStaff) return;
    setSaving(true);
    try {
      await adminStaffService.delete(selectedStaff._id);
      toast.success("Staff deleted");
      setIsDeleteOpen(false);
      setSelectedStaff(null);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  // Columns for DataTable
  const columns = [
    {
      key: "name",
      header: "Staff Member",
      className: "min-w-[220px]",
      render: (row) => (
        <div className="flex items-center gap-4 py-1">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-200/50">
            <span className="text-sm font-black text-white">
              {row.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-[14px] leading-snug">
              {row.name}
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Staff
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "number",
      header: "Phone",
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          {row.number}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <button
          onClick={() => handleToggleBlock(row)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            row.isBlocked
              ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100"
          }`}
        >
          {row.isBlocked ? (
            <>
              <ShieldOff className="w-3 h-3" /> Blocked
            </>
          ) : (
            <>
              <ShieldCheck className="w-3 h-3" /> Active
            </>
          )}
        </button>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row) => (
        <span className="text-slate-500 text-xs font-semibold">
          {row.createdAt
            ? new Date(row.createdAt).toLocaleDateString("en-GB")
            : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setChatStaff(row);
              setIsChatOpen(true);
            }}
            className="relative p-2 hover:bg-green-50 text-slate-400 hover:text-green-600 rounded-xl transition-all"
            title="Messages"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadCounts[row._id] > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadCounts[row._id]}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate(`/admin-staff/${row._id}/activity`)}
            className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
            title="Activity Tracking"
          >
            <Activity className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/admin-staff/${row._id}/page-permissions`)}
            className="p-2 hover:bg-purple-50 text-slate-400 hover:text-purple-600 rounded-xl transition-all"
            title="Permissions"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedStaff(row);
              setIsDeleteOpen(true);
            }}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* Header Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-6 relative z-20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">
                Admin Staff Management
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Create and manage staff members with restricted admin access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64 group">
              <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>
            <button
              onClick={() => {
                setIsEditing(false);
                setSelectedStaff(null);
                setForm({ name: "", number: "", password: "" });
                setIsCreateOpen(true);
              }}
              className="h-10 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-200 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Staff
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-5">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800">{total}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Staff
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800">
                {data.filter((s) => !s.isBlocked).length}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <ShieldOff className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800">
                {data.filter((s) => s.isBlocked).length}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Blocked
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100/60 overflow-hidden relative z-10">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          hideSearch={true}
        />
      </div>

      {/* ======= CREATE/EDIT MODAL ======= */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  {isEditing ? (
                    <Edit2 className="w-5 h-5 text-white" />
                  ) : (
                    <Plus className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800">
                    {isEditing ? "Edit Staff" : "Add New Staff"}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    {isEditing
                      ? "Update staff member details"
                      : "Create a new admin panel staff member"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={form.number}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    setForm({ ...form, number: value });
                  }}
                  placeholder="Enter phone number"
                  maxLength={10}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Password{" "}
                  {isEditing && (
                    <span className="text-slate-400 font-medium normal-case">
                      (leave blank to keep current)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder={
                      isEditing ? "Enter new password" : "Enter password"
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-3xl">
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setForm({ name: "", number: "", password: "" });
                  setIsEditing(false);
                  setSelectedStaff(null);
                }}
                className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-indigo-200"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======= DELETE CONFIRMATION ======= */}
      {isDeleteOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm">
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-black text-slate-800">
                Delete Staff Member?
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Are you sure you want to delete{" "}
                <strong className="text-slate-700">{selectedStaff.name}</strong>
                ? They will no longer be able to access the admin panel.
              </p>
            </div>
            <div className="p-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => {
                  setIsDeleteOpen(false);
                  setSelectedStaff(null);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 px-4 py-2.5 text-sm font-bold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-red-200"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======= CHAT MODAL ======= */}
      <AdminChatModal
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatStaff(null);
          fetchUnreadCounts();
        }}
        staff={chatStaff}
        currentUser={currentUser}
      />

      <style>{`
        .DataTable th { font-weight: 900; color: #94a3b8; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; padding: 20px 28px !important; border-bottom: 2px solid #f8fafc; background: #fff; }
        .DataTable td { padding: 16px 28px !important; border-bottom: 1px solid #f8fafc; vertical-align: middle; background: #fff; }
        .DataTable tr:hover td { background: #fafbff; }
      `}</style>
    </div>
  );
};

export default AdminStaff;
