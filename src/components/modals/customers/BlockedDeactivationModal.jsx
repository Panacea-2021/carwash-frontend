import React from "react";
import { X, AlertTriangle, Calendar, DollarSign, Car } from "lucide-react";

/**
 * BlockedDeactivationModal
 *
 * Shows when deactivation is BLOCKED due to pending payments.
 * Displays a detailed table of all unpaid transactions with vehicle info.
 *
 * Used for both Customer and Vehicle deactivation attempts.
 */
const BlockedDeactivationModal = ({
  isOpen,
  onClose,
  payments,
  totalDue,
  customerName,
  type = "customer", // "customer" or "vehicle"
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">
                ⚠️ Cannot Deactivate - Pending Payments
              </h2>
              <p className="text-sm text-red-100">
                {type === "customer" ? "Customer" : "Vehicle"}: {customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-red-700 rounded-full p-1 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Total Summary */}
        <div className="bg-red-50 border-b border-red-200 px-6 py-4">
          <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-bold text-center text-lg">
              🚫 Deactivation Blocked
            </p>
            <p className="text-red-700 text-center text-sm mt-1">
              All outstanding payments must be cleared before deactivating this{" "}
              {type}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Outstanding</p>
              <p className="text-3xl font-bold text-red-600">
                AED {totalDue.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Pending Transactions</p>
              <p className="text-3xl font-bold text-red-600">
                {payments.length}
              </p>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                    Payment ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                    Vehicle No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                    Parking No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 border-b">
                    Charged
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 border-b">
                    Previous Due
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 border-b">
                    Paid
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 border-b">
                    Amount Due
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-b">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => {
                  const amountDue =
                    payment.amountDue ||
                    (payment.total_amount || 0) - (payment.amount_paid || 0);

                  return (
                    <tr
                      key={payment._id || index}
                      className="hover:bg-gray-50 transition border-b border-gray-100"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold text-gray-800">
                          #{payment.id || payment._id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {payment.vehicle?.registration_no ||
                              payment.vehicleNo ||
                              "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {payment.vehicle?.parking_no ||
                            payment.parkingNo ||
                            "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(payment.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-gray-800">
                          AED {(payment.amount_charged || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-orange-600">
                          AED {(payment.old_balance || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-gray-800">
                          AED {(payment.amount_paid || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-lg font-bold text-red-600">
                          AED {amountDue.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                          {payment.status || "pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-3 text-right font-bold text-gray-800"
                  >
                    Total Outstanding:
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xl font-bold text-red-600">
                      AED {totalDue.toFixed(2)}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-bold text-red-600">
                ⚠️ IMPORTANT: Pay all {payments.length} transaction(s) totaling
                AED {totalDue.toFixed(2)} before deactivating
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Go to Pending Payments page → Mark payments as paid → Then
                deactivate
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockedDeactivationModal;
