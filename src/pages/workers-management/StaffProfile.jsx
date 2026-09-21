import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  UploadCloud,
  Eye,
  Loader2,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Edit2,
  User,
  Hash,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { staffService } from "../../api/staffService";
import StaffModal from "../../components/modals/StaffModal";

const StaffProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const profileInputRef = useRef(null);

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // --- FETCH DATA ---
  const fetchStaff = async () => {
    try {
      const res = await staffService.list(1, 1000, "");
      const found = res.data.find((s) => s._id === id || s.id === id);

      if (found) {
        setStaff(found);
      } else {
        toast.error("Staff member not found");
        navigate(-1);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line
  }, [id]);

  // --- HANDLERS ---
  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    const toastId = toast.loading("Updating profile picture...");

    try {
      await staffService.uploadProfileImage(id, file);
      toast.success("Profile picture updated", { id: toastId });
      fetchStaff();
    } catch (error) {
      console.error(error);
      toast.error("Upload failed", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDocUpload = async (file, type) => {
    if (!file) return;
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG or PDF files are allowed");
      return;
    }

    const toastId = toast.loading(`Uploading ${type}...`);
    try {
      await staffService.uploadDocument(id, file, type);
      toast.success("Uploaded successfully", { id: toastId });
      fetchStaff();
    } catch (error) {
      toast.error("Upload failed", { id: toastId });
    }
  };

  // --- HELPERS ---
  const isExpired = (date) => date && new Date(date) < new Date();
  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-GB") : "N/A";

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );

  if (!staff) return null;

  return (
    // ✅ RESPONSIVE CONTAINER
    <div className="min-h-screen lg:h-screen w-full bg-[#f1f5f9] p-4 lg:p-6 flex items-center justify-center font-sans">
      {/* ✅ MAIN CARD */}
      <div className="w-full h-auto lg:h-full max-h-none lg:max-h-[900px] bg-white rounded-[32px] shadow-2xl flex flex-col lg:flex-row overflow-hidden relative">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 lg:top-6 lg:left-6 z-50 p-2.5 bg-white shadow-sm rounded-full hover:bg-slate-50 transition-all text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* ================= LEFT COLUMN (Profile & Unified Info) ================= */}
        {/* ✅ FIX: Changed lg:overflow-y-auto to lg:overflow-hidden and added justify-center */}
        <div className="w-full lg:w-[35%] bg-slate-50 border-r border-slate-200/60 relative lg:overflow-hidden flex flex-col justify-center">
          <div className="p-6 lg:p-8 flex flex-col items-center w-full">
            {/* 1. Profile Photo */}
            <div className="relative mb-4 mt-8 lg:mt-0">
              <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-[6px] border-white shadow-xl overflow-hidden flex items-center justify-center relative bg-slate-200 group">
                {staff.profileImage?.url ? (
                  <img
                    src={staff.profileImage.url}
                    alt="Profile"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <User className="w-16 h-16 lg:w-20 lg:h-20 text-slate-400" />
                )}

                <div
                  onClick={() => profileInputRef.current.click()}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer"
                >
                  <Camera className="w-8 h-8 text-white" />
                </div>

                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={profileInputRef}
                onChange={handleProfileImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* 2. Name & Role */}
            <div className="text-center mb-6 lg:mb-8">
              <h1 className="text-xl lg:text-2xl font-black text-slate-800 uppercase tracking-tight leading-tight mb-1">
                {staff.name}
              </h1>
              <span className="text-xs lg:text-sm font-bold text-slate-500 uppercase tracking-widest">
                {staff.companyName || "STAFF MEMBER"}
              </span>
            </div>

            {/* 3. ✅ UNIFIED INFO CARD (Dark Theme, Contact First) */}
            <div className="w-full bg-[#1e293b] rounded-2xl p-5 lg:p-6 text-white shadow-xl relative overflow-hidden group">
              {/* Decorative Gradient Blob */}
              <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none"></div>

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-all"
                title="Edit Details"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <div className="space-y-6 relative z-10">
                {/* --- SECTION A: CONTACT DETAILS (TOP) --- */}
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>{" "}
                    Contact Info
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">
                          Mobile
                        </span>
                        <span className="text-sm font-medium text-white truncate block">
                          {staff.mobile || "Not Provided"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">
                          Email
                        </span>
                        <span className="text-sm font-medium text-white truncate block">
                          {staff.email || "Not Provided"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-slate-700"></div>

                {/* --- SECTION B: EMPLOYMENT DATA (BOTTOM) --- */}
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>{" "}
                    Employment Data
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                        <Hash className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">
                          ID
                        </span>
                        <span className="text-sm font-medium text-white">
                          {staff.employeeCode || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">
                          Location
                        </span>
                        <span className="text-sm font-medium text-white truncate block">
                          {staff.site?.name || staff.site || "Unassigned"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">
                          Joined
                        </span>
                        <span className="text-sm font-medium text-white">
                          {formatDate(staff.joiningDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (Official Documents) ================= */}
        {/* On Mobile: Stacked below. On Desktop: Right side, scrollable if needed */}
        <div className="w-full lg:w-[65%] h-full bg-white lg:overflow-y-auto">
          <div className="p-6 lg:p-12 flex flex-col justify-center min-h-full max-w-4xl mx-auto">
            <div className="mb-6 lg:mb-8">
              <h2 className="text-xl lg:text-2xl font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                Official Documents
              </h2>
              <p className="text-slate-500 text-xs lg:text-sm mt-1">
                Manage compliance and identification records.
              </p>
            </div>

            <div className="space-y-4 lg:space-y-6">
              {/* 01: PASSPORT (Blue Gradient) */}
              <SkillBox
                number="01"
                title="PASSPORT DETAILS"
                hasDoc={!!staff.passportDocument?.url}
                docUrl={staff.passportDocument?.url}
                onUpload={(f) => handleDocUpload(f, "Passport")}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-blue-200 text-[10px] font-bold uppercase mb-1">
                      Passport No.
                    </span>
                    <span className="font-bold text-white text-base lg:text-lg truncate block">
                      {staff.passportNumber || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-blue-200 text-[10px] font-bold uppercase mb-1">
                      Expiry
                    </span>
                    <span className="font-bold text-white text-base lg:text-lg flex items-center gap-2">
                      {formatDate(staff.passportExpiry)}
                      {isExpired(staff.passportExpiry) && (
                        <AlertCircle className="w-4 h-4 text-red-300 animate-pulse" />
                      )}
                    </span>
                  </div>
                </div>
              </SkillBox>

              {/* 02: VISA (Blue Gradient) */}
              <SkillBox
                number="02"
                title="VISA INFORMATION"
                hasDoc={!!staff.visaDocument?.url}
                docUrl={staff.visaDocument?.url}
                onUpload={(f) => handleDocUpload(f, "Visa")}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-blue-200 text-[10px] font-bold uppercase mb-1">
                      Visa No.
                    </span>
                    <span className="font-bold text-white text-base lg:text-lg truncate block">
                      {staff.visaNumber || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-blue-200 text-[10px] font-bold uppercase mb-1">
                      Expiry
                    </span>
                    <span className="font-bold text-white text-base lg:text-lg">
                      {formatDate(staff.visaExpiry)}
                    </span>
                  </div>
                </div>
              </SkillBox>

              {/* 03: EMIRATES ID (Blue Gradient) */}
              <SkillBox
                number="03"
                title="EMIRATES ID"
                hasDoc={!!staff.emiratesIdDocument?.url}
                docUrl={staff.emiratesIdDocument?.url}
                onUpload={(f) => handleDocUpload(f, "Emirates ID")}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-blue-200 text-[10px] font-bold uppercase mb-1">
                      EID Number
                    </span>
                    <span className="font-bold text-white text-base lg:text-lg truncate block">
                      {staff.emiratesId || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-blue-200 text-[10px] font-bold uppercase mb-1">
                      Expiry
                    </span>
                    <span className="font-bold text-white text-base lg:text-lg">
                      {formatDate(staff.emiratesIdExpiry)}
                    </span>
                  </div>
                </div>
              </SkillBox>
            </div>
          </div>
        </div>
      </div>

      <StaffModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editData={staff}
        onSuccess={() => {
          fetchStaff();
          setIsEditModalOpen(false);
        }}
      />
    </div>
  );
};

// ✅ Original SkillBox Component with Blue Gradient
const SkillBox = ({ number, title, children, hasDoc, docUrl, onUpload }) => {
  const fileRef = useRef(null);
  return (
    <div className="relative pl-12 lg:pl-16 group">
      <div className="absolute left-0 top-3 text-4xl lg:text-5xl font-black text-slate-800/20 select-none">
        {number}
      </div>
      <div className="relative z-10 ml-2">
        <div className="absolute -top-3 left-4 z-20 bg-white px-3 py-1 rounded shadow-sm border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-800">
            {title}
          </span>
        </div>

        {/* ✅ THE BLUE GRADIENT YOU WANTED */}
        <div className="relative bg-gradient-to-r from-[#1e4b85] to-[#3a7bd5] rounded-r-2xl rounded-bl-2xl shadow-lg p-5 pt-8 text-white transition-transform transform hover:scale-[1.01]">
          <div className="absolute top-0 right-0 w-24 h-full bg-white/5 skew-x-12 rounded-r-2xl pointer-events-none"></div>
          <div className="relative z-10">{children}</div>

          <div className="absolute top-3 right-3 flex gap-2 z-30">
            {hasDoc ? (
              <>
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-white/20 hover:bg-white/40 rounded-md backdrop-blur-sm text-white"
                >
                  <Eye className="w-4 h-4" />
                </a>
                <button
                  onClick={() => fileRef.current.click()}
                  className="p-1.5 bg-white/20 hover:bg-white/40 rounded-md backdrop-blur-sm text-white"
                >
                  <UploadCloud className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => fileRef.current.click()}
                className="flex items-center gap-1 px-3 py-1 bg-white text-[#1e4b85] text-[10px] font-bold rounded shadow-sm hover:bg-slate-100"
              >
                <UploadCloud className="w-3 h-3" /> Upload
              </button>
            )}
            <input
              type="file"
              ref={fileRef}
              onChange={(e) => onUpload(e.target.files[0])}
              accept="image/png, image/jpeg, image/jpg, application/pdf"
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
