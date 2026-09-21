/**
 * Granular Page Permissions Configuration
 *
 * Defines ALL controllable elements (columns, row actions, toolbar items)
 * for every page in the admin panel. Used by:
 *   - StaffPermissions page (admin configures per-staff)
 *   - usePagePermissions hook (each page checks visibility)
 *
 * Structure:
 *   pageKey → { label, columns[], actions[], toolbar[] }
 *
 * If a staff member has NO pagePermissions entry for a page,
 * ALL elements are shown (backward compatible / default for admin).
 * If an entry exists, only whitelisted keys are visible.
 */

const PAGE_PERMISSIONS_CONFIG = {
  // ─────────────────────────── CUSTOMERS ───────────────────────────
  customers: {
    label: "Customers",
    icon: "Users",
    columns: [
      { key: "name", label: "Customer" },
      { key: "vehicleInfo", label: "Vehicle Info" },
      { key: "parkingNo", label: "Parking No" },
      { key: "building", label: "Building" },
      { key: "flatNo", label: "Flat No" },
      { key: "paymentStatus", label: "Payment Status" },
      { key: "customerStatus", label: "Customer Status" },
      { key: "vehicleStatus", label: "Vehicle Status" },
    ],
    actions: [
      { key: "view", label: "View Customer" },
      { key: "edit", label: "Edit Customer" },
      { key: "archive", label: "Archive Customer" },
      { key: "delete", label: "Delete Customer" },
      { key: "history", label: "View History" },
      { key: "activity", label: "View Activity" },
    ],
    toolbar: [
      { key: "search", label: "Search" },
      { key: "addCustomer", label: "Add Customer" },
      { key: "import", label: "Import" },
      { key: "export", label: "Export" },
      { key: "template", label: "Template Download" },
      { key: "importHistory", label: "Import History" },
      { key: "workerFilter", label: "Worker Filter" },
      { key: "buildingFilter", label: "Building Filter" },
      { key: "statusFilter", label: "Customer Status Filter" },
      { key: "vehicleStatusFilter", label: "Vehicle Status Filter" },
    ],
  },

  // ─────────────────────────── WORKERS ───────────────────────────
  workers: {
    label: "Workers",
    icon: "UserCheck",
    columns: [
      { key: "name", label: "Name" },
      { key: "mobile", label: "Mobile" },
      { key: "company", label: "Company" },
      { key: "assignments", label: "Assignments" },
      { key: "appUpdate", label: "App Update" },
      { key: "quickLinks", label: "Quick Links" },
      { key: "status", label: "Status" },
    ],
    actions: [
      { key: "view", label: "View Worker" },
      { key: "activity", label: "Activity Tracking" },
      { key: "attendanceSheet", label: "Download Attendance Sheet" },
      { key: "edit", label: "Edit Worker" },
      { key: "delete", label: "Delete Worker" },
    ],
    toolbar: [
      { key: "search", label: "Search" },
      { key: "addWorker", label: "Add Worker" },
      { key: "import", label: "Import" },
      { key: "export", label: "Export" },
      { key: "template", label: "Template Download" },
      {
        key: "attendanceSheet",
        label: "Attendance Sheet Download",
      },
    ],
  },

  // ─────────────────────────── STAFF ───────────────────────────
  staff: {
    label: "Staff (Workers)",
    icon: "Users",
    columns: [
      { key: "name", label: "Name" },
      { key: "mobile", label: "Mobile" },
      { key: "company", label: "Company" },
      { key: "site", label: "Site/Mall" },
      { key: "documents", label: "Document Status" },
    ],
    actions: [
      { key: "view", label: "View Staff" },
      { key: "activity", label: "Activity Tracking" },
      { key: "edit", label: "Edit Staff" },
      { key: "delete", label: "Delete Staff" },
    ],
    toolbar: [
      { key: "search", label: "Search" },
      { key: "addStaff", label: "Add Staff" },
      { key: "import", label: "Import" },
      { key: "export", label: "Export" },
    ],
  },

  // ─────────────────────────── ATTENDANCE ───────────────────────────
  attendance: {
    label: "Attendance",
    icon: "ClipboardCheck",
    columns: [
      { key: "date", label: "Date" },
      { key: "employee", label: "Employee Details" },
      { key: "sheet", label: "Attendance Sheet" },
      { key: "attendance", label: "Attendance (P/A)" },
      { key: "remark", label: "Remark/Notes" },
    ],
    actions: [
      { key: "attendanceSheet", label: "Open Attendance Sheet" },
      { key: "markPresent", label: "Mark Present" },
      { key: "markAbsent", label: "Mark Absent" },
      { key: "changeRemark", label: "Change Remark" },
    ],
    toolbar: [{ key: "export", label: "Export Excel" }],
  },

  // ─────────────────────────── SUPERVISORS ───────────────────────────
  supervisors: {
    label: "Supervisors",
    icon: "Shield",
    columns: [
      { key: "serviceType", label: "Service Type" },
      { key: "name", label: "Name" },
      { key: "phone", label: "Phone" },
    ],
    actions: [
      { key: "activity", label: "Activity Tracking" },
      { key: "edit", label: "Edit Supervisor" },
      { key: "delete", label: "Delete Supervisor" },
    ],
    toolbar: [
      { key: "search", label: "Search" },
      { key: "addSupervisor", label: "Add Supervisor" },
    ],
  },

  // ─────────────────────────── RESIDENCE WASHES ───────────────────────────
  washes_residence: {
    label: "Residence Jobs",
    icon: "Droplets",
    columns: [
      { key: "date", label: "Date" },
      { key: "completed", label: "Completed" },
      { key: "status", label: "Status" },
      { key: "customer", label: "Customer" },
      { key: "vehicleDetails", label: "Vehicle Details" },
      { key: "building", label: "Building" },
      { key: "worker", label: "Worker" },
      { key: "createdBy", label: "Created By" },
    ],
    actions: [
      { key: "edit", label: "Edit Job" },
      { key: "delete", label: "Delete Job" },
    ],
    toolbar: [
      { key: "search", label: "Search" },
      { key: "addJob", label: "Add Job" },
      { key: "runScheduler", label: "Run Scheduler" },
      { key: "dateRange", label: "Date Range Picker" },
      { key: "workerFilter", label: "Worker Filter" },
      { key: "buildingFilter", label: "Building Filter" },
      { key: "statusFilter", label: "Status Filter" },
      { key: "export", label: "Export Excel" },
    ],
  },

  // ─────────────────────────── ONE WASH ───────────────────────────
  washes_onewash: {
    label: "One Wash Jobs",
    icon: "Droplets",
    columns: [
      { key: "date", label: "Date" },
      { key: "vehicleNo", label: "Vehicle No" },
      { key: "parkingNo", label: "Parking No" },
      { key: "serviceType", label: "Service Type" },
      { key: "originalAmount", label: "Original Amount" },
      { key: "tip", label: "Tip Amount" },
      { key: "totalAmount", label: "Total Amount" },
      { key: "paymentMode", label: "Payment Mode" },
      { key: "status", label: "Status" },
      { key: "mallBuilding", label: "Mall/Building" },
      { key: "worker", label: "Worker" },
    ],
    actions: [
      { key: "edit", label: "Edit Job" },
      { key: "delete", label: "Delete Job" },
    ],
    toolbar: [
      { key: "search", label: "Search" },
      { key: "addJob", label: "Add Job" },
      { key: "dateRange", label: "Date Range Picker" },
      { key: "serviceTypeFilter", label: "Service Type Filter" },
      { key: "workerFilter", label: "Worker Filter" },
      { key: "paymentModeFilter", label: "Payment Mode Filter" },
      { key: "washTypeFilter", label: "Wash Type Filter" },
      { key: "export", label: "Export Excel" },
    ],
  },

  // ─────────────────────────── ONE WASH PAYMENTS ───────────────────────────
  payments_onewash: {
    label: "One Wash Payments",
    icon: "DollarSign",
    columns: [
      { key: "date", label: "Date" },
      { key: "vehicle", label: "Vehicle" },
      { key: "parking", label: "Parking" },
      { key: "serviceType", label: "Service Type" },
      { key: "amount", label: "Amount" },
      { key: "tip", label: "Tip" },
      { key: "total", label: "Total" },
      { key: "paymentMode", label: "Payment Mode" },
      { key: "status", label: "Status" },
      { key: "worker", label: "Worker" },
      { key: "receipt", label: "Receipt" },
    ],
    actions: [
      { key: "view", label: "View Details" },
      { key: "editAmount", label: "Edit Amount" },
      { key: "receipt", label: "View Receipt" },
    ],
    toolbar: [
      { key: "search", label: "Search" },
      { key: "dateRange", label: "Date Range Picker" },
      { key: "addNew", label: "Add New Payment" },
      { key: "statusFilter", label: "Status Filter" },
      { key: "paymentModeFilter", label: "Payment Mode Filter" },
      { key: "washTypeFilter", label: "Wash Type Filter" },
      { key: "workerFilter", label: "Worker Filter" },
      { key: "export", label: "Export" },
      { key: "editHistory", label: "Edit History" },
    ],
  },

  // ─────────────────────────── RESIDENCE PAYMENTS ───────────────────────────
  payments_residence: {
    label: "Residence Payments",
    icon: "DollarSign",
    columns: [
      { key: "receipt", label: "Rcpt#" },
      { key: "billDate", label: "Bill Date" },
      { key: "paidDate", label: "Paid Date" },
      { key: "vehicle", label: "Vehicle Info" },
      { key: "building", label: "Building" },
      { key: "subscription", label: "Subscription Amount" },
      { key: "previousDue", label: "Previous Due" },
      { key: "totalDue", label: "Total Amount Due" },
      { key: "paid", label: "Paid" },
      { key: "balance", label: "Balance" },
      { key: "mode", label: "Mode" },
      { key: "status", label: "Status" },
      { key: "settle", label: "Settle" },
      { key: "worker", label: "Worker" },
      { key: "remarks", label: "Remarks" },
      { key: "customerNotes", label: "Customer Notes" },
      { key: "invoice", label: "Invoice" },
      { key: "receiptLink", label: "Receipt" },
    ],
    actions: [
      { key: "view", label: "View Details" },
      { key: "edit", label: "Edit" },
      { key: "editAmount", label: "Edit Amount" },
      { key: "viewHistory", label: "View History" },
      { key: "delete", label: "Delete" },
    ],
    toolbar: [
      { key: "search", label: "Search" },
      { key: "dateRange", label: "Date Range Picker" },
      { key: "statusFilter", label: "Status Filter" },
      { key: "buildingFilter", label: "Building Filter" },
      { key: "paymentModeFilter", label: "Payment Mode Filter" },
      { key: "workerFilter", label: "Worker Filter" },
      { key: "bulkSettle", label: "Bulk Settle" },
      { key: "bulkMarkPaid", label: "Bulk Mark Paid" },
      { key: "monthEndClose", label: "Month End Close" },
      { key: "editHistory", label: "Edit History" },
      { key: "exportExcel", label: "Export Excel" },
      { key: "exportPdf", label: "Export PDF" },
      { key: "invoiceModal", label: "Invoice Modal" },
    ],
  },

  // ─────────────────────────── WORK RECORDS ───────────────────────────
  workRecords: {
    label: "Work Records",
    icon: "FileText",
    columns: [],
    actions: [],
    toolbar: [
      { key: "serviceTypeFilter", label: "Service Type" },
      { key: "monthFilter", label: "Month Filter" },
      { key: "yearFilter", label: "Year Filter" },
      { key: "workerFilter", label: "Worker Filter" },
      { key: "exportExcel", label: "Export Excel" },
      { key: "exportPdf", label: "Export PDF" },
      { key: "previewToggle", label: "Show/Hide Preview" },
    ],
  },

  // ─────────────────────────── COLLECTION SHEET ───────────────────────────
  collectionSheet: {
    label: "Collection Sheet",
    icon: "Receipt",
    columns: [],
    actions: [],
    toolbar: [
      { key: "serviceTypeFilter", label: "Service Type" },
      { key: "buildingFilter", label: "Building Filter" },
      { key: "workerFilter", label: "Worker Filter" },
      { key: "monthFilter", label: "Month Filter" },
      { key: "yearFilter", label: "Year Filter" },
      { key: "exportExcel", label: "Export Excel" },
      { key: "exportPdf", label: "Export PDF" },
    ],
  },

  // ─────────────────────────── SETTLEMENTS ───────────────────────────
  settlements: {
    label: "Settlements",
    icon: "Wallet",
    columns: [
      { key: "date", label: "Date" },
      { key: "supervisor", label: "Supervisor" },
      { key: "totalAmount", label: "Total Amount" },
      { key: "breakdown", label: "Breakdown" },
      { key: "status", label: "Status" },
    ],
    actions: [{ key: "approve", label: "Approve" }],
    toolbar: [{ key: "search", label: "Search" }],
  },

  // ─────────────────────────── PENDING PAYMENTS / DUE LISTS ───────────────────────────
  pendingPayments: {
    label: "Due Lists",
    icon: "BarChart2",
    columns: [
      { key: "parking", label: "Parking" },
      { key: "regNo", label: "Reg No" },
      { key: "building", label: "Building" },
      { key: "amount", label: "Amount" },
      { key: "dueDate", label: "Due Date" },
    ],
    actions: [],
    toolbar: [
      { key: "search", label: "Search" },
      { key: "filterMode", label: "Filter Mode Toggle" },
      { key: "dateRange", label: "Date Range Picker" },
      { key: "monthFilter", label: "Month Filter" },
      { key: "yearFilter", label: "Year Filter" },
      { key: "buildingFilter", label: "Building Filter" },
      { key: "workerFilter", label: "Worker Filter" },
      { key: "exportExcel", label: "Export Excel" },
      { key: "exportPdf", label: "Export PDF" },
    ],
  },

  // ─────────────────────────── PRICING ───────────────────────────
  pricing: {
    label: "Pricing",
    icon: "Tags",
    columns: [
      { key: "serviceDetails", label: "Service Details" },
      { key: "pricingStructure", label: "Pricing Structure" },
    ],
    actions: [
      { key: "edit", label: "Edit Price" },
      { key: "delete", label: "Delete Price" },
    ],
    toolbar: [{ key: "addPrice", label: "Add New Price" }],
  },

  // ─────────────────────────── LOCATIONS ───────────────────────────
  locations: {
    label: "Locations",
    icon: "MapPin",
    columns: [{ key: "locationDetails", label: "Location Details" }],
    actions: [
      { key: "edit", label: "Edit Location" },
      { key: "delete", label: "Delete Location" },
    ],
    toolbar: [
      { key: "search", label: "Search" },
      { key: "addLocation", label: "Add Location" },
    ],
  },

  // ─────────────────────────── BUILDINGS ───────────────────────────
  buildings: {
    label: "Buildings",
    icon: "Building2",
    columns: [
      { key: "name", label: "Building Name" },
      { key: "location", label: "Location" },
      { key: "amount", label: "Amount" },
      { key: "cardCharges", label: "Card Charges" },
      { key: "scheduled", label: "Scheduled" },
    ],
    actions: [
      { key: "edit", label: "Edit Building" },
      { key: "delete", label: "Delete Building" },
    ],
    toolbar: [
      { key: "search", label: "Search" },
      { key: "addBuilding", label: "Add Building" },
    ],
  },

  // ─────────────────────────── MALLS ───────────────────────────
  malls: {
    label: "Malls",
    icon: "Store",
    columns: [
      { key: "name", label: "Mall Name" },
      { key: "amount", label: "Amount" },
      { key: "cardCharges", label: "Card Charges" },
    ],
    actions: [
      { key: "edit", label: "Edit Mall" },
      { key: "delete", label: "Delete Mall" },
    ],
    toolbar: [
      { key: "search", label: "Search" },
      { key: "addMall", label: "Add Mall" },
    ],
  },

  // ─────────────────────────── SITES ───────────────────────────
  sites: {
    label: "Sites",
    icon: "MapPin",
    columns: [{ key: "name", label: "Site Name" }],
    actions: [
      { key: "edit", label: "Edit Site" },
      { key: "delete", label: "Delete Site" },
    ],
    toolbar: [
      { key: "search", label: "Search" },
      { key: "addSite", label: "Add Site" },
    ],
  },

  // ─────────────────────────── VEHICLE MANAGEMENT ───────────────────────────
  vehicles: {
    label: "Vehicle Management",
    icon: "Car",
    columns: [
      { key: "image", label: "Image" },
      { key: "modelName", label: "Model Name" },
      { key: "type", label: "Type" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status" },
    ],
    actions: [
      { key: "edit", label: "Edit" },
      { key: "delete", label: "Delete" },
    ],
    toolbar: [
      { key: "search", label: "Search Brand" },
      { key: "typeFilter", label: "Type Filter" },
      { key: "addBrand", label: "Add Brand" },
      { key: "addModel", label: "Add Model" },
    ],
  },

  // ─────────────────────────── ENQUIRY ───────────────────────────
  enquiry: {
    label: "Enquiry",
    icon: "HelpCircle",
    columns: [
      { key: "dateTime", label: "Date & Time" },
      { key: "customer", label: "Customer Mobile" },
      { key: "vehicle", label: "Vehicle Details" },
      { key: "worker", label: "Worker" },
      { key: "status", label: "Status" },
    ],
    actions: [
      { key: "edit", label: "View/Edit" },
      { key: "delete", label: "Delete" },
    ],
    toolbar: [
      { key: "search", label: "Search" },
      { key: "addEnquiry", label: "New Enquiry" },
      { key: "dateRange", label: "Date Range Picker" },
      { key: "statusFilter", label: "Status Filter" },
      { key: "workerFilter", label: "Worker Filter" },
    ],
  },

  // ─────────────────────────── BOOKINGS ───────────────────────────
  bookings: {
    label: "Bookings",
    icon: "Calendar",
    columns: [
      { key: "customer", label: "Customer" },
      { key: "date", label: "Date" },
      { key: "time", label: "Time" },
      { key: "vehicle", label: "Vehicle" },
      { key: "parking", label: "Parking No" },
      { key: "location", label: "Location" },
      { key: "worker", label: "Worker" },
      { key: "status", label: "Status" },
    ],
    actions: [
      { key: "assignWorker", label: "Assign Worker" },
      { key: "accept", label: "Accept Booking" },
      { key: "delete", label: "Delete Booking" },
    ],
    toolbar: [{ key: "search", label: "Search" }],
  },

  // ─────────────────────────── IMPORT LOGS ───────────────────────────
  importLogs: {
    label: "Import Logs",
    icon: "FileText",
    columns: [
      { key: "date", label: "Date" },
      { key: "type", label: "Type" },
      { key: "success", label: "Success" },
      { key: "errors", label: "Errors" },
      { key: "duplicates", label: "Duplicates" },
      { key: "changes", label: "Changes" },
    ],
    actions: [{ key: "view", label: "View Details" }],
    toolbar: [],
  },

  // ─────────────────────────── SETTINGS ───────────────────────────
  settings: {
    label: "Settings",
    icon: "Settings",
    columns: [],
    actions: [],
    toolbar: [
      { key: "contactNumber", label: "Contact Number" },
      { key: "dashboardMarqueeText", label: "Dashboard Marquee Text" },
      { key: "currency", label: "Currency Selection" },
      { key: "graphColors", label: "Graph Colors" },
      { key: "theme", label: "Theme Configuration" },
      { key: "save", label: "Save Button" },
    ],
  },

  // ─────────────────────────── DASHBOARD ───────────────────────────
  dashboard: {
    label: "Dashboard",
    icon: "LayoutDashboard",
    columns: [],
    actions: [],
    toolbar: [
      { key: "refresh", label: "Refresh" },
      { key: "exportData", label: "Export Data" },
      { key: "advancedCharts", label: "Advanced Charts" },
    ],
  },

  // ─────────────────────────── PAYMENT EDIT HISTORY ───────────────────────────
  paymentEditHistory: {
    label: "Payment Edit History",
    icon: "History",
    columns: [
      { key: "paymentInfo", label: "Payment Identification" },
      { key: "editInfo", label: "Edit Info" },
      { key: "oldAmount", label: "Old Total Amount" },
      { key: "newAmount", label: "New Total Amount" },
      { key: "oldBalance", label: "Old Balance" },
      { key: "newBalance", label: "New Balance" },
      { key: "reason", label: "Reason" },
    ],
    actions: [],
    toolbar: [{ key: "typeFilter", label: "Type Filter Tabs" }],
  },

  // ─────────────────────────── NOTIFICATIONS ───────────────────────────
  notifications: {
    label: "Notifications",
    icon: "Bell",
    columns: [],
    actions: [],
    toolbar: [
      { key: "filterTabs", label: "Filter Tabs" },
      { key: "markAllRead", label: "Mark All as Read" },
      { key: "sendPush", label: "Send Push Campaign" },
    ],
  },
};

export default PAGE_PERMISSIONS_CONFIG;
