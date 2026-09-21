import React from "react";
import {
  X,
  User,
  Phone,
  Building,
  ShoppingBag,
  MapPin,
  Calendar,
} from "lucide-react";
import ModalManager from "./ModalManager";

const WorkerDetailsModal = ({ isOpen, onClose, worker }) => {
  if (!isOpen || !worker) return null;

  const buildings = worker.buildings || [];
  const malls = worker.malls || [];

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <ModalManager
      isOpen={isOpen}
      onClose={onClose}
      title="Worker Details"
      pageName="WORKERS"
      modalType="VIEW"
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* Worker Info */}
        <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
          <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold border-2 border-indigo-200">
            {worker.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{worker.name}</h2>
            <div className="flex items-center gap-2 text-slate-600 mt-1">
              <Phone className="w-4 h-4" />
              <span className="font-mono">{worker.mobile}</span>
            </div>
            <div className="mt-1">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  worker.status === 1
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {worker.status === 1 ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-xs text-slate-600 mb-1">Worker ID</p>
            <p className="text-lg font-semibold text-slate-800">#{worker.id}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-xs text-slate-600 mb-1">Service Type</p>
            <p className="text-lg font-semibold text-slate-800 capitalize">
              {worker.service_type || "N/A"}
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-xs text-slate-600 mb-1">Created Date</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <p className="text-sm font-medium text-slate-800">
                {formatDate(worker.createdAt)}
              </p>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-xs text-slate-600 mb-1">Last Updated</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <p className="text-sm font-medium text-slate-800">
                {formatDate(worker.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Assigned Locations
          </h3>

          {/* Malls */}
          {malls.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-slate-600 mb-2 font-medium">Malls</p>
              <div className="flex flex-wrap gap-2">
                {malls.map((mall, idx) => (
                  <div
                    key={idx}
                    className="bg-[#2a2e3e] text-white text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm"
                  >
                    <ShoppingBag className="w-4 h-4 opacity-70" />
                    {typeof mall === "object" ? mall.name : `Mall ${mall}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buildings */}
          {buildings.length > 0 && (
            <div>
              <p className="text-xs text-slate-600 mb-2 font-medium">
                Buildings
              </p>
              <div className="flex flex-wrap gap-2">
                {buildings.map((building, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm"
                  >
                    <Building className="w-4 h-4 opacity-80" />
                    {typeof building === "object"
                      ? building.name
                      : `Building ${building}`}
                    {typeof building === "object" &&
                      building.location_id?.name && (
                        <span className="text-xs opacity-80 ml-1">
                          ({building.location_id.name})
                        </span>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {malls.length === 0 && buildings.length === 0 && (
            <p className="text-sm text-slate-500 italic">No assignments yet</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </ModalManager>
  );
};

export default WorkerDetailsModal;
