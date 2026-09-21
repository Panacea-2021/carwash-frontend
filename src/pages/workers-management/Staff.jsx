import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Download,
  UploadCloud,
  FileSpreadsheet,
  Search,
  Briefcase,
  Users,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Clock,
  ArrowRight,
  ShieldAlert,
  Building2,
  Map,
  Eye,
  Activity,
  Save,
  Phone,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

// Components
import DataTable from "../../components/DataTable";
import StaffModal from "../../components/modals/StaffModal";
import DeleteModal from "../../components/modals/DeleteModal";
import CustomDropdown from "../../components/ui/CustomDropdown";

// API
import { staffService } from "../../api/staffService";
import usePagePermissions from "../../utils/usePagePermissions";

const Staff = () => {
  const navigate = useNavigate();
  const pp = usePagePermissions("staff");
  const fileInputRef = useRef(null);

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [data, setData] = useState([]);

  // Filters State
  const [currentSearch, setCurrentSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedExpiryRange, setSelectedExpiryRange] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });

  // --- HELPERS ---
  const getDaysDiff = (date) => {
    if (!date) return null;
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getDocStatusStyle = (date) => {
    if (!date)
      return {
        bg: "bg-slate-50",
        text: "text-slate-400",
        border: "border-slate-100",
        label: "N/A",
        icon: <Clock className="w-3 h-3" />,
      };
    const diff = getDaysDiff(date);
    const dateStr = new Date(date).toLocaleDateString("en-GB");
    if (diff < 0)
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        label: `${dateStr} (Exp)`,
        icon: <ShieldAlert className="w-3 h-3" />,
      };
    if (diff <= 30)
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        label: `${dateStr} (${diff}d)`,
        icon: <AlertCircle className="w-3 h-3" />,
      };
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      label: dateStr,
      icon: <CheckCircle className="w-3 h-3" />,
    };
  };

  const handleDownloadImage = async (e, url, name) => {
    e.stopPropagation();
    if (!url) return toast.error("No image to download");
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${name.replace(/\s+/g, "_")}_profile.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error("Download failed");
    }
  };

  // --- FETCH DATA ---
  const fetchData = async (page = 1, limit = 100, search = "") => {
    setLoading(true);
    try {
      const res = await staffService.list(page, limit, search);
      setData(res.data || []);
      setPagination({
        page,
        limit,
        total: res.total || 0,
        totalPages: Math.ceil((res.total || 0) / limit) || 1,
      });
    } catch (e) {
      toast.error("Failed to load staff directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FILTER LOGIC ---
  const companyOptions = useMemo(() => {
    const companies = [
      ...new Set(data.map((item) => item.companyName).filter(Boolean)),
    ].sort();
    return [
      { value: "", label: "All Companies" },
      ...companies.map((c) => ({ value: c, label: c })),
    ];
  }, [data]);

  const siteOptions = useMemo(() => {
    const sites = [
      ...new Set(
        data
          .map((item) =>
            typeof item.site === "object" ? item.site?.name : item.site,
          )
          .filter(Boolean),
      ),
    ].sort();
    return [
      { value: "", label: "All Sites" },
      ...sites.map((s) => ({ value: s, label: s })),
    ];
  }, [data]);

  const expiryRangeOptions = [
    { value: "", label: "Any Validity" },
    { value: "already_expired", label: "Already Expired" },
    { value: "expired_month", label: "Expired This Month" },
    { value: "15", label: "Within 15 Days" },
    { value: "30", label: "Within 1 Month" },
    { value: "90", label: "Within 3 Months" },
  ];

  const filteredData = useMemo(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return data.filter((item) => {
      if (selectedCompany && item.companyName !== selectedCompany) return false;
      const siteName =
        typeof item.site === "object" ? item.site?.name : item.site;
      if (selectedSite && siteName !== selectedSite) return false;

      if (selectedExpiryRange) {
        const dates = [
          item.passportExpiry,
          item.visaExpiry,
          item.emiratesIdExpiry,
        ];
        const diffs = dates.map((d) => getDaysDiff(d));
        if (selectedExpiryRange === "already_expired") {
          if (!diffs.some((d) => d !== null && d < 0)) return false;
        } else if (selectedExpiryRange === "expired_month") {
          const hasExpired = dates.some(
            (d) => d && new Date(d) < today && new Date(d) >= startOfMonth,
          );
          if (!hasExpired) return false;
        } else {
          const limit = parseInt(selectedExpiryRange);
          const min = Math.min(...diffs.filter((d) => d !== null && d >= 0));
          if (min > limit || min === Infinity) return false;
        }
      }

      if (currentSearch) {
        const s = currentSearch.toLowerCase();
        return (
          item.name?.toLowerCase().includes(s) ||
          item.employeeCode?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [data, selectedCompany, selectedSite, selectedExpiryRange, currentSearch]);

  const criticalAlerts = useMemo(() => {
    return data.filter((item) => {
      const dates = [
        item.passportExpiry,
        item.visaExpiry,
        item.emiratesIdExpiry,
      ];
      const diffs = dates.map((d) => getDaysDiff(d)).filter((d) => d !== null);
      if (diffs.length === 0) return false;
      const minDiff = Math.min(...diffs);
      return minDiff <= 30;
    });
  }, [data]);

  // --- ACTIONS ---
  const handleExportData = async () => {
    const toastId = toast.loading("Exporting...");
    try {
      const blob = await staffService.exportData();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Staff_Export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Done", { id: toastId });
    } catch {
      toast.error("Export failed", { id: toastId });
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Employee Code": "EMP101",
        Name: "John Doe",
        Mobile: "971501234567",
        Email: "john@mail.com",
        Company: "Baba Wash",
        "Joining Date": "01/01/2024",
        "Passport Number": "P123",
        "Passport Expiry": "01/01/2030",
        "Visa Number": "V123",
        "Visa Expiry": "01/01/2026",
        "Emirates ID": "E123",
        "Emirates ID Expiry": "01/01/2026",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Staff");
    XLSX.writeFile(wb, "Staff_Template.xlsx");
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = null;
    const toastId = toast.loading("Uploading...");
    setImportLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await staffService.importData(formData);
      toast.success("Success", { id: toastId });
      fetchData(1, pagination.limit);
    } catch {
      toast.error("Failed", { id: toastId });
    } finally {
      setImportLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    setDeleteLoading(true);
    try {
      await staffService.delete(staffToDelete._id);
      toast.success("Deleted");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch {
      toast.error("Failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Staff Member",
      className: "min-w-[280px]",
      render: (r) => (
        <div
          className="flex items-center gap-4 py-2 group cursor-pointer"
          onClick={() => navigate(`/workers/staff/${r._id}`)}
        >
          <div className="relative group/img">
            <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-md ring-1 ring-slate-100">
              <div className="w-full h-full rounded-[12px] overflow-hidden bg-slate-50 flex items-center justify-center">
                {r.profileImage?.url ? (
                  <img
                    src={r.profileImage.url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="text-slate-300 w-6 h-6" />
                )}
              </div>
            </div>
            {r.profileImage?.url && (
              <button
                onClick={(e) =>
                  handleDownloadImage(e, r.profileImage.url, r.name)
                }
                className="absolute -bottom-2 -right-2 p-1.5 bg-white text-slate-600 rounded-full shadow-md border border-slate-100 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover/img:opacity-100"
                title="Download Photo"
              >
                <Save className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex flex-col">
            <h3 className="font-extrabold text-slate-800 text-[15px] leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
              {r.name}
            </h3>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider w-fit">
              {r.employeeCode}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "mobile",
      header: "Mobile",
      render: (r) => (
        <span className="text-sm font-bold text-slate-600 font-mono tracking-tight">
          {r.mobile || "-"}
        </span>
      ),
    },
    {
      key: "company",
      header: "Company",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-700 leading-tight whitespace-normal max-w-[150px] break-words">
            {r.companyName || "N/A"}
          </span>
        </div>
      ),
    },
    // ✅ NEW: Assigned Locations (Site & Mall)
    {
      key: "site",
      header: "Assigned Locations",
      render: (r) => (
        <div className="flex flex-col gap-1.5">
          {r.site && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 flex-shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-700 leading-tight whitespace-normal max-w-[150px]">
                {typeof r.site === "object" ? r.site.name : r.site}
              </span>
            </div>
          )}
          {r.mall && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 flex-shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-700 leading-tight whitespace-normal max-w-[150px]">
                {typeof r.mall === "object" ? r.mall.name : r.mall}
              </span>
            </div>
          )}
          {!r.site && !r.mall && (
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 w-fit">
              Unassigned
            </span>
          )}
        </div>
      ),
    },
    {
      key: "documents",
      header: "Passport Expiry",
      render: (r) => {
        const style = getDocStatusStyle(r.passportExpiry);
        return (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit ${style.bg} ${style.border} ${style.text}`}
          >
            {style.icon}
            <span className="text-[11px] font-bold">{style.label}</span>
          </div>
        );
      },
    },
    {
      key: "documents",
      header: "Visa Expiry",
      render: (r) => {
        const style = getDocStatusStyle(r.visaExpiry);
        return (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit ${style.bg} ${style.border} ${style.text}`}
          >
            {style.icon}
            <span className="text-[11px] font-bold">{style.label}</span>
          </div>
        );
      },
    },
    {
      key: "documents",
      header: "EID Expiry",
      render: (r) => {
        const style = getDocStatusStyle(r.emiratesIdExpiry);
        return (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit ${style.bg} ${style.border} ${style.text}`}
          >
            {style.icon}
            <span className="text-[11px] font-bold">{style.label}</span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-2 pr-2 items-center h-full">
          {pp.isActionVisible("view") && (
            <button
              onClick={() => navigate(`/workers/staff/${r._id}`)}
              className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {pp.isActionVisible("activity") && (
            <button
              onClick={() => navigate(`/workers/${r._id}/activity`)}
              className="p-2 bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
              title="Activity Tracking"
            >
              <Activity className="w-4 h-4" />
            </button>
          )}
          {pp.isActionVisible("edit") && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedStaff(r);
                setIsModalOpen(true);
              }}
              className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200 rounded-xl transition-all shadow-sm"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {pp.isActionVisible("delete") && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStaffToDelete(r);
                setIsDeleteModalOpen(true);
              }}
              className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-xl transition-all shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-6 relative z-20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          {pp.isToolbarVisible("search") && (
            <div className="relative w-full lg:w-96 group">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Name, Code or Mobile..."
                value={currentSearch}
                onChange={(e) => setCurrentSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
              />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
              {pp.isToolbarVisible("export") && (
                <button
                  onClick={handleExportData}
                  className="h-10 px-4 text-slate-600 hover:text-blue-600 rounded-xl text-[11px] font-black uppercase tracking-tighter flex items-center gap-2 transition-all hover:bg-white hover:shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />{" "}
                  <span className="hidden sm:inline">Export</span>
                </button>
              )}
              {pp.isToolbarVisible("export") && (
                <button
                  onClick={handleDownloadTemplate}
                  className="h-10 px-4 text-slate-600 hover:text-emerald-600 rounded-xl text-[11px] font-black uppercase tracking-tighter flex items-center gap-2 transition-all hover:bg-white hover:shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />{" "}
                  <span className="hidden sm:inline">Template</span>
                </button>
              )}
              {pp.isToolbarVisible("import") && (
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="h-10 px-4 text-slate-600 hover:text-indigo-600 rounded-xl text-[11px] font-black uppercase tracking-tighter flex items-center gap-2 transition-all hover:bg-white hover:shadow-sm"
                >
                  {importLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5" />
                  )}{" "}
                  <span className="hidden sm:inline">Import</span>
                </button>
              )}
            </div>
            {pp.isToolbarVisible("addStaff") && (
              <button
                onClick={() => {
                  setSelectedStaff(null);
                  setIsModalOpen(true);
                }}
                className="h-12 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-200 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Staff
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1 tracking-widest">
              Company Filter
            </span>
            <CustomDropdown
              value={selectedCompany}
              onChange={setSelectedCompany}
              options={companyOptions}
              icon={Briefcase}
              placeholder="All Companies"
            />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1 tracking-widest">
              Location Filter
            </span>
            <CustomDropdown
              value={selectedSite}
              onChange={setSelectedSite}
              options={siteOptions}
              icon={MapPin}
              placeholder="All Sites"
            />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1 tracking-widest">
              Compliance Status
            </span>
            <CustomDropdown
              value={selectedExpiryRange}
              onChange={setSelectedExpiryRange}
              options={expiryRangeOptions}
              icon={Clock}
              placeholder="Any Validity"
            />
          </div>
        </div>
      </div>
      {criticalAlerts.length > 0 && (
        <div className="mb-6 bg-white/80 backdrop-blur-md border border-rose-100 py-3 rounded-2xl overflow-hidden relative shadow-lg mx-1 ring-1 ring-rose-50">
          <div className="flex whitespace-nowrap animate-marquee items-center gap-24">
            <div className="flex items-center gap-2.5 bg-rose-600 text-white px-5 py-1.5 rounded-full ml-6 font-black text-[10px] uppercase tracking-widest shadow-md">
              <ShieldAlert className="w-4 h-4" /> Action Required
            </div>
            {criticalAlerts.map((staff) => (
              <div
                key={staff._id}
                className="flex items-center gap-4 group cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/workers/staff/${staff._id}`)}
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-white shadow-sm">
                  {staff.profileImage?.url ? (
                    <img
                      src={staff.profileImage.url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="p-1.5 text-slate-400" />
                  )}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[13px] font-black text-slate-700">
                    {staff.name}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {staff.employeeCode}
                  </span>
                </div>
                <div className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold border border-rose-200">
                  Check Expiry
                </div>
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100/60 overflow-hidden relative z-10">
        <DataTable
          columns={pp.filterColumns(columns)}
          data={filteredData}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit, currentSearch)}
          hideSearch={true}
        />
      </div>
      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchData()}
        editData={selectedStaff}
      />
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Staff"
        message={`Are you sure you want to delete ${staffToDelete?.name}?`}
      />
      <style>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 45s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
        .DataTable th { font-weight: 900; color: #94a3b8; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; padding: 24px 32px !important; border-bottom: 2px solid #f8fafc; background: #fff; }
        .DataTable td { padding: 20px 32px !important; border-bottom: 1px solid #f8fafc; vertical-align: middle; background: #fff; }
        .DataTable tr:hover td { background: #fdfdfd; }
      `}</style>
    </div>
  );
};

export default Staff;
