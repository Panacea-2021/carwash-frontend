// Custom hooks for using Redux in your pages
import { useDispatch, useSelector } from "react-redux";

// Auth Hooks
export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  return { ...auth, dispatch };
};

// Customer Hooks
export const useCustomers = () => {
  const dispatch = useDispatch();
  const customer = useSelector((state) => state.customer);
  return { ...customer, dispatch };
};

// Analytics Hooks
export const useAnalytics = () => {
  const dispatch = useDispatch();
  const analytics = useSelector((state) => state.analytics);
  return { ...analytics, dispatch };
};

// Attendance Hooks
export const useAttendance = () => {
  const dispatch = useDispatch();
  const attendance = useSelector((state) => state.attendance);
  return { ...attendance, dispatch };
};

// Booking Hooks
export const useBookings = () => {
  const dispatch = useDispatch();
  const booking = useSelector((state) => state.booking);
  return { ...booking, dispatch };
};

// Building Hooks
export const useBuildings = () => {
  const dispatch = useDispatch();
  const building = useSelector((state) => state.building);
  return { ...building, dispatch };
};

// You can add more hooks for other slices as needed
export const useConfiguration = () => {
  const dispatch = useDispatch();
  const configuration = useSelector((state) => state.configuration);
  return { ...configuration, dispatch };
};

export const useEnquiries = () => {
  const dispatch = useDispatch();
  const enquiry = useSelector((state) => state.enquiry);
  return { ...enquiry, dispatch };
};

export const useImportLogs = () => {
  const dispatch = useDispatch();
  const importLogs = useSelector((state) => state.importLogs);
  return { ...importLogs, dispatch };
};

export const useJobs = () => {
  const dispatch = useDispatch();
  const job = useSelector((state) => state.job);
  return { ...job, dispatch };
};

export const useLocations = () => {
  const dispatch = useDispatch();
  const location = useSelector((state) => state.location);
  return { ...location, dispatch };
};

export const useMalls = () => {
  const dispatch = useDispatch();
  const mall = useSelector((state) => state.mall);
  return { ...mall, dispatch };
};

export const useOneWash = () => {
  const dispatch = useDispatch();
  const oneWash = useSelector((state) => state.oneWash);
  return { ...oneWash, dispatch };
};

export const usePayments = () => {
  const dispatch = useDispatch();
  const payment = useSelector((state) => state.payment);
  return { ...payment, dispatch };
};

export const usePricing = () => {
  const dispatch = useDispatch();
  const pricing = useSelector((state) => state.pricing);
  return { ...pricing, dispatch };
};

export const useSites = () => {
  const dispatch = useDispatch();
  const site = useSelector((state) => state.site);
  return { ...site, dispatch };
};

export const useStaff = () => {
  const dispatch = useDispatch();
  const staff = useSelector((state) => state.staff);
  return { ...staff, dispatch };
};

export const useSupervisors = () => {
  const dispatch = useDispatch();
  const supervisor = useSelector((state) => state.supervisor);
  return { ...supervisor, dispatch };
};

export const useWorkers = () => {
  const dispatch = useDispatch();
  const worker = useSelector((state) => state.worker);
  return { ...worker, dispatch };
};

export const useWorkRecords = () => {
  const dispatch = useDispatch();
  const workRecords = useSelector((state) => state.workRecords);
  return { ...workRecords, dispatch };
};
