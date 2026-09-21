import React from "react";
import { X, FileText, ExternalLink, CheckCircle, XCircle } from "lucide-react";

const DocumentViewModal = ({
  isOpen,
  onClose,
  staff,
  getDocumentUrl, // Kept primarily for prop consistency
  onViewDocument,
}) => {
  if (!isOpen || !staff) return null;

  const documents = [
    {
      name: "Passport",
      data: staff.passportDocument,
      number: staff.passportNumber,
      expiry: staff.passportExpiry,
      color: "blue",
    },
    {
      name: "Visa",
      data: staff.visaDocument,
      number: null,
      expiry: staff.visaExpiry,
      color: "purple",
    },
    {
      name: "Emirates ID",
      data: staff.emiratesIdDocument,
      number: staff.emiratesId,
      expiry: staff.emiratesIdExpiry,
      color: "teal",
    },
  ];

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const openDocument = (docType) => {
    console.log(`[DocumentViewModal] Request to view: ${docType}`);
    if (onViewDocument) {
      onViewDocument(staff._id, docType, staff.name);
      onClose();
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: "from-blue-500 to-blue-600 bg-blue-50 text-blue-600 border-blue-200",
      purple:
        "from-purple-500 to-purple-600 bg-purple-50 text-purple-600 border-purple-200",
      teal: "from-teal-500 to-teal-600 bg-teal-50 text-teal-600 border-teal-200",
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{staff.name}</h2>
            <p className="text-indigo-100 text-sm">
              {staff.employeeCode} • {staff.companyName || "N/A"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid gap-4">
            {documents.map((doc) => {
              const hasDoc = doc.data && doc.data.filename;
              const colorClasses = getColorClasses(doc.color);

              return (
                <div
                  key={doc.name}
                  className={`border-2 rounded-xl p-5 transition-all ${
                    hasDoc
                      ? "border-green-200 bg-green-50/30 shadow-sm"
                      : "border-gray-200 bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                            colorClasses.split(" ")[0]
                          } ${
                            colorClasses.split(" ")[1]
                          } flex items-center justify-center shadow-md`}
                        >
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">
                            {doc.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {hasDoc ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-xs text-green-600 font-medium">
                                  Document Uploaded
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  Not Uploaded
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 pl-13">
                        {doc.number && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500 w-20">
                              Number:
                            </span>
                            <span className="text-sm text-gray-900 font-mono">
                              {doc.number}
                            </span>
                          </div>
                        )}
                        {doc.expiry && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500 w-20">
                              Expiry:
                            </span>
                            <span className="text-sm text-gray-900">
                              {formatDate(doc.expiry)}
                            </span>
                          </div>
                        )}
                        {hasDoc && (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-500 w-20">
                                File:
                              </span>
                              <span className="text-sm text-gray-700">
                                {doc.data.filename}
                              </span>
                            </div>
                            {doc.data.uploadedAt && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500 w-20">
                                  Uploaded:
                                </span>
                                <span className="text-sm text-gray-600">
                                  {formatDate(doc.data.uploadedAt)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Action Button */}
                      {hasDoc && (
                        <button
                          onClick={() => openDocument(doc.name)}
                          className={`mt-4 w-full px-4 py-2.5 bg-gradient-to-r ${
                            colorClasses.split(" ")[0]
                          } ${
                            colorClasses.split(" ")[1]
                          } hover:shadow-lg text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2`}
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Document
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewModal;
