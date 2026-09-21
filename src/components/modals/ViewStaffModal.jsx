import React from "react";
import {
  X,
  User,
  Briefcase,
  Map,
  Globe,
  FileText,
  CreditCard,
  Calendar,
} from "lucide-react";

const ViewStaffModal = ({ isOpen, onClose, staff }) => {
  if (!isOpen || !staff) return null;

  const DetailRow = ({ icon: Icon, label, value, isExpired }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-md shadow-sm text-gray-500">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <span
        className={`text-sm font-bold ${
          isExpired ? "text-red-600" : "text-gray-800"
        }`}
      >
        {value || "-"} {isExpired && "(Expired)"}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" /> Staff Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">
              {staff.name?.[0]}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{staff.name}</h3>
            <p className="text-sm text-gray-500">{staff.employeeCode}</p>
          </div>

          <DetailRow
            icon={Briefcase}
            label="Company"
            value={staff.companyName}
          />
          <DetailRow
            icon={Map}
            label="Site"
            value={staff.site?.name || staff.site}
          />
          <DetailRow
            icon={Globe}
            label="Passport No"
            value={staff.passportNumber}
          />
          <DetailRow
            icon={Calendar}
            label="Passport Expiry"
            value={
              staff.passportExpiry
                ? new Date(staff.passportExpiry).toLocaleDateString()
                : "-"
            }
            isExpired={
              staff.passportExpiry &&
              new Date(staff.passportExpiry) < new Date()
            }
          />
          <DetailRow
            icon={FileText}
            label="Visa Expiry"
            value={
              staff.visaExpiry
                ? new Date(staff.visaExpiry).toLocaleDateString()
                : "-"
            }
            isExpired={
              staff.visaExpiry && new Date(staff.visaExpiry) < new Date()
            }
          />
          <DetailRow
            icon={CreditCard}
            label="Emirates ID"
            value={staff.emiratesId}
          />
          <DetailRow
            icon={Calendar}
            label="E-ID Expiry"
            value={
              staff.emiratesIdExpiry
                ? new Date(staff.emiratesIdExpiry).toLocaleDateString()
                : "-"
            }
            isExpired={
              staff.emiratesIdExpiry &&
              new Date(staff.emiratesIdExpiry) < new Date()
            }
          />
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewStaffModal;
