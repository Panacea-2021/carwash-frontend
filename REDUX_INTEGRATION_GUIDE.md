# Redux Integration Guide

## ✅ Redux Setup Complete!

Your Redux store has been successfully integrated with:

- ✅ Redux Toolkit installed
- ✅ Store configured with all slices
- ✅ Provider wrapped around the app
- ✅ Enhanced console logging for all API calls
- ✅ Custom hooks for easy Redux usage

## 📊 Console Logging

All API calls will now be logged to the console with detailed information:

- 🚀 **Request logs** - Shows method, URL, params, and data
- ✅ **Success logs** - Shows response status, data, and duration
- ❌ **Error logs** - Shows error status, message, and error data
- 📄 **Page context** - Shows which page made the request

When you open any page, you'll see grouped console logs for all API calls made by that page.

## 🎯 How to Use Redux in Your Pages

### Option 1: Using Custom Hooks (Recommended)

```javascript
import { useCustomers } from "../redux/hooks";
import { fetchCustomers } from "../redux/slices/customerSlice";

const MyComponent = () => {
  const { customers, loading, error, dispatch } = useCustomers();

  useEffect(() => {
    // This will trigger the API call and log it to console
    dispatch(fetchCustomers({ page: 1, limit: 10, search: "", status: 1 }));
  }, [dispatch]);

  return (
    <div>
      {loading && <p>Loading...</p>}
      {customers.map((customer) => (
        <div key={customer._id}>{customer.name}</div>
      ))}
    </div>
  );
};
```

### Option 2: Direct useDispatch and useSelector

```javascript
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomers } from "../redux/slices/customerSlice";

const MyComponent = () => {
  const dispatch = useDispatch();
  const { customers, loading } = useSelector((state) => state.customer);

  useEffect(() => {
    dispatch(fetchCustomers({ page: 1, limit: 10 }));
  }, [dispatch]);

  // ... rest of component
};
```

## 📝 Available Redux Actions

### Customer Actions

- `fetchCustomers({ page, limit, search, status })`
- `createCustomer(data)`
- `updateCustomer({ id, data })`
- `deleteCustomer(id)`
- `toggleVehicle({ vehicleId, currentStatus, reason })`
- `archiveCustomer(id)`
- `fetchCustomerHistory({ id, page, limit, startDate, endDate })`
- `exportCustomerHistory({ id, startDate, endDate })`
- `exportCustomers()`
- `importCustomers(formData)`

### Analytics Actions

- `fetchAdminStats()`
- `fetchCharts()`

### Attendance Actions

- `fetchOrgList()`
- `fetchAttendanceList(params)`
- `updateAttendance(payload)`
- `exportAttendance(params)`

### Booking Actions

- `fetchBookings({ page, limit, search })`
- `assignWorker({ id, payload })`
- `acceptBooking(id)`
- `deleteBooking(id)`

### Building Actions

- `fetchBuildings({ page, limit, search })`
- `createBuilding(data)`
- `updateBuilding({ id, data })`
- `deleteBuilding(id)`

## 🔧 Integration Steps for Each Page

### Step 1: Import Required Items

```javascript
// Import the custom hook
import { useCustomers } from "../redux/hooks";

// Import the action you need
import { fetchCustomers, createCustomer } from "../redux/slices/customerSlice";
```

### Step 2: Use the Hook in Your Component

```javascript
const MyPage = () => {
  // Get Redux state and dispatch
  const { customers, loading, error, dispatch } = useCustomers();

  // Your existing local state
  const [localState, setLocalState] = useState();

  // ... rest of component
};
```

### Step 3: Dispatch Actions

```javascript
// On component mount or when needed
useEffect(() => {
  // This will log to console automatically
  dispatch(fetchCustomers({ page: 1, limit: 50, search: "", status: 1 }));
}, [dispatch]);

// Or in a function
const handleCreate = async (data) => {
  try {
    // This will log to console automatically
    await dispatch(createCustomer(data)).unwrap();
    toast.success("Created successfully!");
  } catch (error) {
    toast.error("Failed to create");
  }
};
```

