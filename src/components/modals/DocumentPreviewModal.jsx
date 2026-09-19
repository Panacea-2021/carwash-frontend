import React from "react";
import { X, ExternalLink } from "lucide-react";

const DocumentPreviewModal = ({ isOpen, onClose, documentUrl, title }) => {
  if (!isOpen) return null;

  console.log(`[PreviewModal] Rendering URL: ${documentUrl}`);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Viewer */}
        <div className="flex-1 bg-gray-100 overflow-hidden relative">
          {/* IFrame to render PDF from secure proxy */}
          <iframe
            src={documentUrl}
            className="w-full h-full border-0"
            title={title}
            onError={(e) => console.error("Iframe Error:", e)}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
