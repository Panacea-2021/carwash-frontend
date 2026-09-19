import React, { useRef, useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

const InvoiceModal = ({ isOpen, onClose, data }) => {
  const invoiceRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !data) return null;

  const handleDownload = async () => {
    if (!invoiceRef.current) return;
    setDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Invoice_${data.id || "000"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  // Helper to format date as DD/MM/YY
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const amount = data.amount_paid || 0;
  const dateStr = formatDate(data.createdAt);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-transparent w-full max-w-2xl flex flex-col items-center"
        >
          {/* --- INVOICE PAPER START --- */}
          <div
            ref={invoiceRef}
            className="bg-white p-10 w-full shadow-2xl text-slate-900 font-sans text-sm relative"
            style={{ minHeight: "800px" }}
          >
            {/* Header: Logo & Company Name */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 mb-3 rounded-full overflow-hidden">
                {/* Ensure image is in public folder */}
                <img
                  src="/carwash.jpeg"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-xl font-bold uppercase tracking-wide text-center">
                BABA CAR WASHING & CLEANING LLC
              </h1>
            </div>

            {/* Info Grid */}
            <div className="flex justify-between items-start mb-8">
              {/* Left Column */}
              <div className="space-y-1.5 w-1/2">
                <div className="flex">
                  <span className="font-bold w-28">Issued To:</span>
                  <span className="font-medium">
                    {data.customer?.mobile || "-"}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-bold w-28">Car No:</span>
                  <span className="font-medium">
                    {data.vehicle?.registration_no || "-"}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-bold w-28">Parking No:</span>
                  <span className="font-medium">
                    {data.vehicle?.parking_no || "-"}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-bold w-28">Building Name:</span>
                  <span className="font-medium">
                    {data.building?.name || "-"}
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-1.5 w-1/2 text-right">
                <div className="flex justify-end">
                  <span className="font-bold mr-2">Invoice No:</span>
                  <span className="font-medium">INV/{data.id || "000000"}</span>
                </div>
                <div className="flex justify-end">
                  <span className="font-bold mr-2">Date:</span>
                  <span className="font-medium">{dateStr}</span>
                </div>
                <div className="flex justify-end">
                  <span className="font-bold mr-2">Due Date:</span>
                  <span className="font-medium"></span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="mb-8">
              {/* Table Header - Beige Color from Image */}
              <div className="grid grid-cols-12 bg-[#EBE5DC] py-2 px-3 font-bold border-b border-gray-200">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Unit Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {/* Table Row */}
              <div className="grid grid-cols-12 py-3 px-3 border-b border-gray-100 items-center">
                <div className="col-span-6 font-medium">CAR WASH PAYMENT</div>
                <div className="col-span-2 text-center">1</div>
                <div className="col-span-2 text-center">{amount}</div>
                <div className="col-span-2 text-right"></div>
              </div>

              {/* Total Row - Beige Color from Image */}
              <div className="grid grid-cols-12 bg-[#EBE5DC] py-2 px-3 font-bold mt-1">
                <div className="col-span-10 text-right pr-4">Total</div>
                <div className="col-span-2 text-right">{amount}</div>
              </div>
            </div>

            <div className="text-center font-bold text-xs uppercase mb-8 tracking-wider">
              THIS IS SYSTEM GENERATED INVOICE
            </div>

            {/* Bank Details - Red Header */}
            <div className="mb-8">
              <h3 className="text-[#ef4444] font-bold mb-3 text-base">
                Bank Details
              </h3>
              <div className="grid grid-cols-[120px_1fr] gap-y-1 text-xs">
                <span className="font-bold">Bank Address:</span>
                <span>Ummhurrair Dubai UAE</span>

                <span className="font-bold">Swift Code:</span>
                <span>NRAKAEAK</span>

                <span className="font-bold">Bank Name:</span>
                <span>
                  Rak Bank(The name is National Bank of Ras Alkhaimah)
                </span>

                <span className="font-bold">Bank Account:</span>
                <span>0033422488061</span>

                <span className="font-bold">Account Name:</span>
                <span>Baba car washing and cleaning</span>

                <span className="font-bold">IBAN No:</span>
                <span>AE46 0400 0000 3342 2488 061</span>
              </div>
            </div>

            <div className="text-xs text-gray-600 mb-6 leading-relaxed">
              Please mention your vehicle number and building name in the
              payment receipt and send an email to +971552411075 or
              customerregistration@babagroup.ae once the payment done
            </div>

            <div className="text-center font-bold text-sm uppercase mt-auto">
              THANK YOU FOR CHOOSING BABA CAR WASH
            </div>
          </div>
          {/* --- INVOICE PAPER END --- */}

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white text-slate-700 font-bold rounded-lg shadow hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download Invoice
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InvoiceModal;
