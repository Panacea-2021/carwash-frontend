import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download, Calendar, Car } from "lucide-react";
import toast from "react-hot-toast";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";
import { workerService } from "../../api/workerService";
import { buildingService } from "../../api/buildingService";
import { customerService } from "../../api/customerService";

const WorkerWashedCars = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const worker = location.state?.worker || {};

  // State
  const [loading, setLoading] = useState(true);
  const [washedCars, setWashedCars] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [buildings, setBuildings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const [buildingsMap, setBuildingsMap] = useState(new Map());
  const [customersMap, setCustomersMap] = useState(new Map());

  // Helper function to fetch buildings by IDs
  const fetchBuildingsByIds = async (ids) => {
    if (ids.length === 0) {
      console.log("🏢 [FETCH BUILDINGS] No building IDs to fetch");
      return [];
    }
    try {
      console.log("🏢 [FETCH BUILDINGS] Fetching for IDs:", ids);
      const response = await buildingService.list(1, 1000, "");
      console.log("🏢 [FETCH BUILDINGS] Full Response:", response);
      const allBuildings = response.data || [];
      console.log(
        "🏢 [FETCH BUILDINGS] All buildings count:",
        allBuildings.length
      );
      const filtered = allBuildings.filter((b) => {
        const match = ids.includes(b._id);
        if (match) {
          console.log("🏢 [MATCH] Building found:", b._id, b.name);
        }
        return match;
      });
      console.log("🏢 [FETCH BUILDINGS] Filtered:", filtered.length, filtered);
      return filtered;
    } catch (error) {
      console.error("❌ [BUILDINGS] Fetch error:", error);
      return [];
    }
  };

  // Helper function to fetch customers by IDs
  const fetchCustomersByIds = async (ids) => {
    if (ids.length === 0) {
      console.log("👤 [FETCH CUSTOMERS] No customer IDs to fetch");
      return [];
    }
    try {
      console.log("👤 [FETCH CUSTOMERS] Fetching for IDs:", ids);
      const response = await customerService.list(1, 1000, "", 1);
      console.log("👤 [FETCH CUSTOMERS] Full Response:", response);
      const allCustomers = response.data || [];
      console.log(
        "👤 [FETCH CUSTOMERS] All customers count:",
        allCustomers.length
      );
      const filtered = allCustomers.filter((c) => {
        const match = ids.includes(c._id);
        if (match) {
          console.log(
            "👤 [MATCH] Customer found:",
            c._id,
            c.firstName,
            c.mobile
          );
        }
        return match;
      });
      console.log("👤 [FETCH CUSTOMERS] Filtered:", filtered.length, filtered);
      return filtered;
    } catch (error) {
      console.error("❌ [CUSTOMERS] Fetch error:", error);
      return [];
    }
  };

  // Fetch washed cars data
  const fetchWashedCars = async () => {
    setLoading(true);
    try {
      console.log("🚗 [WASHED CARS] Fetching worker history for worker:", {
        workerId: id,
        worker: worker,
        dateRange: {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        },
        search: searchTerm,
      });

      const params = {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        service_type: "residence",
      };

      if (selectedBuilding && selectedBuilding !== "all") {
        params.building = selectedBuilding;
      }

      if (selectedCustomer && selectedCustomer !== "all") {
        params.customer = selectedCustomer;
      }

      console.log("🚗 [WASHED CARS] API request params:", params);

      const result = await workerService.payments(id, params);

      console.log("🚗 [WASHED CARS] Worker history API response:", {
        total: result.total,
        dataLength: result.data?.length,
        fullResponse: result,
        sampleRecord: result.data?.[0]
          ? {
              id: result.data[0]._id,
              status: result.data[0].status,
              assignedDate: result.data[0].assignedDate,
              completedDate: result.data[0].completedDate,
              payment_date: result.data[0].payment_date,
              amount: result.data[0].amount,
              customer: result.data[0].customer,
              vehicle: result.data[0].vehicle,
              building: result.data[0].building,
              location: result.data[0].location,
              createdAt: result.data[0].createdAt,
              allFields: Object.keys(result.data[0]),
            }
          : null,
      });

      const washedRecords = result.data || [];
      console.log(
        "🚗 [WASHED CARS] Found:",
        washedRecords.length,
        "job records"
      );

      // Extract unique building and customer IDs
      const buildingIds = [
        ...new Set(washedRecords.map((r) => r.building).filter(Boolean)),
      ];
      const customerIds = [
        ...new Set(washedRecords.map((r) => r.customer).filter(Boolean)),
      ];

      console.log("🔍 [WASHED CARS] Extracted IDs:", {
        buildingIds,
        customerIds,
        sampleRecord: washedRecords[0],
      });

      // Fetch building and customer details
      const [buildingsData, customersData] = await Promise.all([
        fetchBuildingsByIds(buildingIds),
        fetchCustomersByIds(customerIds),
      ]);

      // Create maps for quick lookup
      const buildingsLookup = new Map(buildingsData.map((b) => [b._id, b]));
      const customersLookup = new Map(customersData.map((c) => [c._id, c]));

      setBuildingsMap(buildingsLookup);
      setCustomersMap(customersLookup);

      console.log("✅ [WASHED CARS] Loaded building/customer data:", {
        buildings: buildingsData.length,
        customers: customersData.length,
      });

      // Sort by completion/payment date - most recent first
      const sortedRecords = washedRecords.sort((a, b) => {
        const dateA = new Date(
          a.completedDate || a.assignedDate || a.createdAt
        ).getTime();
        const dateB = new Date(
          b.completedDate || b.assignedDate || b.createdAt
        ).getTime();
        return dateB - dateA;
      });

      setWashedCars(sortedRecords);
    } catch (error) {
      console.error("❌ [WASHED CARS] Error fetching worker history:", error);
      toast.error("Failed to load worker job history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchWashedCars();
      fetchBuildings();
      fetchCustomers();
    }
  }, [id]);

  // Fetch buildings for filter dropdown
  const fetchBuildings = async () => {
    try {
      console.log("🏢 [BUILDINGS] Fetching buildings for filter dropdown");
      const response = await buildingService.list(1, 1000, "");
      console.log("🏢 [BUILDINGS] Response:", response);

      if (response && response.data) {
        setBuildings(response.data);
        console.log(
          "🏢 [BUILDINGS] Loaded:",
          response.data.length,
          "buildings"
        );
      }
    } catch (error) {
      console.error("❌ [BUILDINGS] Error fetching buildings:", error);
    }
  };

  // Fetch customers for filter dropdown
  const fetchCustomers = async () => {
    try {
      console.log("👤 [CUSTOMERS] Fetching customers for filter dropdown");
      const response = await customerService.list(1, 1000, "", 1);
      console.log("👤 [CUSTOMERS] Response:", response);

      if (response && response.data) {
        setCustomers(response.data);
        console.log(
          "👤 [CUSTOMERS] Loaded:",
          response.data.length,
          "customers"
        );
      }
    } catch (error) {
      console.error("❌ [CUSTOMERS] Error fetching customers:", error);
    }
  };

  // Handle search button click
  const handleSearch = () => {
    console.log("🔍 [SEARCH] Search button clicked with filters:", {
      searchTerm,
      dateRange,
      selectedBuilding,
      selectedCustomer,
    });
    fetchWashedCars();
    toast.success("Filters applied");
  };

  // Handle clear filters button
  const handleClearFilters = () => {
    console.log("🔄 [CLEAR] Clearing all filters");
    setSearchTerm("");
    setSelectedBuilding("all");
    setSelectedCustomer("all");
    setDateRange({
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      endDate: new Date(),
    });
    setTimeout(() => {
      fetchWashedCars();
    }, 100);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB");
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
              <Car className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              Washed Cars Report
            </h1>
            {worker.name && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {worker.name} {worker.mobile && `• ${worker.mobile}`}
              </p>
            )}
          </div>
          <div className="text-sm sm:text-base text-gray-700 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <span className="font-bold text-blue-600">{washedCars.length}</span>{" "}
            Cars Washed
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Vehicle/Parking No..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Date Range
            </label>
            <RichDateRangePicker
              startDate={dateRange.startDate.toISOString().split("T")[0]}
              endDate={dateRange.endDate.toISOString().split("T")[0]}
              onChange={(field, value) => {
                console.log("📅 [DATE CHANGE]:", field, value);
                setDateRange((prev) => ({
                  ...prev,
                  [field]: value ? new Date(value) : new Date(),
                }));
              }}
            />
          </div>

          {/* Building Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Building
            </label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Buildings</option>
              {buildings.map((building) => (
                <option key={building._id} value={building._id}>
                  {building.name}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Customer
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Customers</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.firstName} {customer.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Apply Filters
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  #
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Parking No
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Vehicle No
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Cleaner
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Building
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Payment Date
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : washedCars.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No washed cars found for the selected date range
                  </td>
                </tr>
              ) : (
                washedCars.map((car, index) => {
                  const customer = customersMap.get(car.customer);
                  const building = buildingsMap.get(car.building);

                  return (
                    <tr
                      key={car._id || index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {index + 1}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-800">
                        <div>
                          {customer ? (
                            <>
                              <div className="font-medium">
                                {customer.firstName} {customer.lastName}
                              </div>
                              {customer.mobile && (
                                <div className="text-xs text-gray-500">
                                  {customer.mobile}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {car.vehicle?.parking_no || "-"}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {car.vehicle?.registration_no || "-"}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {worker.name || "-"}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {building?.name || "-"}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {formatDate(
                          car.completedDate || car.assignedDate || car.createdAt
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        <span className="font-medium text-green-600">
                          AED {car.vehicle?.amount || car.amount || "0"}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            car.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {car.status?.toUpperCase() || "UNKNOWN"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkerWashedCars;
