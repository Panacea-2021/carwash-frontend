import React, { useEffect, useMemo, useState } from "react";
import { UploadCloud, Download, FileBox, Tag, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { staffAppUpdateService } from "../../api/staffAppUpdateService";

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "-";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StaffAppUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [version, setVersion] = useState("");
  const [buildNumber, setBuildNumber] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [file, setFile] = useState(null);

  const latestUpdate = updates[0] || null;
  const previousUpdates = useMemo(() => updates.slice(1), [updates]);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const response = await staffAppUpdateService.list();
      setUpdates(response.data || []);
    } catch (error) {
      toast.error("Failed to load updates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleUpload = async () => {
    if (!file) return toast.error("Select an APK file");
    if (!version.trim()) return toast.error("Version is required");

    setUploading(true);
    const toastId = toast.loading("Uploading APK...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("version", version.trim());
      if (buildNumber.trim())
        formData.append("buildNumber", buildNumber.trim());
      if (releaseNotes.trim())
        formData.append("releaseNotes", releaseNotes.trim());

      await staffAppUpdateService.upload(formData);
      toast.success("APK uploaded", { id: toastId });
      setVersion("");
      setBuildNumber("");
      setReleaseNotes("");
      setFile(null);
      fetchUpdates();
    } catch (error) {
      toast.error("Upload failed", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-amber-50 p-6"
      style={{
        fontFamily: '"Space Grotesk", "Outfit", "Segoe UI", sans-serif',
      }}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white/90 border border-emerald-100 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-[12px] uppercase tracking-[0.3em] text-emerald-500 font-bold">
                Staff App Distribution
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                Staff APK Updates
              </h1>
              <p className="text-slate-500 text-sm mt-2">
                Upload the latest staff APK, track downloads, and keep older
                builds ready for fallback installs.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
              <UploadCloud className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-600 font-bold">
                  Total Releases
                </p>
                <p className="text-lg font-black text-slate-900">
                  {loading ? "..." : updates.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <UploadCloud className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Upload APK
                </h2>
                <p className="text-xs text-slate-500">
                  Add a new version for staff devices.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    Version
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g. 1.2.3"
                    className="mt-2 w-full h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/50 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    Build Number
                  </label>
                  <input
                    type="text"
                    value={buildNumber}
                    onChange={(e) => setBuildNumber(e.target.value)}
                    placeholder="e.g. 120"
                    className="mt-2 w-full h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  Release Notes
                </label>
                <textarea
                  rows="3"
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="Optional short summary of changes"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/50 outline-none"
                />
              </div>

              <div className="border-2 border-dashed border-emerald-200 rounded-2xl p-4 bg-emerald-50/60">
                <input
                  type="file"
                  accept=".apk"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm font-semibold text-emerald-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                />
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                  <FileBox className="w-4 h-4 text-emerald-600" />
                  {file
                    ? `${file.name} (${formatBytes(file.size)})`
                    : "No file selected"}
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black tracking-widest text-xs uppercase shadow-lg shadow-emerald-200/60 hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Publish Update"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-amber-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
                <Tag className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Latest Release
                </h2>
                <p className="text-xs text-slate-500">
                  Current version pushed to staff devices.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="text-sm text-slate-400">Loading...</div>
            ) : latestUpdate ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-amber-600 font-bold">
                    Version
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    v{latestUpdate.version}
                    {latestUpdate.buildNumber
                      ? ` (build ${latestUpdate.buildNumber})`
                      : ""}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    {formatDateTime(latestUpdate.createdAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    <FileBox className="w-4 h-4 text-amber-500" />
                    {formatBytes(latestUpdate.file?.size)}
                  </div>
                </div>
                {latestUpdate.releaseNotes && (
                  <div className="text-sm text-slate-600 leading-relaxed">
                    {latestUpdate.releaseNotes}
                  </div>
                )}
                <a
                  href={latestUpdate.file?.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all"
                >
                  <Download className="w-4 h-4" /> Download APK
                </a>
              </div>
            ) : (
              <div className="text-sm text-slate-400">
                No releases published yet.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Previous Releases
              </h2>
              <p className="text-xs text-slate-500">
                Older APKs available for manual installs.
              </p>
            </div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">
              {previousUpdates.length} total
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-slate-400">Loading...</div>
          ) : previousUpdates.length === 0 ? (
            <div className="text-sm text-slate-400">
              No previous versions yet.
            </div>
          ) : (
            <div className="space-y-3">
              {previousUpdates.map((update) => (
                <div
                  key={update._id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all"
                >
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      v{update.version}
                      {update.buildNumber
                        ? ` (build ${update.buildNumber})`
                        : ""}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(update.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileBox className="w-3 h-3" />
                        {formatBytes(update.file?.size)}
                      </span>
                    </div>
                    {update.releaseNotes && (
                      <p className="text-xs text-slate-500 mt-2">
                        {update.releaseNotes}
                      </p>
                    )}
                  </div>
                  <a
                    href={update.file?.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-widest hover:bg-emerald-50 transition-all"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffAppUpdates;
