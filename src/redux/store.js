import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import customerReducer from "./slices/customerSlice";
import analyticsReducer from "./slices/analyticsSlice";
import attendanceReducer from "./slices/attendanceSlice";
import bookingReducer from "./slices/bookingSlice";
import buildingReducer from "./slices/buildingSlice";
import configurationReducer from "./slices/configurationSlice";
import enquiryReducer from "./slices/enquirySlice";
import importLogsReducer from "./slices/importLogsSlice";
import jobReducer from "./slices/jobSlice";
import locationReducer from "./slices/locationSlice";
import mallReducer from "./slices/mallSlice";
import oneWashReducer from "./slices/oneWashSlice";
import paymentReducer from "./slices/paymentSlice";
import pricingReducer from "./slices/pricingSlice";
import siteReducer from "./slices/siteSlice";
import staffReducer from "./slices/staffSlice";
import supervisorReducer from "./slices/supervisorSlice";
import workerReducer from "./slices/workerSlice";
import workRecordsReducer from "./slices/workRecordsSlice";
import settlementReducer from "./slices/settlementSlice";
import collectionSheetReducer from "./slices/collectionSheetSlice";
import residencePaymentReducer from "./slices/residencePaymentSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    customer: customerReducer,
    analytics: analyticsReducer,
    attendance: attendanceReducer,
    booking: bookingReducer,
    building: buildingReducer,
    configuration: configurationReducer,
    enquiry: enquiryReducer,
    importLogs: importLogsReducer,
    job: jobReducer,
    location: locationReducer,
    mall: mallReducer,
    oneWash: oneWashReducer,
    payment: paymentReducer,
    pricing: pricingReducer,
    site: siteReducer,
    staff: staffReducer,
    supervisor: supervisorReducer,
    worker: workerReducer,
    workRecords: workRecordsReducer,
    settlement: settlementReducer,
    collectionSheet: collectionSheetReducer,
    residencePayment: residencePaymentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
