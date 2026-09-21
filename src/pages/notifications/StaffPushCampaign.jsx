import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Send,
  Users,
  UserCheck,
  Image as ImageIcon,
  Link2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  UploadCloud,
  Palette,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { workerService } from "../../api/workerService";
import staffNotificationService from "../../api/staffNotificationService";
import usePagePermissions from "../../utils/usePagePermissions";

const STAFF_APP_ROUTE_OPTIONS = [
  { value: "/dashboard", label: "Dashboard (/dashboard)" },
  { value: "/schedule_jobs", label: "Schedule Jobs (/schedule_jobs)" },
  { value: "/payments", label: "Payments (/payments)" },
  { value: "/onewash", label: "OneWash (/onewash)" },
  { value: "/history", label: "History (/history)" },
  { value: "/profile", label: "Profile (/profile)" },
  { value: "/notifications", label: "Notifications (/notifications)" },
];

const StaffPushCampaign = () => {
  const pp = usePagePermissions("notifications");
  const navigate = useNavigate();

  const [sending, setSending] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [staff, setStaff] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sendResult, setSendResult] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [healthResult, setHealthResult] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
    imageUrl: "",
    type: "campaign",
    route: "/notifications",
    openBehavior: "details",
    emoji: "",
    logoUrl: "",
    accentColor: "#1F4ED8",
    backgroundColor: "#EEF3FF",
    textColor: "#1A1A2E",
    ctaLabel: "",
    ctaRoute: "",
    sendToAll: true,
  });

  useEffect(() => {
    const load = async () => {
      if (form.sendToAll) return;
      try {
        setLoadingStaff(true);
        const res = await workerService.list(1, 50, searchText, 1);
        setStaff(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load staff");
      } finally {
        setLoadingStaff(false);
      }
    };

    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [form.sendToAll, searchText]);

  const selectedCount = selectedIds.length;

  const audienceLabel = useMemo(() => {
    if (form.sendToAll) return "All active staff";
    return `${selectedCount} selected staff member${
      selectedCount === 1 ? "" : "s"
    }`;
  }, [form.sendToAll, selectedCount]);

  const toggleStaff = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      toast.error("Please select a valid image file");
      event.target.value = "";
      return;
    }

    try {
      setUploadingImage(true);
      const response = await staffNotificationService.uploadCampaignImage(file);
      const uploadedUrl = response?.data?.imageUrl || "";

      if (!uploadedUrl) {
        throw new Error("Upload completed but image URL was missing");
      }

      setForm((prev) => ({ ...prev, imageUrl: uploadedUrl }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Image upload failed";
      toast.error(message);
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const title = form.title.trim();
    const message = form.message.trim();

    if (!title) {
      toast.error("Title is required");
      return;
    }
    if (!message) {
      toast.error("Message is required");
      return;
    }

    if (!form.sendToAll && selectedIds.length === 0) {
      toast.error("Please select at least one staff member");
      return;
    }

    const effectiveRoute =
      form.openBehavior === "page"
        ? form.route.trim() || "/notifications"
        : "/notifications";

    const payload = {
      title,
      message,
      imageUrl: form.imageUrl.trim(),
      type: form.type.trim() || "campaign",
      route: effectiveRoute,
      sendToAll: form.sendToAll,
      workerIds: form.sendToAll ? [] : selectedIds,
      data: {
        source: "admin-panel",
        audience: form.sendToAll ? "all" : "selected",
        openBehavior: form.openBehavior,
        emoji: form.emoji.trim(),
        logoUrl: form.logoUrl.trim(),
        accentColor: form.accentColor,
        backgroundColor: form.backgroundColor,
        textColor: form.textColor,
        ctaLabel: form.ctaLabel.trim(),
        ctaRoute: form.ctaRoute.trim() || "/notifications",
      },
    };

    try {
      setSending(true);
      setSendResult(null);
      const res = await staffNotificationService.sendCampaign(payload);
      setSendResult(res?.data || null);
      toast.success("Push campaign sent successfully");
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to send push campaign";
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const handleHealthCheck = async () => {
    try {
      setCheckingHealth(true);
      const res = await staffNotificationService.checkHealth();
      setHealthResult(res?.data || null);

      if (res?.data?.configured && res?.data?.initialized) {
        toast.success("Firebase push backend is ready");
      } else {
        toast.error(res?.data?.message || "Firebase push is not ready");
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Health check failed";
      toast.error(message);
    } finally {
      setCheckingHealth(false);
    }
  };

  const previewImage = form.imageUrl.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f8ff] via-[#f8f9ff] to-[#eef8f3] p-6">
      <div className="mx-auto max-w-7xl grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-6">
        <section className="rounded-3xl border border-[#dde7ff] bg-white/95 shadow-[0_18px_60px_rgba(34,62,133,0.14)] overflow-hidden">
          <div className="px-7 py-6 border-b border-[#ecf1ff] bg-gradient-to-r from-[#eef3ff] to-[#f5f8ff]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1f4ed8] text-white flex items-center justify-center shadow-lg">
                <BellRing className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#13203a] tracking-tight">
                  Staff Push Campaign
                </h1>
                <p className="text-sm text-[#51607f] mt-1">
                  Send rich staff app notifications from admin panel with
                  targeted audience.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/notifications/staff/history/notification-wise")
                    }
                    className="rounded-lg border border-[#cfe0ff] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f4ed8] hover:bg-[#edf3ff]"
                  >
                    History: Notification-wise
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/notifications/staff/history/staff-wise")
                    }
                    className="rounded-lg border border-[#cfe0ff] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f4ed8] hover:bg-[#edf3ff]"
                  >
                    History: Staff-wise
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/notifications/staff/tracking")}
                    className="rounded-lg border border-[#cfe0ff] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f4ed8] hover:bg-[#edf3ff]"
                  >
                    Notification Tracking
                  </button>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-7 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({ ...prev, sendToAll: true }));
                  setSelectedIds([]);
                }}
                className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                  form.sendToAll
                    ? "border-[#1f4ed8] bg-[#edf3ff] shadow-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-[#1b2a4a]">
                  <Users className="w-5 h-5" />
                  Send To All
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Targets all active staff with registered device tokens.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, sendToAll: false }))
                }
                className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                  !form.sendToAll
                    ? "border-[#0f8f65] bg-[#ebfbf5] shadow-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-[#1b2a4a]">
                  <UserCheck className="w-5 h-5" />
                  Send To Selected
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Pick exact staff members from search results.
                </p>
              </button>
            </div>

            {!form.sendToAll && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700">
                    Select Staff
                  </label>
                  <span className="text-xs font-semibold text-slate-500">
                    {selectedCount} selected
                  </span>
                </div>

                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search by name or mobile..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-[#1f4ed8]/15 focus:border-[#1f4ed8]"
                />

                <div className="max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                  {loadingStaff ? (
                    <div className="py-8 flex items-center justify-center text-slate-500 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading staff...
                    </div>
                  ) : staff.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-sm">
                      No staff found.
                    </div>
                  ) : (
                    staff.map((worker) => {
                      const checked = selectedIds.includes(worker._id);
                      return (
                        <label
                          key={worker._id}
                          className={`flex items-center justify-between px-4 py-3 cursor-pointer transition ${
                            checked ? "bg-[#f0f7ff]" : "hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {worker.name || "Unnamed Staff"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {worker.mobile || "No Mobile"}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStaff(worker._id)}
                            className="w-4 h-4 accent-[#1f4ed8]"
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="Shift started for your schedule"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-[#1f4ed8]/15 focus:border-[#1f4ed8]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Type
                </label>
                <input
                  value={form.type}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, type: e.target.value }))
                  }
                  placeholder="shift_update"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-[#1f4ed8]/15 focus:border-[#1f4ed8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Message
              </label>
              <textarea
                value={form.message}
                onChange={(e) =>
                  setForm((p) => ({ ...p, message: e.target.value }))
                }
                rows={4}
                placeholder="Your shift has started. Tap to view schedule."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-[#1f4ed8]/15 focus:border-[#1f4ed8]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Image URL (Optional)
                </label>
                <input
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, imageUrl: e.target.value }))
                  }
                  placeholder="https://yourcdn.com/banner.jpg"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-[#1f4ed8]/15 focus:border-[#1f4ed8]"
                />
                <div className="mt-2 flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 rounded-lg border border-[#cfe0ff] bg-[#edf3ff] px-3 py-2 text-[#1f4ed8] text-xs font-semibold cursor-pointer hover:bg-[#e3eeff]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage || sending}
                    />
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        Upload from device
                      </>
                    )}
                  </label>

                  {form.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, imageUrl: "" }))}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  You can paste an image URL or upload one directly from your
                  device.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Open Behavior
                  </label>
                  <select
                    value={form.openBehavior}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, openBehavior: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-[#1f4ed8]/15 focus:border-[#1f4ed8]"
                  >
                    <option value="details">
                      Open full notification detail
                    </option>
                    <option value="page">Directly open selected page</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    App Route
                  </label>
                  <select
                    value={form.route}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, route: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-[#1f4ed8]/15 focus:border-[#1f4ed8]"
                  >
                    {STAFF_APP_ROUTE_OPTIONS.map((routeOption) => (
                      <option key={routeOption.value} value={routeOption.value}>
                        {routeOption.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {form.openBehavior === "page"
                      ? "Staff tap directly opens this route."
                      : "Used for CTA button from notification detail."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                <Palette className="h-4 w-4" />
                Rich Style Configuration
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Emoji / Sticker
                  </label>
                  <input
                    value={form.emoji}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, emoji: e.target.value }))
                    }
                    placeholder="\ud83d\udca7"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1f4ed8]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Logo URL (optional)
                  </label>
                  <input
                    value={form.logoUrl}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, logoUrl: e.target.value }))
                    }
                    placeholder="https://cdn/logo.png"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1f4ed8]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    CTA Button Label
                  </label>
                  <input
                    value={form.ctaLabel}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, ctaLabel: e.target.value }))
                    }
                    placeholder="View details"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1f4ed8]/20"
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    CTA Route
                  </label>
                  <select
                    value={form.ctaRoute}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, ctaRoute: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1f4ed8]/20"
                  >
                    <option value="">Use App Route</option>
                    {STAFF_APP_ROUTE_OPTIONS.map((routeOption) => (
                      <option
                        key={`cta-${routeOption.value}`}
                        value={routeOption.value}
                      >
                        {routeOption.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Accent Color
                  </label>
                  <input
                    type="color"
                    value={form.accentColor}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, accentColor: e.target.value }))
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={form.backgroundColor}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        backgroundColor: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Text Color
                  </label>
                  <input
                    type="color"
                    value={form.textColor}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, textColor: e.target.value }))
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[#dce7ff] bg-[#f5f8ff] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[#1a2f57]">Audience</p>
                <p className="text-xs text-[#51607f] mt-0.5">{audienceLabel}</p>
              </div>
              <button
                type="submit"
                disabled={
                  sending ||
                  (!pp.isToolbarVisible("sendPush") && pp.hasRestrictions)
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1f4ed8] to-[#0f8f65] hover:from-[#1d46c1] hover:to-[#0c7a56] text-white px-6 py-3 font-bold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? "Sending..." : "Send Push Campaign"}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-[#e8eefb] bg-white p-5 shadow-[0_12px_35px_rgba(15,31,73,0.08)]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-[#172a4c] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#1f4ed8]" />
                  Backend Push Readiness
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Verify Firebase service account configuration before sending
                  campaign.
                </p>
              </div>

              <button
                type="button"
                onClick={handleHealthCheck}
                disabled={checkingHealth}
                className="inline-flex items-center gap-2 rounded-xl border border-[#cfe0ff] bg-[#edf3ff] px-4 py-2.5 text-[#1f4ed8] font-semibold hover:bg-[#e3eeff] disabled:opacity-60"
              >
                {checkingHealth ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                {checkingHealth ? "Checking..." : "Run Health Check"}
              </button>
            </div>

            {!healthResult ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Click Run Health Check to validate backend Firebase setup.
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                    healthResult.configured
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  Firebase Config:{" "}
                  {healthResult.configured ? "Configured" : "Missing"}
                </div>
                <div
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                    healthResult.initialized
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  Firebase Init:{" "}
                  {healthResult.initialized ? "Initialized" : "Not initialized"}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                  {healthResult.message || "No message"}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-[#e5edff] bg-white p-5 shadow-[0_16px_40px_rgba(12,34,86,0.1)]">
            <div className="flex items-center gap-2 text-[#17315e] font-bold mb-4">
              <Sparkles className="w-5 h-5 text-[#2563eb]" />
              Live Notification Preview
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-[#192b59] to-[#0f8f65] p-4 text-white shadow-xl">
              <div className="text-xs uppercase tracking-wider text-white/80 mb-1">
                BCW Staff App
              </div>
              <div className="font-bold text-sm">
                {form.title.trim() || "Your notification title"}
              </div>
              <div className="text-sm text-white/90 mt-1 leading-relaxed">
                {form.message.trim() ||
                  "Your campaign message preview will appear here."}
              </div>
              {previewImage && (
                <img
                  src={previewImage}
                  alt="preview"
                  className="mt-3 w-full h-32 object-cover rounded-xl border border-white/30"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[#e9eef7] bg-white p-5 shadow-[0_12px_35px_rgba(15,31,73,0.08)]">
            <h3 className="font-bold text-[#172a4c] mb-3">Send Result</h3>

            {!sendResult ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Send a campaign to view delivery summary metrics here.
              </div>
            ) : (
              <div className="space-y-3">
                <ResultRow
                  label="Target Staff"
                  value={sendResult.targetWorkers}
                  icon={Users}
                />
                <ResultRow
                  label="Total Tokens"
                  value={sendResult.totalTokens}
                  icon={BellRing}
                />
                <ResultRow
                  label="Success"
                  value={sendResult.successCount}
                  icon={CheckCircle2}
                  success
                />
                <ResultRow
                  label="Failed"
                  value={sendResult.failureCount}
                  icon={AlertCircle}
                  danger
                />
                <ResultRow
                  label="Invalid Tokens Deactivated"
                  value={sendResult.invalidTokensDeactivated}
                  icon={AlertCircle}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const ResultRow = ({ label, value, icon, success, danger }) => {
  const IconComponent = icon;
  const colorClass = success
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : danger
      ? "text-rose-700 bg-rose-50 border-rose-200"
      : "text-slate-700 bg-slate-50 border-slate-200";

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 flex items-center justify-between ${colorClass}`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        {IconComponent ? <IconComponent className="w-4 h-4" /> : null}
        {label}
      </div>
      <div className="text-sm font-extrabold">{value ?? 0}</div>
    </div>
  );
};

export default StaffPushCampaign;
