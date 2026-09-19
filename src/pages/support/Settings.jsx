import React, { useState, useEffect } from "react";
import {
  Save,
  Settings as SettingsIcon,
  Phone,
  MessageSquare,
  Loader2,
  BarChart3,
  Info,
  RotateCcw,
  Palette,
  Sun,
  Moon,
  Coins, // Changed from DollarSign to Coins for generic currency
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { configurationService } from "../../api/configurationService";
import usePagePermissions from "../../utils/usePagePermissions";

// --- DEFAULT CONFIGURATION (Original Blue/Red) ---
const DEFAULT_GRAPH_SETTINGS = {
  residenceJobs: { completed: "#2563eb", pending: "#dc2626", point: "#ffffff" },
  residencePayments: {
    completed: "#2563eb",
    pending: "#dc2626",
    point: "#ffffff",
  },
  onewashJobs: { completed: "#2563eb", pending: "#dc2626", point: "#ffffff" },
  onewashPayments: {
    completed: "#2563eb",
    pending: "#dc2626",
    point: "#ffffff",
  },
};

// --- DEFAULT THEME CONFIGURATION ---
const DEFAULT_THEME_CONFIG = {
  light: {
    primary: "#3b82f6",
    page: "#f8fafc",
    card: "#ffffff",
    border: "#e2e8f0",
    textMain: "#0f172a",
    textSub: "#475569",
    textMuted: "#94a3b8",
    // Accents
    indigo: "#6366f1",
    purple: "#a855f7",
    emerald: "#10b981",
    teal: "#14b8a6",
    amber: "#f59e0b",
    rose: "#f43f5e",
    success: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",
  },
  dark: {
    primary: "#3b82f6",
    page: "#0f172a",
    card: "#1e293b",
    border: "#334155",
    textMain: "#f3f4f6",
    textSub: "#94a3b8",
    textMuted: "#64748b",
  },
};

// --- CURRENCY OPTIONS ---
const CURRENCY_OPTIONS = [
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "$", label: "$ - US Dollar" },
  { value: "€", label: "€ - Euro" },
  { value: "£", label: "£ - British Pound" },
  { value: "₹", label: "₹ - Indian Rupee" },
  { value: "SAR", label: "SAR - Saudi Riyal" },
  { value: "QAR", label: "QAR - Qatari Riyal" },
  { value: "OMR", label: "OMR - Omani Rial" },
  { value: "KWD", label: "KWD - Kuwaiti Dinar" },
  { value: "BHD", label: "BHD - Bahraini Dinar" },
];

