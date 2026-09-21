import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Phone,
  Lock,
  Building,
  ShoppingBag,
  Loader2,
  Check,
  X,
  Briefcase,
  FileText,
  Globe,
  CreditCard,
  Upload,
  Calendar,
  Truck,
  Map, // ✅ Added Map
  Car, // ✅ Driver icon
  UserCheck, // ✅ Office Staff icon
  Shield, // ✅ Supervisor icon
} from "lucide-react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { createWorker, updateWorker } from "../../redux/slices/workerSlice";
import { fetchBuildings } from "../../redux/slices/buildingSlice";
import { fetchMalls } from "../../redux/slices/mallSlice";
import ModalManager from "./ModalManager";
import CustomDropdown from "../ui/CustomDropdown";
import { workerService } from "../../api/workerService";
import api from "../../api/axiosInstance";

const WorkerModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  // Data Options
  const [allBuildings, setAllBuildings] = useState([]);
  const [allMalls, setAllMalls] = useState([]);
  const [allSites, setAllSites] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    serviceType: "residence",
    employeeCode: "",
    companyName: "",
    joiningDate: "",
    email: "",
    passportNumber: "",
    passportExpiry: "",
    passportDocument: "",
    visaNumber: "",
    visaExpiry: "",
    visaDocument: "",
    emiratesId: "",
    emiratesIdExpiry: "",
    emiratesIdDocument: "",
  });

  const [uploadingDoc, setUploadingDoc] = useState({
    passport: false,
    visa: false,
    emiratesId: false,
  });
  const [selectedBuildings, setSelectedBuildings] = useState([]);
  const [selectedMalls, setSelectedMalls] = useState([]);
  const [selectedSites, setSelectedSites] = useState([]);

  // UI States
  const [buildingSearch, setBuildingSearch] = useState("");
  const [isBuildingDropdownOpen, setIsBuildingDropdownOpen] = useState(false);
  const buildingDropdownRef = useRef(null);

  const [mallSearch, setMallSearch] = useState("");
  const [isMallDropdownOpen, setIsMallDropdownOpen] = useState(false);
  const mallDropdownRef = useRef(null);

  const [siteSearch, setSiteSearch] = useState("");
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
  const siteDropdownRef = useRef(null);

  const serviceTypeOptions = [
    { value: "residence", label: "Residence", icon: Building },
    { value: "mall", label: "Mall", icon: ShoppingBag },
    { value: "site", label: "Site", icon: Map },
    { value: "mobile", label: "Mobile", icon: Truck },
    { value: "driver", label: "Driver", icon: Car },
    { value: "officestaff", label: "Office Staff", icon: UserCheck },
    { value: "supervisor", label: "Supervisor", icon: Shield },
  ];

  // ✅ PREDEFINED COMPANY LIST
  const companyOptions = [
    {
      value: "BABA CAR WASHING AND CLEANING L.L.C.",
      label: "BABA CAR WASHING AND CLEANING L.L.C.",
    },
    {
      value: "NEW SAI TECHNICAL SERVICES L.L.C.",
      label: "NEW SAI TECHNICAL SERVICES L.L.C.",
    },
    {
      value: "SAI BABA CLEANING SERVICES L.L.C.",
      label: "SAI BABA CLEANING SERVICES L.L.C.",
    },
    {
      value: "B C W PARKING CAR WASH L.L.C.",
      label: "B C W PARKING CAR WASH L.L.C.",
    },
  ];

  // --- 1. Load Data ---
  useEffect(() => {
    if (isOpen) {
      const loadOptions = async () => {
        try {
          const [bRes, mRes, sRes] = await Promise.all([
            dispatch(
              fetchBuildings({ page: 1, limit: 1000, search: "" }),
            ).unwrap(),
            dispatch(fetchMalls({ page: 1, limit: 1000, search: "" })).unwrap(),
            api.get("/sites?limit=1000").catch(() => ({ data: { data: [] } })),
          ]);
          setAllBuildings(bRes.data || []);
          setAllMalls(mRes.data || []);
          setAllSites(sRes.data.data || []);
        } catch (error) {
          toast.error("Failed to load options");
        }
      };
      loadOptions();

      if (editData) {
        let sType = "residence";
        if (editData.service_type) sType = editData.service_type;
        else if (editData.malls?.length > 0) sType = "mall";
        else if (editData.sites?.length > 0) sType = "site";

        const existingBuildings = Array.isArray(editData.buildings)
          ? editData.buildings.map((b) =>
              typeof b === "object" ? b : { _id: b, name: "Loading..." },
            )
          : [];
        const existingMalls = Array.isArray(editData.malls)
          ? editData.malls.map((m) =>
              typeof m === "object" ? m : { _id: m, name: "Loading..." },
            )
          : [];
        const existingSites = Array.isArray(editData.sites)
          ? editData.sites.map((s) =>
              typeof s === "object" ? s : { _id: s, name: "Loading..." },
            )
          : [];

        setFormData({
          name: editData.name || "",
          mobile: editData.mobile || "",
          // ✅ Show existing password
          password: editData.password || "",
          confirmPassword: editData.password || "",
          serviceType: sType,
          employeeCode: editData.employeeCode || "",
          companyName: editData.companyName || "",
          joiningDate: editData.joiningDate
            ? editData.joiningDate.split("T")[0]
            : "",
          email: editData.email || "",
          passportNumber: editData.passportNumber || "",
          passportExpiry: editData.passportExpiry
            ? editData.passportExpiry.split("T")[0]
            : "",
          passportDocument: editData.passportDocument || "",
          visaNumber: editData.visaNumber || "",
          visaExpiry: editData.visaExpiry
            ? editData.visaExpiry.split("T")[0]
            : "",
          visaDocument: editData.visaDocument || "",
          emiratesId: editData.emiratesId || "",
          emiratesIdExpiry: editData.emiratesIdExpiry
            ? editData.emiratesIdExpiry.split("T")[0]
            : "",
          emiratesIdDocument: editData.emiratesIdDocument || "",
        });
        setSelectedBuildings(existingBuildings);
        setSelectedMalls(existingMalls);
        setSelectedSites(existingSites);
      } else {
        setFormData({
          name: "",
          mobile: "",
          password: "",
          confirmPassword: "",
          serviceType: "residence",
          employeeCode: "",
          companyName: "",
          joiningDate: "",
          email: "",
          passportNumber: "",
          passportExpiry: "",
          passportDocument: "",
          visaNumber: "",
          visaExpiry: "",
          visaDocument: "",
          emiratesId: "",
          emiratesIdExpiry: "",
          emiratesIdDocument: "",
        });
        setSelectedBuildings([]);
        setSelectedMalls([]);
        setSelectedSites([]);
      }
    }
  }, [isOpen, editData, dispatch]);

  // --- Multi-Select Logic ---
  const toggleSelection = (item, list, setList, searchSetter) => {
    const exists = list.find((i) => i._id === item._id);
    if (exists) setList(list.filter((i) => i._id !== item._id));
    else setList([...list, item]);
    searchSetter("");
  };
  const removeSelection = (id, list, setList) => {
    setList(list.filter((i) => i._id !== id));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buildingDropdownRef.current &&
        !buildingDropdownRef.current.contains(event.target)
      )
        setIsBuildingDropdownOpen(false);
      if (
        mallDropdownRef.current &&
        !mallDropdownRef.current.contains(event.target)
      )
        setIsMallDropdownOpen(false);
      if (
        siteDropdownRef.current &&
        !siteDropdownRef.current.contains(event.target)
      )
        setIsSiteDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBuildings = allBuildings.filter((b) =>
    b.name.toLowerCase().includes(buildingSearch.toLowerCase()),
  );
  const filteredMalls = allMalls.filter((m) =>
    m.name.toLowerCase().includes(mallSearch.toLowerCase()),
  );
  const filteredSites = allSites.filter((s) =>
    s.name.toLowerCase().includes(siteSearch.toLowerCase()),
  );

  const handleDocumentUpload = async (docType) => {
    if (!editData?._id) return toast.error("Please save details first.");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const docKey =
        docType === "Passport"
          ? "passport"
          : docType === "Visa"
            ? "visa"
            : "emiratesId";
      setUploadingDoc((prev) => ({ ...prev, [docKey]: true }));
      const toastId = toast.loading(`Uploading ${docType}...`);
      try {
        const response = await workerService.uploadDocument(
          editData._id,
          file,
          docType,
        );
        toast.success("Uploaded!", { id: toastId });
        const fieldName =
          docType === "Passport"
            ? "passportDocument"
            : docType === "Visa"
              ? "visaDocument"
              : "emiratesIdDocument";
        setFormData((prev) => ({
          ...prev,
          [fieldName]: { filename: response.fileName },
        }));
      } catch (error) {
        toast.error("Upload failed", { id: toastId });
      } finally {
        setUploadingDoc((prev) => ({ ...prev, [docKey]: false }));
      }
    };
    input.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile)
      return toast.error("Name & Mobile required");

    // Password required only for create
    if (!editData && !formData.password)
      return toast.error("Password required");
    if (formData.password !== formData.confirmPassword)
      return toast.error("Passwords do not match");

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        mobile: formData.mobile,
        password: formData.password,
        employeeCode: formData.employeeCode,
        companyName: formData.companyName,
        joiningDate: formData.joiningDate,
        email: formData.email,
        passportNumber: formData.passportNumber,
        passportExpiry: formData.passportExpiry,
        visaNumber: formData.visaNumber,
        visaExpiry: formData.visaExpiry,
        emiratesId: formData.emiratesId,
        emiratesIdExpiry: formData.emiratesIdExpiry,
        // ✅ FIXED: Send 'service_type' (snake_case) to match DB Schema
        service_type: formData.serviceType,
      };

      if (formData.serviceType === "mall") {
        if (selectedMalls.length === 0)
          throw new Error("Select at least one Mall");
        payload.malls = selectedMalls.map((m) => m._id);
        payload.buildings = [];
        payload.sites = [];
      } else if (formData.serviceType === "residence") {
        if (selectedBuildings.length === 0)
          throw new Error("Select at least one Building");
        payload.buildings = selectedBuildings.map((b) => b._id);
        payload.malls = [];
        payload.sites = [];
      } else if (formData.serviceType === "site") {
        if (selectedSites.length === 0)
          throw new Error("Select at least one Site");
        payload.sites = selectedSites.map((s) => s._id);
        payload.malls = [];
        payload.buildings = [];
      } else {
        // Mobile
        payload.malls = [];
        payload.buildings = [];
        payload.sites = [];
      }

      if (editData)
        await dispatch(
          updateWorker({ id: editData._id, data: payload }),
        ).unwrap();
      else await dispatch(createWorker(payload)).unwrap();

      toast.success(editData ? "Worker Updated" : "Worker Created");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  const isPasswordMismatch =
    formData.password &&
    formData.confirmPassword &&
    formData.password !== formData.confirmPassword;

  return (
    <ModalManager
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? "Edit Worker" : "Add New Worker"}
      pageName="WORKERS"
      modalType={editData ? "EDIT" : "CREATE"}
      size="lg"
    >
      <div className="overflow-y-auto max-h-[70vh] p-6 space-y-8 custom-scrollbar">
        <form id="workerForm" onSubmit={handleSubmit} className="space-y-8">
          {/* --- SECTION 1: ACCOUNT INFO --- */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                <User className="w-4 h-4" />
              </div>{" "}
              Account Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Mobile <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) =>
                      setFormData({ ...formData, mobile: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="9876543210"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Full Name"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Password{" "}
                  {!editData && <span className="text-red-500">*</span>}
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={
                      editData
                        ? "Leave blank to keep current"
                        : "Enter Password"
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Confirm {!editData && <span className="text-red-500">*</span>}
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium outline-none ${isPasswordMismatch ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:ring-blue-500"}`}
                    placeholder="Confirm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* --- SECTION 2: HR DETAILS --- */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                <Briefcase className="w-4 h-4" />
              </div>{" "}
              Employment Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                {/* ✅ REPLACED INPUT WITH DROPDOWN FOR COMPANY */}
                <CustomDropdown
                  label="Company"
                  value={formData.companyName}
                  onChange={(val) =>
                    setFormData({ ...formData, companyName: val })
                  }
                  options={companyOptions}
                  icon={Briefcase}
                  placeholder="Select Company"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Emp Code
                </label>
                <input
                  type="text"
                  value={formData.employeeCode}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeCode: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="EMP-001"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Joined Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) =>
                      setFormData({ ...formData, joiningDate: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none rich-date-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* --- SECTION 3: ASSIGNMENT --- */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600">
                <Building className="w-4 h-4" />
              </div>{" "}
              Assignment Logic
            </h4>
            <div className="space-y-2">
              <CustomDropdown
                label="Service Type"
                value={formData.serviceType}
                onChange={(val) =>
                  setFormData({ ...formData, serviceType: val })
                }
                options={serviceTypeOptions}
                icon={Briefcase}
                placeholder="Select Service Type"
              />
            </div>

            {formData.serviceType === "mall" && (
              <div
                ref={mallDropdownRef}
                className="space-y-2 relative animate-in fade-in zoom-in-95"
              >
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Assign Malls <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => setIsMallDropdownOpen(true)}
                  className="w-full min-h-[48px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-500 flex flex-wrap gap-2 items-center cursor-text"
                >
                  {selectedMalls.map((m) => (
                    <span
                      key={m._id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-purple-700 border border-purple-100 shadow-sm"
                    >
                      {m.name}{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelection(
                            m._id,
                            selectedMalls,
                            setSelectedMalls,
                          );
                        }}
                        className="hover:bg-purple-100 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="flex-1 min-w-[120px] outline-none text-sm bg-transparent h-full placeholder:text-slate-400"
                    placeholder={
                      selectedMalls.length === 0 ? "Search Malls..." : ""
                    }
                    value={mallSearch}
                    onChange={(e) => {
                      setMallSearch(e.target.value);
                      setIsMallDropdownOpen(true);
                    }}
                    onFocus={() => setIsMallDropdownOpen(true)}
                  />
                </div>
                {isMallDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 custom-scrollbar">
                    {filteredMalls.map((m) => (
                      <div
                        key={m._id}
                        onClick={() =>
                          toggleSelection(
                            m,
                            selectedMalls,
                            setSelectedMalls,
                            setMallSearch,
                          )
                        }
                        className={`px-4 py-3 text-sm cursor-pointer flex justify-between items-center ${selectedMalls.find((sm) => sm._id === m._id) ? "bg-purple-50 text-purple-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        <span className="flex items-center gap-3">
                          <ShoppingBag className="w-4 h-4 text-slate-400" />{" "}
                          {m.name}
                        </span>
                        {selectedMalls.find((sm) => sm._id === m._id) && (
                          <Check className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {formData.serviceType === "residence" && (
              <div
                ref={buildingDropdownRef}
                className="space-y-2 relative animate-in fade-in zoom-in-95"
              >
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Assign Buildings <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => setIsBuildingDropdownOpen(true)}
                  className="w-full min-h-[48px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 flex flex-wrap gap-2 items-center cursor-text"
                >
                  {selectedBuildings.map((b) => (
                    <span
                      key={b._id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-blue-700 border border-blue-100 shadow-sm"
                    >
                      {b.name}{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelection(
                            b._id,
                            selectedBuildings,
                            setSelectedBuildings,
                          );
                        }}
                        className="hover:bg-blue-100 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="flex-1 min-w-[120px] outline-none text-sm bg-transparent h-full placeholder:text-slate-400"
                    placeholder={
                      selectedBuildings.length === 0
                        ? "Search Buildings..."
                        : ""
                    }
                    value={buildingSearch}
                    onChange={(e) => {
                      setBuildingSearch(e.target.value);
                      setIsBuildingDropdownOpen(true);
                    }}
                    onFocus={() => setIsBuildingDropdownOpen(true)}
                  />
                </div>
                {isBuildingDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 custom-scrollbar">
                    {filteredBuildings.map((b) => (
                      <div
                        key={b._id}
                        onClick={() =>
                          toggleSelection(
                            b,
                            selectedBuildings,
                            setSelectedBuildings,
                            setBuildingSearch,
                          )
                        }
                        className={`px-4 py-3 text-sm cursor-pointer flex justify-between items-center ${selectedBuildings.find((sb) => sb._id === b._id) ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        <span className="flex items-center gap-3">
                          <Building className="w-4 h-4 text-slate-400" />{" "}
                          {b.name}
                        </span>
                        {selectedBuildings.find((sb) => sb._id === b._id) && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {formData.serviceType === "site" && (
              <div
                ref={siteDropdownRef}
                className="space-y-2 relative animate-in fade-in zoom-in-95"
              >
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Assign Sites <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => setIsSiteDropdownOpen(true)}
                  className="w-full min-h-[48px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500 flex flex-wrap gap-2 items-center cursor-text"
                >
                  {selectedSites.map((s) => (
                    <span
                      key={s._id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-orange-700 border border-orange-100 shadow-sm"
                    >
                      {s.name}{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelection(
                            s._id,
                            selectedSites,
                            setSelectedSites,
                          );
                        }}
                        className="hover:bg-orange-100 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="flex-1 min-w-[120px] outline-none text-sm bg-transparent h-full placeholder:text-slate-400"
                    placeholder={
                      selectedSites.length === 0 ? "Search Sites..." : ""
                    }
                    value={siteSearch}
                    onChange={(e) => {
                      setSiteSearch(e.target.value);
                      setIsSiteDropdownOpen(true);
                    }}
                    onFocus={() => setIsSiteDropdownOpen(true)}
                  />
                </div>
                {isSiteDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 custom-scrollbar">
                    {filteredSites.map((s) => (
                      <div
                        key={s._id}
                        onClick={() =>
                          toggleSelection(
                            s,
                            selectedSites,
                            setSelectedSites,
                            setSiteSearch,
                          )
                        }
                        className={`px-4 py-3 text-sm cursor-pointer flex justify-between items-center ${selectedSites.find((ss) => ss._id === s._id) ? "bg-orange-50 text-orange-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        <span className="flex items-center gap-3">
                          <Map className="w-4 h-4 text-slate-400" /> {s.name}
                        </span>
                        {selectedSites.find((ss) => ss._id === s._id) && (
                          <Check className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {formData.serviceType === "mobile" && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 text-sm animate-in fade-in">
                <Truck className="w-5 h-5" />
                <span>Mobile workers are not bound to specific locations.</span>
              </div>
            )}
          </div>

          {/* --- SECTION 4: DOCUMENTS (Same as before) --- */}
          <div className="space-y-4 pb-4">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                <FileText className="w-4 h-4" />
              </div>{" "}
              Official Documents
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1.5">
                  <Globe className="w-3 h-3" /> Passport Details
                </span>
                <input
                  type="text"
                  value={formData.passportNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, passportNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                  placeholder="Passport No."
                />
                <input
                  type="date"
                  value={formData.passportExpiry}
                  onChange={(e) =>
                    setFormData({ ...formData, passportExpiry: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm rich-date-input outline-none"
                />
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Visa Details
                </span>
                <input
                  type="text"
                  value={formData.visaNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, visaNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                  placeholder="Visa No."
                />
                <input
                  type="date"
                  value={formData.visaExpiry}
                  onChange={(e) =>
                    setFormData({ ...formData, visaExpiry: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm rich-date-input outline-none"
                />
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 md:col-span-2">
                <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" /> Emirates ID
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={formData.emiratesId}
                    onChange={(e) =>
                      setFormData({ ...formData, emiratesId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                    placeholder="ID Number"
                  />
                  <input
                    type="date"
                    value={formData.emiratesIdExpiry}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emiratesIdExpiry: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm rich-date-input outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* --- SECTION 5: UPLOADS (Same as before) --- */}
          {editData && (
            <div className="pt-4 border-t border-dashed border-slate-200">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Cloud Document Storage (PDF)
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {["Passport", "Visa", "Emirates ID"].map((doc) => (
                  <button
                    key={doc}
                    type="button"
                    onClick={() => handleDocumentUpload(doc)}
                    disabled={
                      uploadingDoc[
                        doc === "Passport"
                          ? "passport"
                          : doc === "Visa"
                            ? "visa"
                            : "emiratesId"
                      ]
                    }
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-all group disabled:opacity-50"
                  >
                    {uploadingDoc[
                      doc === "Passport"
                        ? "passport"
                        : doc === "Visa"
                          ? "visa"
                          : "emiratesId"
                    ] ? (
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                    ) : (
                      <Upload className="w-6 h-6 mb-2 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    )}
                    <span className="text-[10px] font-bold uppercase">
                      {doc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
      <div className="flex justify-end p-6 border-t border-slate-100 bg-white rounded-b-xl gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="workerForm"
          disabled={loading || (isPasswordMismatch && !editData)}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:shadow-none transition-all"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
          {editData ? "Save Changes" : "Create Worker"}
        </button>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } .rich-date-input::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.5; transition: 0.2s; }`}</style>
    </ModalManager>
  );
};

export default WorkerModal;
