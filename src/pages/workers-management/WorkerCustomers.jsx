import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, User, Car, Building2, MapPin, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { workerService } from "../../api/workerService";

const WorkerCustomers = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const worker = location.state?.worker || {};

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    if (id) {
      fetchCustomers();
    }
  }, [id]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await workerService.customers(id);
      setCustomers(response.data || []);
    } catch (error) {
      console.error("Error fetching worker customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/workers/list")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Workers</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              Worker Customers
            </h1>
            {worker.name && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {worker.name} {worker.mobile && `• ${worker.mobile}`}
              </p>
            )}
          </div>
          <div className="text-sm sm:text-base text-gray-700 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <span className="font-bold text-blue-600">{customers.length}</span>{" "}
            Customers
          </div>
        </div>
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No customers found</p>
          <p className="text-gray-400 text-sm mt-2">
            This worker has no assigned customers
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {customers.map((customer, index) => (
            <div
              key={customer._id || index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {customer.firstName} {customer.lastName}
                    </h3>
                    {customer.mobile && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Phone className="w-3 h-3" />
                        <span>{customer.mobile}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {customer.building?.name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 font-medium">
                      {customer.building.name}
                    </span>
                    {customer.flat_no && (
                      <span className="text-gray-500">
                        • Flat {customer.flat_no}
                      </span>
                    )}
                  </div>
                )}

                {customer.location?.name && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {customer.location.name}
                    </span>
                  </div>
                )}

                {customer.vehicles && customer.vehicles.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        Vehicles ({customer.vehicles.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {customer.vehicles.slice(0, 3).map((vehicle, vIdx) => (
                        <div
                          key={vIdx}
                          className="flex items-center justify-between bg-gray-50 rounded px-3 py-2"
                        >
                          <span className="font-mono font-semibold text-gray-800 text-sm">
                            {vehicle.registration_no || "-"}
                          </span>
                          {vehicle.parking_no && (
                            <span className="text-xs text-gray-500 font-mono">
                              P: {vehicle.parking_no}
                            </span>
                          )}
                        </div>
                      ))}
                      {customer.vehicles.length > 3 && (
                        <div className="text-xs text-blue-600 font-medium">
                          +{customer.vehicles.length - 3} more vehicles
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkerCustomers;
