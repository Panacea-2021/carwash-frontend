import React, { useRef, useState, useEffect } from "react";
import { Download, Loader2, Edit2, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

// Helper for Date Input
const formatDateForInput = (dateObj) => {
  if (!dateObj) return "";
  return dateObj.toISOString().split("T")[0];
};

const ReceiptModal = ({ isOpen, onClose, data, onSave }) => {
  const receiptRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState(null);

  useEffect(() => {
    if (data) {
      // Format receipt number: prefer receipt_no, fallback to RCP{id} format
      const formatReceiptNo = () => {
        if (data.receipt_no) return data.receipt_no;
        const id = data.id || data._id;
        if (id && !isNaN(id)) return `RCP${String(id).padStart(6, "0")}`;
        return id ? String(id).slice(-6).toUpperCase() : "000000";
      };

      const initData = data._saved_receipt_state || {
        id: formatReceiptNo(),
        date: data.createdAt ? new Date(data.createdAt) : new Date(),
        carNo: data.vehicle?.registration_no || "-",
        parkingNo: data.vehicle?.parking_no || "-",
        building: data.building?.name || data.customer?.building?.name || "-",
        billAmount:
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
        vat: "-",
        total: `${data.amount_paid || 0} د.إ`,
        tip: `${data.tip || data.tip_amount || 0} د.إ`,
        balance: `${data.balance || 0} د.إ`,
        paymentMode: (data.payment_mode || "cash").toUpperCase(),
        status: (data.status || "pending").toUpperCase(),
        receiver: data.worker?.name || "SATYANARAYANA G.",
      };

      if (typeof initData.date === "string") {
        initData.date = new Date(initData.date);
      }
      setEditableData(initData);
    }
  }, [data, isOpen]);

  if (!isOpen || !editableData) return null;

  const saveChanges = () => {
    if (onSave && data) {
      onSave({ ...data, _saved_receipt_state: editableData });
    }
  };

  // ✅ Download with canvas-safe dotted lines
  const handleDownload = async () => {
    if (!receiptRef.current) return;

    setDownloading(true);

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
        letterRendering: true,
        onclone: (doc) => {
          doc.querySelectorAll(".dotted-line").forEach((el) => {
            el.classList.remove("border-dotted");
            el.classList.remove("border-b-2");
            el.classList.remove("border-t-2");
            el.classList.add("canvas-dotted");
          });
        },
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Receipt_${editableData.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const handleChange = (field, value) => {
    setEditableData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm">
        <div className="flex min-h-full items-center justify-center p-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-xl flex flex-col items-center"
          >
            {/* === RECEIPT CONTAINER === */}
            <div
              ref={receiptRef}
              className="bg-white p-4 w-full max-w-[500px] shadow-2xl text-black font-sans relative"
            >
              {/* Header */}
              <div className="flex flex-col items-center mb-3 text-center">
                <div className="w-16 h-16 mb-1 flex items-center justify-center">
                  <img
                    src="/carwash.jpeg"
                    alt="BCW"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="text-xl font-black uppercase tracking-wide mb-0.5">
                  BABA CAR WASHING AND CLEANING L.L.C.
                </h1>
                <div className="text-xs font-medium text-gray-600 space-y-0">
                  <p>PO Box 126297, Dubai - UAE</p>
                  <p>Mob: 055 241 1075</p>
                  <p className="font-bold text-black">TRN: 105021812000003</p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center font-black uppercase text-xl mb-2 tracking-widest">
                {editableData.paymentMode.includes("CARD")
                  ? "CARD RECEIPT"
                  : "CASH RECEIPT"}
              </div>

              {/* Divider */}
              <div className="border-t-2 border-dotted border-gray-400 mb-3 dotted-border"></div>

              {/* Metadata */}
              <div className="mb-3 px-1">
                <div className="flex justify-between items-end">
                  <div className="flex items-end">
                    <span className="font-bold text-gray-700 text-sm mr-2 mb-0.5">
                      No:
                    </span>
                    <span className="text-red-600 text-lg font-black">
                      {editableData.id}
                    </span>
                  </div>

                  <div className="flex items-end w-[280px]">
                    <span className="font-bold text-gray-700 text-sm mr-2 mb-0.5 shrink-0">
                      Date:
                    </span>
                    <div className="flex-1 border-b-2 border-dotted border-gray-400 text-center px-2 dotted-border mt-2">
                      {isEditing ? (
                        <input
                          type="date"
                          value={formatDateForInput(editableData.date)}
                          onChange={(e) =>
                            handleChange("date", new Date(e.target.value))
                          }
                          className="w-full bg-transparent text-center font-bold text-sm outline-none pb-1.5"
                        />
                      ) : (
                        <span className="font-bold text-black text-sm block pb-1.5">
                          {editableData.date?.toLocaleDateString("en-GB")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1 px-1">
                <ReceiptRow
                  label="Car No"
                  value={editableData.carNo}
                  isEditing={isEditing}
                  onChange={(v) => handleChange("carNo", v)}
                />
                <ReceiptRow
                  label="Parking No"
                  value={editableData.parkingNo}
                  isEditing={isEditing}
                  onChange={(v) => handleChange("parkingNo", v)}
                />
                <ReceiptRow
                  label="Office / Residence Building"
                  value={editableData.building}
                  isEditing={isEditing}
                  onChange={(v) => handleChange("building", v)}
                />
                <ReceiptRow
                  label="Bill Amount"
                  value={editableData.billAmount}
                  isEditing={isEditing}
                  onChange={(v) => handleChange("billAmount", v)}
                />
                <ReceiptRow
                  label="VAT 5%"
                  value={editableData.vat}
                  isEditing={isEditing}
                  onChange={(v) => handleChange("vat", v)}
                />
                <ReceiptRow
                  label="Total AED"
                  value={editableData.total}
                  isEditing={isEditing}
                  onChange={(v) => handleChange("total", v)}
                  isBold
                />
                <ReceiptRow
                  label="Tip"
                  value={editableData.tip}
                  isEditing={isEditing}
                  onChange={(v) => handleChange("tip", v)}
                />
                <ReceiptRow
                  label="Balance"
                  value={editableData.balance}
                  isEditing={isEditing}
                  onChange={(v) => handleChange("balance", v)}
                />
                <ReceiptRow
                  label="Payment Mode"
                  value={editableData.paymentMode}
                  isEditing={isEditing}
                  onChange={(v) => handleChange("paymentMode", v)}
                />

                <div className="pt-2">
                  <ReceiptRow
                    label="Receiver"
                    value={editableData.receiver}
                    isEditing={isEditing}
                    onChange={(v) => handleChange("receiver", v)}
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap justify-center gap-3 mt-6 pb-4">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-white text-slate-700 font-bold rounded-lg shadow hover:bg-slate-50 flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Close
              </button>

              <button
                onClick={() => {
                  if (isEditing) saveChanges();
                  setIsEditing(!isEditing);
                }}
                className={`px-6 py-2 font-bold rounded-lg shadow flex items-center gap-2 ${
                  isEditing
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 text-white"
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

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg flex items-center gap-2"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

// Row Component
const ReceiptRow = ({
  label,
  value,
  isEditing,
  onChange,
  isUppercase,
  isBold,
}) => (
  <div className="flex items-end w-full mb-0.5">
    <div className="w-[220px] font-bold text-gray-700 text-sm shrink-0 mb-0.5">
      {label}:
    </div>

    <div className="flex-1 border-b-2 border-dotted border-gray-400 text-center px-2 dotted-border mt-1">
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-center outline-none font-bold text-sm pb-1.5"
        />
      ) : (
        <span
          className={`block w-full text-black text-sm pb-1.5 ${
            isBold ? "font-black text-base" : "font-bold"
          }`}
        >
          {value || "-"}
        </span>
      )}
    </div>
  </div>
);

export default ReceiptModal;
