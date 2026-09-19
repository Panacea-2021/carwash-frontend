import React, { useRef, useState, useEffect } from "react";
import { Download, Edit2, Check, Loader2, X, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

// Helper for date input
const formatDateForInput = (dateObj) => {
  if (!dateObj) return "";
  return dateObj.toISOString().split("T")[0];
};

const ResidenceReceiptModal = ({ isOpen, onClose, data, type = "Receipt" }) => {
  const contentRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState(null);

  // ✅ FIX: Handle Receipt Numbers - only for completed payments
  const formatId = (rawId, receiptNo) => {
    // Prefer receipt_no from backend (e.g., RCP000001)
    if (receiptNo) return receiptNo;

    // Fallback: Generate receipt number from payment id (numeric field, not MongoDB _id)
    if (rawId && !isNaN(rawId)) {
      return `RCP${String(rawId).padStart(6, "0")}`;
    }

    // No valid ID found
    return "N/A";
  };

  useEffect(() => {
    if (data) {
      const paidAmount = Number(data.amount_paid || 0);
      const invoiceAmount = Number(
        data.total_amount ?? data.balance ?? data.amount_paid ?? 0,
      );

      setLocalData({
        displayId: formatId(data.id || data._id, data.receipt_no),
        originalId: data.id || data._id,
        date: data.createdAt ? new Date(data.createdAt) : new Date(),
        carNo: data.vehicle?.registration_no || "-",
        parkingNo: data.vehicle?.parking_no || "-",
        flatNo: data.customer?.flat_no || "-", // Residence specific
        building: data.building?.name || data.customer?.building?.name || "-",
        billAmountDesc:
          data.billAmountDesc ||
          (() => {
            if (!data.createdAt) return "For the month of Current Month";
            const createdDate = new Date(data.createdAt);
            // Subtract 1 month to get the billing month
            const billingDate = new Date(createdDate);
            billingDate.setMonth(billingDate.getMonth() - 1);
            const month = billingDate.toLocaleDateString("en-US", {
              month: "long",
            });
            const year = billingDate.getFullYear();
            return `For the month of ${month} ${year}`;
          })(),
        amount: paidAmount, // Paid amount (used in receipt)
        invoiceAmount, // Total due amount (used in invoice)
        vat: "-",
        total: `${paidAmount} د.إ`, // String for Receipt View
        tip: `${data.tip || 0} د.إ`,
        balance: `${data.balance || 0} د.إ`,
        receiver: data.worker?.name || "SATYANARAYANA G.",
        paymentMode: (data.payment_mode || "cash").toUpperCase(),
        status: (data.status || "Completed").toUpperCase(),
        // Extra fields for Invoice
        customerName: data.customer?.firstName
          ? `${data.customer.firstName} ${data.customer.lastName || ""}`
          : "Valued Customer",
        customerPhone: data.customer?.mobile || "-",
      });
    }
  }, [data, isOpen]);

  if (!isOpen || !localData) return null;

  const handleDownload = async () => {
    if (!contentRef.current) return;

    if (isEditing) setIsEditing(false);
    // Wait for UI to update
    await new Promise((resolve) => setTimeout(resolve, 300));

    setDownloading(true);
    try {
      const isInvoice = type === "Invoice";

      const canvas = await html2canvas(contentRef.current, {
        scale: 3, // High resolution
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
        width: isInvoice ? 794 : 800, // A4 vs Receipt width
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById("capture-content");
          if (el) {
            el.style.width = isInvoice ? "794px" : "800px";
            el.style.maxWidth = "none";
            el.style.display = "block";
            el.style.padding = isInvoice ? "48px" : "40px";

            // Force colors for crisp output
            el.querySelectorAll("*").forEach((node) => {
              if (!node.classList.contains("text-red-600")) {
                node.style.color = "#000000";
              }
            });
          }
        },
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `${type}_${localData.displayId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${type} downloaded!`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleChange = (key, value) => {
    setLocalData((prev) => ({ ...prev, [key]: value }));
  };

  // --- LAYOUT 1: RECEIPT (The Dotted Line Design) ---
  const renderReceiptLayout = () => (
    <div className="flex flex-col items-center w-full">
      {/* Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-24 h-24 mb-2 flex items-center justify-center">
          <img
            src="/carwash.jpeg"
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-wide text-black mb-1 leading-tight">
          BABA CAR WASHING AND CLEANING L.L.C.
        </h1>
        <div className="text-sm font-medium text-gray-600 space-y-0.5">
          <p>PO Box 126297, Dubai - UAE</p>
          <p>Mob: 055 241 1075</p>
          <p className="font-bold text-black">TRN: 105021812000003</p>
        </div>
      </div>

      {/* Title */}
      <div className="text-center font-black uppercase text-2xl mb-5 tracking-widest text-black">
        {localData.paymentMode.includes("CARD")
          ? "CARD RECEIPT"
          : "CASH RECEIPT"}
      </div>

      <div className="border-t-2 border-dotted border-gray-400 w-full mb-6"></div>

      {/* Meta Data */}
      <div className="flex justify-between items-end mb-6 text-base w-full px-1">
        <div className="flex items-end gap-2">
          <span className="font-bold text-gray-700 text-lg mb-1">No:</span>
          {isEditing ? (
            <input
              value={localData.displayId}
              onChange={(e) => handleChange("displayId", e.target.value)}
              className="font-black text-red-600 text-2xl w-32 border-b border-indigo-300 outline-none leading-none"
            />
          ) : (
            <span className="text-red-600 font-black text-2xl leading-none">
              {localData.displayId}
            </span>
          )}
        </div>

        <div className="flex items-end gap-2 w-[280px]">
          <span className="font-bold text-gray-700 text-lg shrink-0 mb-1">
            Date:
          </span>
          <div className="flex-1 border-b-2 border-dotted border-gray-400 text-center relative px-2">
            {isEditing ? (
              <input
                type="date"
                value={formatDateForInput(localData.date)}
                onChange={(e) => handleChange("date", new Date(e.target.value))}
                className="w-full bg-transparent text-center font-bold text-lg outline-none text-indigo-700 pb-1"
              />
            ) : (
              <span className="font-bold text-black text-lg block pb-1">
                {localData.date.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Data Rows using Helper */}
      <div className="space-y-4 px-1 w-full">
        <ReceiptRow
          label="Car No"
          value={localData.carNo}
          isEditing={isEditing}
          onChange={(v) => handleChange("carNo", v)}
        />
        <ReceiptRow
          label="Parking No"
          value={localData.parkingNo}
          isEditing={isEditing}
          onChange={(v) => handleChange("parkingNo", v)}
        />
        {/* Added Flat No for Residence Receipt */}
        <ReceiptRow
          label="Flat / Villa No"
          value={localData.flatNo}
          isEditing={isEditing}
          onChange={(v) => handleChange("flatNo", v)}
        />
        <ReceiptRow
          label="Office / Residence Building"
          value={localData.building}
          isEditing={isEditing}
          onChange={(v) => handleChange("building", v)}
          isUppercase
        />
        <ReceiptRow
          label="Bill Amount"
          value={localData.billAmountDesc}
          isEditing={isEditing}
          onChange={(v) => handleChange("billAmountDesc", v)}
        />
        <ReceiptRow
          label="VAT 5%"
          value={localData.vat}
          isEditing={isEditing}
          onChange={(v) => handleChange("vat", v)}
        />
        <div className="pt-2">
          <ReceiptRow
            label="Total AED"
            value={localData.total}
            isEditing={isEditing}
            onChange={(v) => handleChange("total", v)}
            isBold
          />
        </div>
        <ReceiptRow
          label="Tip"
          value={localData.tip}
          isEditing={isEditing}
          onChange={(v) => handleChange("tip", v)}
        />
        <ReceiptRow
          label="Balance"
          value={localData.balance}
          isEditing={isEditing}
          onChange={(v) => handleChange("balance", v)}
        />
        <ReceiptRow
          label="Payment Mode"
          value={localData.paymentMode}
          isEditing={isEditing}
          onChange={(v) => handleChange("paymentMode", v)}
          isUppercase
        />

        <div className="pt-6">
          <ReceiptRow
            label="Receiver"
            value={localData.receiver}
            isEditing={isEditing}
            onChange={(v) => handleChange("receiver", v)}
            isUppercase
          />
        </div>
      </div>
    </div>
  );

  // --- LAYOUT 2: INVOICE (A4 Style - Kept Original Structure) ---
  const renderInvoiceLayout = () => (
    <div className="flex flex-col w-full text-slate-800 font-sans h-full">
      {/* Invoice Header */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-2 flex items-center justify-center">
          <img
            src="/carwash.jpeg"
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="font-bold text-xl uppercase mb-2">
          BABA CAR WASHING AND CLEANING L.L.C.
        </h1>
        <div className="text-sm font-medium text-slate-600 space-y-1">
          <p>Mobile: 055 241 1075</p>
          <p>TRN: 105021812000003</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="flex justify-between items-start mb-8 text-sm">
        <div className="space-y-2">
          <div className="flex gap-2">
            <span className="font-bold w-24">Issued To:</span>
            <span>
              {localData.customerPhone !== "-"
                ? localData.customerPhone
                : localData.carNo}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold w-24">Car No:</span>
            <span>{localData.carNo}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold w-24">Parking No:</span>
            <span>{localData.parkingNo}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold w-24">Building:</span>
            <span>{localData.building}</span>
          </div>
        </div>

        <div className="text-right space-y-2">
          <div className="flex gap-2 justify-end">
            <span className="font-bold">Invoice No:</span>
            <span>INV/{localData.displayId}</span>
          </div>
          <div className="flex gap-2 justify-end">
            <span className="font-bold">Date:</span>
            <span>{localData.date.toLocaleDateString("en-GB")}</span>
          </div>
          <div className="flex gap-2 justify-end">
            <span className="font-bold">Due Date:</span>
            <span>{localData.date.toLocaleDateString("en-GB")}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="w-full mb-8 border-b border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#e8e6e1] text-slate-800">
              <th className="py-3 px-4 text-left font-bold w-[40%]">
                Description
              </th>
              <th className="py-3 px-4 text-center font-bold">Unit Price</th>
              <th className="py-3 px-4 text-center font-bold">Quantity</th>
              <th className="py-3 px-4 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-4 px-4 font-medium text-slate-700">
                CAR WASH PAYMENT
              </td>
              <td className="py-4 px-4 text-center text-slate-600">
                {localData.invoiceAmount}
              </td>
              <td className="py-4 px-4 text-center text-slate-600">1</td>
              <td className="py-4 px-4 text-right font-bold text-slate-800">
                {localData.invoiceAmount}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-[#e8e6e1]">
              <td
                colSpan="3"
                className="py-3 px-4 text-right font-bold text-slate-800"
              >
                Total
              </td>
              <td className="py-3 px-4 text-right font-bold text-slate-900">
                {localData.invoiceAmount}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* System Gen Msg */}
      <div className="text-center text-xs font-bold uppercase text-slate-700 mb-8 tracking-wide">
        THIS IS SYSTEM GENERATED INVOICE
      </div>

      {/* Bank Details */}
      <div className="mb-8 text-xs">
        <h3 className="text-red-500 font-bold text-sm mb-3">Bank Details</h3>
        <div className="grid grid-cols-[100px_1fr] gap-y-1 gap-x-4 text-slate-700">
          <span className="font-bold">Bank Address:</span>{" "}
          <span>Ummhurair Dubai UAE</span>
          <span className="font-bold">Swift Code:</span> <span>NRAKAEAK</span>
          <span className="font-bold">Bank Name:</span>{" "}
          <span>Rak Bank (National Bank of Ras Alkhaimah)</span>
          <span className="font-bold">Bank Account:</span>{" "}
          <span>0033422488061</span>
          <span className="font-bold">Account Name:</span>{" "}
          <span>Baba car washing and cleaning</span>
          <span className="font-bold">IBAN No:</span>{" "}
          <span>AE46 0400 0000 3342 2488 061</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center space-y-2 mt-auto">
        <p className="text-[10px] text-slate-500 max-w-lg mx-auto leading-relaxed">
          Please mention your vehicle number and building name in the payment
          reciept and send an email to +971552411075 or
          customerregistration@babagroup.ae once the payment done
        </p>
        <p className="font-bold text-sm text-slate-800 pt-2">
          THANK YOU FOR CHOOSING BABA CAR WASH
        </p>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm">
        <div className="flex min-h-full items-center justify-center p-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`w-full flex flex-col items-center ${
              type === "Invoice" ? "max-w-[794px]" : "max-w-xl"
            }`}
          >
            {/* --- PAPER CONTAINER --- */}
            <div
              id="capture-content"
              ref={contentRef}
              className={`bg-white shadow-2xl relative text-slate-900 font-sans ${
                type === "Invoice"
                  ? "p-12 min-h-[1123px] flex flex-col"
                  : "p-10 w-full max-w-[800px]"
              }`}
            >
              {type === "Invoice"
                ? renderInvoiceLayout()
                : renderReceiptLayout()}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6 pb-6">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-white text-slate-700 font-bold rounded-lg shadow hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Close
              </button>

              {/* Edit button enables manual corrections before download */}
              {type !== "Invoice" && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-6 py-2 font-bold rounded-lg shadow transition-colors flex items-center gap-2 ${
                    isEditing
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isEditing ? (
                    <>
                      <Check className="w-4 h-4" /> Done
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4" /> Edit
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg transition-colors flex items-center gap-2"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download {type}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

// --- HELPER COMPONENT (Dotted Line Style) ---
const ReceiptRow = ({
  label,
  value,
  isEditing,
  onChange,
  isUppercase,
  isBold,
}) => (
  <div className="flex items-end w-full mb-1">
    {/* Fixed Label Width ensures alignment */}
    <div className="w-[220px] font-bold text-gray-700 text-lg shrink-0 mb-1 text-left">
      {label}:
    </div>

    {/* Dots + Value */}
    <div className="flex-1 border-b-2 border-dotted border-gray-400 text-center relative px-2">
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-transparent text-center outline-none text-indigo-700 font-bold text-lg pb-1 ${
            isUppercase ? "uppercase" : ""
          }`}
        />
      ) : (
        <span
          className={`block w-full pb-1 text-black text-lg leading-none ${
            isUppercase ? "uppercase" : ""
          } ${isBold ? "font-black text-xl" : "font-bold"}`}
        >
          {value || "-"}
        </span>
      )}
    </div>
  </div>
);

export default ResidenceReceiptModal;