const Settings = () => {
  const pp = usePagePermissions("settings");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tabs for the 4 different graphs
  const [activeGraphTab, setActiveGraphTab] = useState("residenceJobs");

  const [formData, setFormData] = useState({
    contactNumber: "",
    dashboardMarqueeText: "",
    primaryColor: "#2563eb",
    currency: "AED", // Default
    graphs: DEFAULT_GRAPH_SETTINGS,
    themeConfig: DEFAULT_THEME_CONFIG,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        // 1. Fetch Server Settings
        const response = await configurationService.fetch();
        const serverData = response?.data?.data || response?.data || {};
        if (serverData) {
          setFormData((prev) => ({
            ...prev,
            contactNumber: serverData.contactNumber || "",
            dashboardMarqueeText: serverData.dashboardMarqueeText || "",
            primaryColor: serverData.primaryColor || "#2563eb",
          }));
        }

        // 2. Fetch Local Storage Graph Settings
        const savedGraphs = localStorage.getItem("admin_graph_colors");
        if (savedGraphs) {
          setFormData((prev) => ({ ...prev, graphs: JSON.parse(savedGraphs) }));
        }

        // 3. Fetch Local Storage Currency
        const savedCurrency = localStorage.getItem("app_currency");
        if (savedCurrency) {
          setFormData((prev) => ({ ...prev, currency: savedCurrency }));
        }

        // 4. Fetch Theme Config from LocalStorage
        const savedThemeConfig = localStorage.getItem("themeConfigV2");
        if (savedThemeConfig) {
          const config = JSON.parse(savedThemeConfig);
          // Merge with defaults to ensure all keys exist if new ones are added later
          const mergedConfig = {
            light: { ...DEFAULT_THEME_CONFIG.light, ...config.light },
            dark: { ...DEFAULT_THEME_CONFIG.dark, ...config.dark },
          };
          setFormData((prev) => ({ ...prev, themeConfig: mergedConfig }));
          applyThemeStyles(mergedConfig);
        } else {
          // If no V2 config, check for V1 (flat themeColors) or use defaults
          const savedOldColors = localStorage.getItem("themeColors");
          if (savedOldColors) {
            // Attempt to migrate old flat structure to new structure temporarily
            const old = JSON.parse(savedOldColors);
            const migrated = {
              ...DEFAULT_THEME_CONFIG,
              light: { ...DEFAULT_THEME_CONFIG.light, ...old },
            };
            setFormData((prev) => ({ ...prev, themeConfig: migrated }));
            applyThemeStyles(migrated);
          } else {
            applyThemeStyles(DEFAULT_THEME_CONFIG);
          }
        }
      } catch (error) {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const applyThemeStyles = (config) => {
    // We inject a style tag to handle both :root and .dark overrides robustly
    const styleId = "dynamic-theme-styles";
    let styleTag = document.getElementById(styleId);

    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    const css = `
      :root {
        /* Base / Light Mode Colors */
        --color-primary: ${config.light.primary};
        --color-page: ${config.light.page};
        --color-card: ${config.light.card};
        --color-border: ${config.light.border};
        --color-text-main: ${config.light.textMain};
        --color-text-sub: ${config.light.textSub};
        --color-text-muted: ${config.light.textMuted};

        /* Accents */
        --color-indigo: ${config.light.indigo};
        --color-purple: ${config.light.purple};
        --color-emerald: ${config.light.emerald};
        --color-teal: ${config.light.teal};
        --color-amber: ${config.light.amber};
        --color-rose: ${config.light.rose};
        --color-success: ${config.light.success};
        --color-danger: ${config.light.danger};
        --color-warning: ${config.light.warning};
        
        /* Input Defaults (Derived from light vars) */
        --color-input-bg: ${config.light.page};
        --color-input-border: ${config.light.border};
        --color-input-focus: ${config.light.primary};
      }

      .dark {
        /* Dark Mode Overrides */
        --color-primary: ${config.dark.primary};
        --color-page: ${config.dark.page};
        --color-card: ${config.dark.card};
        --color-border: ${config.dark.border};
        --color-text-main: ${config.dark.textMain};
        --color-text-sub: ${config.dark.textSub};
        --color-text-muted: ${config.dark.textMuted};
        
        --color-input-bg: ${config.dark.page};
        --color-input-border: ${config.dark.border};
      }
    `;

    styleTag.innerHTML = css;
  };

  const handleGraphColorChange = (graphKey, colorType, value) => {
    setFormData((prev) => ({
      ...prev,
      graphs: {
        ...prev.graphs,
        [graphKey]: {
          ...prev.graphs[graphKey],
          [colorType]: value,
        },
      },
    }));
  };

  const handleThemeColorChange = (mode, key, value) => {
    setFormData((prev) => {
      const newConfig = {
        ...prev.themeConfig,
        [mode]: {
          ...prev.themeConfig[mode],
          [key]: value,
        },
      };
      // Apply immediately for live preview
      applyThemeStyles(newConfig);
      return { ...prev, themeConfig: newConfig };
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset GRAPH colors to default?")) {
      setFormData((prev) => ({
        ...prev,
        graphs: DEFAULT_GRAPH_SETTINGS,
      }));
      toast.success("Graph colors reset.");
    }
  };

  const handleResetThemeColors = () => {
    if (window.confirm("Reset ALL theme colors (Light & Dark) to default?")) {
      setFormData((prev) => ({
        ...prev,
        themeConfig: DEFAULT_THEME_CONFIG,
      }));
      applyThemeStyles(DEFAULT_THEME_CONFIG);
      toast.success("Theme colors reset to default.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.contactNumber) {
      toast.error("Contact number is required");
      return;
    }

    setSaving(true);
    try {
      // Save Server Data
      await configurationService.update({
        contactNumber: formData.contactNumber,
        dashboardMarqueeText: formData.dashboardMarqueeText,
        primaryColor: formData.primaryColor,
      });

      // Save Graph Data to LocalStorage
      localStorage.setItem(
        "admin_graph_colors",
        JSON.stringify(formData.graphs),
      );

      // Save Theme Config to LocalStorage (New V2 Key)
      localStorage.setItem(
        "themeConfigV2",
        JSON.stringify(formData.themeConfig),
      );

      // ✅ Save Currency to LocalStorage
      localStorage.setItem("app_currency", formData.currency || "AED");

      // Trigger a custom event so other components can update immediately if they listen
      window.dispatchEvent(new Event("storage"));

      toast.success("All settings saved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const graphTabs = [
    { id: "residenceJobs", label: "Res. Jobs" },
    { id: "residencePayments", label: "Res. Payments" },
    { id: "onewashJobs", label: "One. Jobs" },
    { id: "onewashPayments", label: "One. Payments" },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f8f9fa]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-[#f8f9fa] font-sans pb-20">
      {/* <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage configurations and dashboard appearance
        </p>
      </div> */}

      <form onSubmit={handleSubmit} className="max-w-6xl grid gap-8">
        {/* --- 1. GENERAL SETTINGS --- */}
        {(pp.isToolbarVisible("contactNumber") ||
          pp.isToolbarVisible("currency") ||
          pp.isToolbarVisible("dashboardMarqueeText")) && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-4xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Info className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                General Information
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Contact Number Field */}
              {pp.isToolbarVisible("contactNumber") && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Support Contact Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.contactNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactNumber: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all text-slate-700"
                      placeholder="+971 50 000 0000"
                    />
                  </div>
                </div>
              )}

              {/* ✅ NEW: Currency Selector */}
              {pp.isToolbarVisible("currency") && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Global Currency Symbol
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Coins className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData({ ...formData, currency: e.target.value })
                      }
                      className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all text-slate-700 appearance-none cursor-pointer font-medium"
                    >
                      {CURRENCY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 pl-1">
                    This currency symbol will be used across all receipts and
                    tables.
                  </p>
                </div>
              )}

              {pp.isToolbarVisible("dashboardMarqueeText") && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Customer App Dashboard Scrolling Text
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <MessageSquare className="h-4 w-4 text-slate-400" />
                    </div>
                    <textarea
                      rows={3}
                      value={formData.dashboardMarqueeText}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dashboardMarqueeText: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all text-slate-700 resize-y"
                      placeholder="Example: Weekend offer live now • Book mobile wash and save 15% • Slots update every hour"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 pl-1">
                    This message appears as a rich scrolling banner on Customer
                    Dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 2. GRAPH APPEARANCE (Untouched logic) --- */}
        {pp.isToolbarVisible("graphColors") && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-4xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Analytics Graphs
                </h2>
                <p className="text-xs text-slate-500">
                  Customize colors for each chart individually
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {graphTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveGraphTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeGraphTab === tab.id
                      ? "bg-slate-800 text-white shadow-md"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300">
              {["completed", "pending", "point"].map((type) => (
                <div key={type}>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                    {type === "point" ? "Point (Dot)" : type} Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.graphs[activeGraphTab][type]}
                      onChange={(e) =>
                        handleGraphColorChange(
                          activeGraphTab,
                          type,
                          e.target.value,
                        )
                      }
                      className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      value={formData.graphs[activeGraphTab][type]}
                      onChange={(e) =>
                        handleGraphColorChange(
                          activeGraphTab,
                          type,
                          e.target.value,
                        )
                      }
                      className="w-24 px-2 py-1 text-xs border rounded bg-white font-mono uppercase"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 3. THEME COLORS (Split View) --- */}
        {pp.isToolbarVisible("theme") && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg text-indigo-600">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Theme Customization
                  </h2>
                  <p className="text-xs text-slate-500">
                    Customize both Light and Dark mode palettes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetThemeColors}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset Themes
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* === LEFT COLUMN: LIGHT MODE / GLOBAL === */}
              <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-4 text-amber-600">
                  <Sun className="w-5 h-5" />
                  <h3 className="font-bold text-slate-800">
                    Light Mode & Global
                  </h3>
                </div>

                <div className="space-y-6">
                  {/* Essential Light Vars */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Base Colors
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: "primary", label: "Primary Brand" },
                        { key: "page", label: "Page Background" },
                        { key: "card", label: "Card Background" },
                        { key: "border", label: "Borders" },
                        { key: "textMain", label: "Main Text" },
                        { key: "textSub", label: "Secondary Text" },
                      ].map(({ key, label }) => (
                        <div
                          key={key}
                          className="flex items-center gap-3 p-2 bg-white rounded border border-slate-200"
                        >
                          <input
                            type="color"
                            value={formData.themeConfig.light[key]}
                            onChange={(e) =>
                              handleThemeColorChange(
                                "light",
                                key,
                                e.target.value,
                              )
                            }
                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700">
                              {label}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {formData.themeConfig.light[key]}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Accents */}
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Accents & Status
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: "emerald", label: "Emerald" },
                        { key: "indigo", label: "Indigo" },
                        { key: "purple", label: "Purple" },
                        { key: "teal", label: "Teal" },
                        { key: "amber", label: "Amber" },
                        { key: "rose", label: "Rose" },
                        { key: "success", label: "Success (Green)" },
                        { key: "danger", label: "Danger (Red)" },
                        { key: "warning", label: "Warning (Orange)" },
                      ].map(({ key, label }) => (
                        <div
                          key={key}
                          className="flex items-center gap-3 p-2 bg-white rounded border border-slate-200"
                        >
                          <input
                            type="color"
                            value={formData.themeConfig.light[key]}
                            onChange={(e) =>
                              handleThemeColorChange(
                                "light",
                                key,
                                e.target.value,
                              )
                            }
                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700">
                              {label}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {formData.themeConfig.light[key]}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* === RIGHT COLUMN: DARK MODE OVERRIDES === */}
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 mb-4 text-blue-400">
                  <Moon className="w-5 h-5" />
                  <h3 className="font-bold text-white">Dark Mode Overrides</h3>
                </div>
                <p className="text-xs text-slate-400 mb-6">
                  These colors specifically override the base colors when Dark
                  Mode is active.
                </p>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "primary", label: "Primary Brand (Dark)" },
                      { key: "page", label: "Page Background (Dark)" },
                      { key: "card", label: "Card Background (Dark)" },
                      { key: "border", label: "Borders (Dark)" },
                      { key: "textMain", label: "Main Text (Dark)" },
                      { key: "textSub", label: "Secondary Text (Dark)" },
                    ].map(({ key, label }) => (
                      <div
                        key={key}
                        className="flex items-center gap-3 p-2 bg-slate-800 rounded border border-slate-700 hover:border-slate-600 transition-colors"
                      >
                        <input
                          type="color"
                          value={formData.themeConfig.dark[key]}
                          onChange={(e) =>
                            handleThemeColorChange("dark", key, e.target.value)
                          }
                          className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-200">
                            {label}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {formData.themeConfig.dark[key]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- ACTIONS BUTTONS --- */}
        {pp.isToolbarVisible("save") && (
          <div className="flex justify-end pt-4 gap-3 max-w-4xl">
            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={saving}
              className="bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-70"
            >
              <RotateCcw className="w-4 h-4" /> Reset Graphs
            </button>

            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Settings
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Settings;
