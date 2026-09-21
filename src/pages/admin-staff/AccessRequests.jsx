import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Check,
  X,
  Clock,
  Loader2,
  MessageSquare,
  ChevronDown,
  Filter,
  Inbox,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { accessRequestService } from "../../api/accessRequestService";

const STATUS_TABS = [
  { key: "pending", label: "Pending", icon: Clock, color: "amber" },
  { key: "approved", label: "Approved", icon: CheckCircle2, color: "emerald" },
  { key: "rejected", label: "Rejected", icon: XCircle, color: "red" },
];

const TYPE_BADGES = {
  column: { bg: "bg-blue-50", text: "text-blue-600" },
  action: { bg: "bg-purple-50", text: "text-purple-600" },
  toolbar: { bg: "bg-teal-50", text: "text-teal-600" },
};

const AccessRequests = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [tab, setTab] = useState("pending");
  const [responding, setResponding] = useState(null); // request id being responded to
  const [responseText, setResponseText] = useState("");
  const [responseExpanded, setResponseExpanded] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await accessRequestService.list({ status: tab });
      setData(res.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load access requests");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id) => {
    try {
      setResponding(id);
      await accessRequestService.approve(id, responseText);
      toast.success("Request approved — permission granted to staff");
      setResponseText("");
      setResponseExpanded(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to approve");
    } finally {
      setResponding(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setResponding(id);
      await accessRequestService.reject(id, responseText);
      toast.success("Request rejected");
      setResponseText("");
      setResponseExpanded(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to reject");
    } finally {
      setResponding(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this request permanently?")) return;
    try {
      await accessRequestService.delete(id);
      toast.success("Request deleted");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/admin-staff")}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-indigo-600" />
            Access Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and manage permission requests from staff members
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6">
        {STATUS_TABS.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === key
                ? `bg-${color}-50 text-${color}-700 ring-2 ring-${color}-200`
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Inbox className="w-16 h-16 mb-3 opacity-30" />
          <p className="text-sm font-medium">
            No {tab} requests
          </p>
          <p className="text-xs mt-1">
            {tab === "pending"
              ? "All caught up! No pending access requests."
              : `No ${tab} requests found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((req) => (
            <div
              key={req._id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Request Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Staff name & time */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-indigo-600">
                          {req.staffName?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 text-sm">
                          {req.staffName}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">
                          {new Date(req.createdAt).toLocaleDateString("en-GB")}{" "}
                          {new Date(req.createdAt).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Request details */}
                    <div className="flex flex-wrap items-center gap-2 ml-11">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {req.pageLabel || req.page}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          TYPE_BADGES[req.elementType]?.bg || "bg-slate-100"
                        } ${
                          TYPE_BADGES[req.elementType]?.text || "text-slate-600"
                        }`}
                      >
                        {req.elementType}
                      </span>
                      <span className="text-xs text-slate-500">→</span>
                      <span className="text-sm font-medium text-slate-700">
                        {req.elementLabel || req.elementKey}
                      </span>
                    </div>

                    {/* Staff message */}
                    {req.message && (
                      <div className="mt-2 ml-11 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 italic">
                        "{req.message}"
                      </div>
                    )}

                    {/* Admin response (for approved/rejected) */}
                    {req.adminResponse && (
                      <div className="mt-2 ml-11 text-sm text-slate-600 bg-indigo-50 rounded-lg px-3 py-2">
                        <span className="text-xs font-medium text-indigo-500">
                          Admin response:
                        </span>{" "}
                        {req.adminResponse}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {tab === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            setResponseExpanded(
                              responseExpanded === req._id ? null : req._id
                            )
                          }
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                          title="Add response message"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              responseExpanded === req._id ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => handleApprove(req._id)}
                          disabled={responding === req._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                        >
                          {responding === req._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req._id)}
                          disabled={responding === req._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {responding === req._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          Reject
                        </button>
                      </>
                    )}
                    {tab !== "pending" && (
                      <button
                        onClick={() => handleDelete(req._id)}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expandable response textarea */}
              {responseExpanded === req._id && tab === "pending" && (
                <div className="px-4 pb-4 pt-0">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Optional message to staff about this decision..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={2}
                    maxLength={500}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccessRequests;
