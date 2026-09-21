import React, { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  DollarSign,
  Users,
  Building,
  Wrench,
  RotateCcw,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { salarySettingsService } from "../../api/salarySettingsService";

const SalarySettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(
    salarySettingsService.getDefaultConfig(),
  );

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const apiSettings = await salarySettingsService.getSettings();
      // Check localStorage for template preference
      const localTemplate = localStorage.getItem("salary_slip_template");
      // Merge with defaults to ensure all keys exist if DB is partial
      setConfig({
        ...salarySettingsService.getDefaultConfig(),
        ...apiSettings,
        // Prefer localStorage template if exists
        slipTemplate: localTemplate || apiSettings.slipTemplate || "template1",
      });
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await salarySettingsService.saveSettings(config);
      // Save template selection to localStorage for immediate effect
      localStorage.setItem("salary_slip_template", config.slipTemplate);
      toast.success("Settings saved successfully!");
      if (response.data) setConfig(response.data);
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm("Reset all settings to default values?")) {
      try {
        const response = await salarySettingsService.resetToDefaults();
        setConfig(response.data);
        toast.success("Settings reset");
      } catch (error) {
        toast.error("Failed to reset");
      }
    }
  };

  // Helper to update deep nested keys safely
  const handleChange = (path, value) => {
    const keys = path.split(".");
    setConfig((prev) => {
      const newConfig = { ...prev };
      let current = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] =
        keys[keys.length - 1] === "applicableBuildings"
          ? value.split(",").map((s) => s.trim()) // Handle array inputs
          : parseFloat(value) || 0; // Handle number inputs
      return newConfig;
    });
  };

  // Generic Input Component
  const InputField = ({ label, path, type = "number", step = "0.01" }) => {
    const keys = path.split(".");
    let value = config;
    keys.forEach((k) => (value = value ? value[k] : ""));

    // For array display
    if (Array.isArray(value)) value = value.join(", ");

    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
        <input
          type={type === "text" ? "text" : "number"}
          step={step}
          value={value}
          onChange={(e) => handleChange(path, e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
    );
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-indigo-600" /> Salary
              Configuration
            </h1>
            <p className="text-slate-500">
              Manage calculation rules for all staff types
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg flex gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex gap-2 items-center"
            >
              {saving ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}{" "}
              Save Changes
            </button>
          </div>
        </div>

        {/* Salary Slip Template Selection */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg shadow-sm border-2 border-indigo-200">
          <h2 className="text-lg font-bold text-indigo-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Salary Slip Template
          </h2>
          <p className="text-slate-600 text-sm mb-4">
            Select the design template for printing worker salary slips
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-3 bg-white p-4 rounded-lg border-2 cursor-pointer hover:border-indigo-400 transition-all">
              <input
                type="radio"
                name="slipTemplate"
                value="template1"
                checked={config.slipTemplate === "template1"}
                onChange={(e) => {
                  const value = e.target.value;
                  setConfig((prev) => ({
                    ...prev,
                    slipTemplate: value,
                  }));
                  // Immediately save to localStorage for instant effect
                  localStorage.setItem("salary_slip_template", value);
                  toast.success(
                    "Template 1 selected! (Don't forget to click Save Changes)",
                  );
                }}
                className="w-5 h-5 text-indigo-600"
              />
              <div>
                <div className="font-bold text-slate-800">Template 1</div>
                <div className="text-xs text-slate-500">
                  DL Envelope - Landscape (220mm x 110mm)
                </div>
              </div>
            </label>
            <label className="flex items-center gap-3 bg-white p-4 rounded-lg border-2 cursor-pointer hover:border-purple-400 transition-all">
              <input
                type="radio"
                name="slipTemplate"
                value="template2"
                checked={config.slipTemplate === "template2"}
                onChange={(e) => {
                  const value = e.target.value;
                  setConfig((prev) => ({
                    ...prev,
                    slipTemplate: value,
                  }));
                  // Immediately save to localStorage for instant effect
                  localStorage.setItem("salary_slip_template", value);
                  toast.success(
                    "Template 2 selected! (Don't forget to click Save Changes)",
                  );
                }}
                className="w-5 h-5 text-purple-600"
              />
              <div>
                <div className="font-bold text-slate-800">Template 2</div>
                <div className="text-xs text-slate-500">
                  DL Envelope - Alternative Design (Dark Theme)
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* 1. Car Wash (Residential) */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
            <h2 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" /> Day Duty (Ubora/Marina)
            </h2>
            <div className="space-y-4">
              <InputField
                label="Buildings (comma separated)"
                path="carWash.dayDuty.applicableBuildings"
                type="text"
              />
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Rate Per Car"
                  path="carWash.dayDuty.ratePerCar"
                />
                <InputField
                  label="Threshold (Cars)"
                  path="carWash.dayDuty.incentiveThreshold"
                  step="1"
                />
                <InputField
                  label="Low Incentive"
                  path="carWash.dayDuty.incentiveLow"
                />
                <InputField
                  label="High Incentive"
                  path="carWash.dayDuty.incentiveHigh"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-indigo-100">
            <h2 className="text-lg font-bold text-indigo-800 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" /> Night Duty (Others)
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Rate Per Car"
                  path="carWash.nightDuty.ratePerCar"
                />
                <InputField
                  label="Threshold (Cars)"
                  path="carWash.nightDuty.incentiveThreshold"
                  step="1"
                />
                <InputField
                  label="Low Incentive"
                  path="carWash.nightDuty.incentiveLow"
                />
                <InputField
                  label="High Incentive"
                  path="carWash.nightDuty.incentiveHigh"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Etisalat & Mall */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100">
            <h2 className="text-lg font-bold text-green-800 mb-4">
              Etisalat SIM Deductions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Monthly Bill Cap (AED)"
                path="etisalat.monthlyBillCap"
              />
              <InputField
                label="Company Pays (AED)"
                path="etisalat.companyPays"
              />
              <InputField
                label="Standard Deduction (AED)"
                path="etisalat.employeeBaseDeduction"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100">
            <h2 className="text-lg font-bold text-purple-800 mb-4">
              Mall Employees
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Inside Wash Rate" path="mall.insideWashRate" />
              <InputField
                label="Outside Wash Rate"
                path="mall.outsideWashRate"
              />
              <InputField
                label="In+Out (Total) Rate"
                path="mall.totalWashRate"
              />
              <InputField label="Monthly Sub Rate" path="mall.monthlyRate" />
              <InputField label="Fixed Allowance" path="mall.fixedAllowance" />
              <InputField label="Sick Pay (Daily)" path="mall.sickLeavePay" />
              <InputField
                label="Absent Deduction"
                path="mall.absentDeduction"
              />
              <InputField
                label="Sunday Absent Ded."
                path="mall.sundayAbsentDeduction"
              />
            </div>
          </div>
        </div>

        {/* 3. Construction Camp */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
          <h2 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4" /> Construction Camp
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-orange-50 p-4 rounded">
              <h3 className="font-bold mb-2">Helper</h3>
              <div className="space-y-2">
                <InputField label="Base Salary" path="camp.helper.baseSalary" />
                <InputField
                  label="OT Rate / Hr"
                  path="camp.helper.overtimeRate"
                />
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded">
              <h3 className="font-bold mb-2">Mason</h3>
              <div className="space-y-2">
                <InputField label="Base Salary" path="camp.mason.baseSalary" />
                <InputField
                  label="OT Rate / Hr"
                  path="camp.mason.overtimeRate"
                />
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded">
              <h3 className="font-bold mb-2">General Rules</h3>
              <div className="space-y-2">
                <InputField
                  label="Working Days"
                  path="camp.settings.standardDays"
                  step="1"
                />
                <InputField
                  label="Normal Hours"
                  path="camp.settings.normalHours"
                  step="1"
                />
                <InputField
                  label="Holiday Pay"
                  path="camp.settings.holidayPay"
                />
                <InputField
                  label="Monthly Incentive"
                  path="camp.settings.monthlyIncentive"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Outside Camp */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100">
          <h2 className="text-lg font-bold text-red-800 mb-4">
            Outside Camp (Hourly Rates)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InputField label="Helper" path="outside.helper" />
            <InputField label="Carpenter" path="outside.carpenter" />
            <InputField label="Steel Fixer" path="outside.steelFixer" />
            <InputField label="Painter" path="outside.painter" />
            <InputField label="Mason" path="outside.mason" />
            <InputField label="Scaffolder" path="outside.scaffolder" />
            <InputField label="Electrician" path="outside.electrician" />
            <InputField label="Plumber" path="outside.plumber" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalarySettings;
