import axiosInstance from "./axiosInstance";

const API_BASE = "/salary";

export const salarySettingsService = {
  async getSettings() {
    const response = await axiosInstance.get(`${API_BASE}/settings`);
    return response.data;
  },

  async saveSettings(config) {
    const response = await axiosInstance.post(`${API_BASE}/settings`, config);
    return response.data;
  },

  async resetToDefaults() {
    const response = await axiosInstance.post(`${API_BASE}/settings/reset`);
    return response.data;
  },

  // UPDATED DEFAULT STRUCTURE TO MATCH BACKEND MODEL
  getDefaultConfig() {
    return {
      carWash: {
        dayDuty: {
          applicableBuildings: ["Ubora Towers", "Marina Plaza"],
          ratePerCar: 1.4,
          incentiveThreshold: 1000,
          incentiveLow: 100,
          incentiveHigh: 200,
        },
        nightDuty: {
          ratePerCar: 1.35,
          incentiveThreshold: 1000,
          incentiveLow: 100,
          incentiveHigh: 200,
        },
      },
      etisalat: {
        monthlyBillCap: 52.5,
        companyPays: 26.25,
        employeeBaseDeduction: 26.25,
      },
      mall: {
        oneWashRate: 3.0,
        monthlyRate: 1.35,
        fixedAllowance: 200,
        absentDeduction: 25,
        sundayAbsentDeduction: 50,
        sickLeavePay: 13.33,
      },
      camp: {
        helper: { baseSalary: 1000, overtimeRate: 4.0 },
        mason: { baseSalary: 1200, overtimeRate: 4.5 },
        settings: {
          standardDays: 30,
          normalHours: 8,
          actualHours: 10,
          noDutyPay: 18.33,
          holidayPay: 18.33,
          sickLeavePay: 13.33,
          monthlyIncentive: 100,
        },
      },
      outside: {
        helper: 5.0,
        carpenter: 5.5,
        steelFixer: 5.5,
        painter: 5.5,
        mason: 6.0,
        scaffolder: 6.0,
        electrician: 6.0,
        plumber: 6.0,
      },
      slipTemplate: "template1",
    };
  },
};