## 🎨 Example: Dashboard Page with Redux

```javascript
import React, { useEffect } from "react";
import { useAnalytics } from "../redux/hooks";
import { fetchAdminStats, fetchCharts } from "../redux/slices/analyticsSlice";

const Dashboard = () => {
  const { stats, charts, loading, dispatch } = useAnalytics();

  useEffect(() => {
    console.log("🏠 [Dashboard Page] Mounted - Fetching data...");

    // Both calls will be logged to console
    dispatch(fetchAdminStats());
    dispatch(fetchCharts());
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Use stats and charts from Redux */}
      <div>Total Jobs: {stats?.counts?.jobs?.total}</div>
    </div>
  );
};
```

## 🎨 Example: Customers Page with Redux

```javascript
import React, { useEffect } from "react";
import { useCustomers } from "../redux/hooks";
import { fetchCustomers, createCustomer } from "../redux/slices/customerSlice";
import toast from "react-hot-toast";

const Customers = () => {
  const { customers, loading, pagination, dispatch } = useCustomers();

  useEffect(() => {
    console.log("👥 [Customers Page] Mounted - Fetching customers...");

    // This will log to console automatically
    dispatch(
      fetchCustomers({
        page: 1,
        limit: 50,
        search: "",
        status: 1,
      })
    );
  }, [dispatch]);

  const handleCreate = async (data) => {
    try {
      // This will log to console automatically
      await dispatch(createCustomer(data)).unwrap();
      toast.success("Customer created!");

      // Refresh list
      dispatch(fetchCustomers({ page: 1, limit: 50, search: "", status: 1 }));
    } catch (error) {
      toast.error("Failed to create customer");
    }
  };

  return (
    <div>
      <h1>Customers</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {customers.map((customer) => (
            <div key={customer._id}>{customer.name}</div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## 🔍 Console Log Examples

When you open a page, you'll see logs like this:

```
🚀 [API Request] 10:30:45 AM
  📄 Page: /customers
  🔗 Method: GET
  🌐 URL: http://localhost:3001/api/customers
  📝 Params: { pageNo: 0, pageSize: 50, search: "", status: 1 }

✅ [API Response] 10:30:45 AM
  🔗 Method: GET
  🌐 URL: /customers
  📊 Status: 200 OK
  ⏱️ Duration: 245ms
  📦 Response Data: { statusCode: 200, data: [...], total: 150 }
```

## 🎯 Best Practices

1. **Keep existing API service calls** - Redux works alongside your current implementation
2. **Use Redux for shared state** - Data that multiple components need
3. **Use local state for UI-only data** - Modal open/close, form inputs
4. **Check console logs** - Verify all API calls are being tracked
5. **Handle errors gracefully** - Use try/catch with toast notifications

## 📚 Available Hooks

All hooks follow the same pattern:

- `useAuth()` - Authentication state
- `useCustomers()` - Customer data
- `useAnalytics()` - Dashboard analytics
- `useAttendance()` - Attendance records
- `useBookings()` - Booking data
- `useBuildings()` - Building data
- `useConfiguration()` - App configuration
- `useEnquiries()` - Enquiry data
- `useImportLogs()` - Import logs
- `useJobs()` - Job data
- `useLocations()` - Location data
- `useMalls()` - Mall data
- `useOneWash()` - OneWash data
- `usePayments()` - Payment data
- `usePricing()` - Pricing data
- `useSites()` - Site data
- `useStaff()` - Staff data
- `useSupervisors()` - Supervisor data
- `useWorkers()` - Worker data
- `useWorkRecords()` - Work records

## 🚀 Quick Start

1. Open any page in your browser
2. Open DevTools Console (F12)
3. Navigate between pages
4. Watch the console logs show all API calls for each page!

The integration is complete and ready to use! Your existing code will continue to work, and you can gradually adopt Redux where needed.
