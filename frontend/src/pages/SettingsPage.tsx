import { useState } from "react";
import { api } from "../api";
import type { FreshnessSetting } from "../types";

interface SettingsPageProps {
  settings: FreshnessSetting[];
  onClose: () => void;
  onUpdated: () => void;
}

export function SettingsPage({ settings, onClose, onUpdated }: SettingsPageProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState<number | null>(null);

  const handleUpdate = async (setting: FreshnessSetting) => {
    setSaving(setting.id);
    try {
      await api.updateFreshnessSetting(setting.id, {
        fresh_days: setting.fresh_days,
        good_days: setting.good_days,
        use_soon_days: setting.use_soon_days,
      });
      onUpdated();
    } catch (e) {
      console.error("Failed to update setting", e);
    } finally {
      setSaving(null);
    }
  };

  const updateLocal = (id: number, field: keyof FreshnessSetting, value: number) => {
    setLocalSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const getCategoryLabel = (setting: FreshnessSetting) => {
    if (setting.category === "raw_food") {
      return `Raw Food - ${setting.sub_category}`;
    }
    if (setting.category === "prepared_meals") {
      return "Prepared Meals";
    }
    return "Breast Milk";
  };

  const getCategoryIcon = (setting: FreshnessSetting) => {
    if (setting.category === "raw_food") {
      switch (setting.sub_category) {
        case "Poultry": return "🍗";
        case "Red Meat": return "🥩";
        case "Fish/Seafood": return "🐟";
        case "Ground Meat": return "🍖";
        case "Vegetables": return "🥦";
        case "Fruits": return "🍓";
        default: return "📦";
      }
    }
    if (setting.category === "prepared_meals") return "🍱";
    return "🍼";
  };

  // Group by category
  const rawFoodSettings = localSettings.filter((s) => s.category === "raw_food");
  const otherSettings = localSettings.filter((s) => s.category !== "raw_food");

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-sky-50 to-blue-100 z-50 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Freshness Settings</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-xl transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Configure how many days each category stays fresh. Items will change color based on these thresholds.
        </p>

        {/* Legend */}
        <div className="bg-white rounded-xl p-3 sm:p-4 mb-6 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-emerald-500"></div>
            <span>Fresh</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-amber-500"></div>
            <span>Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-orange-500"></div>
            <span>Use Soon</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-500"></div>
            <span>Use Now!</span>
          </div>
        </div>

        {/* Raw Food Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            🥩 Raw Food
          </h2>
          <div className="space-y-4">
            {rawFoodSettings.map((setting) => (
              <SettingRow
                key={setting.id}
                setting={setting}
                icon={getCategoryIcon(setting)}
                label={setting.sub_category || ""}
                saving={saving === setting.id}
                onUpdate={updateLocal}
                onSave={() => handleUpdate(localSettings.find((s) => s.id === setting.id)!)}
              />
            ))}
          </div>
        </div>

        {/* Other Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Other Categories</h2>
          <div className="space-y-4">
            {otherSettings.map((setting) => (
              <SettingRow
                key={setting.id}
                setting={setting}
                icon={getCategoryIcon(setting)}
                label={getCategoryLabel(setting)}
                saving={saving === setting.id}
                onUpdate={updateLocal}
                onSave={() => handleUpdate(localSettings.find((s) => s.id === setting.id)!)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingRowProps {
  setting: FreshnessSetting;
  icon: string;
  label: string;
  saving: boolean;
  onUpdate: (id: number, field: keyof FreshnessSetting, value: number) => void;
  onSave: () => void;
}

function SettingRow({ setting, icon, label, saving, onUpdate, onSave }: SettingRowProps) {
  return (
    <div className="border border-gray-100 rounded-xl p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg sm:text-xl">{icon}</span>
        <span className="font-medium text-gray-800 text-sm sm:text-base">{label}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div>
          <label className="block text-xs text-emerald-600 mb-1">Fresh</label>
          <input
            type="number"
            value={setting.fresh_days}
            onChange={(e) => onUpdate(setting.id, "fresh_days", parseInt(e.target.value) || 0)}
            className="w-full px-2 sm:px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs text-amber-600 mb-1">Good</label>
          <input
            type="number"
            value={setting.good_days}
            onChange={(e) => onUpdate(setting.id, "good_days", parseInt(e.target.value) || 0)}
            className="w-full px-2 sm:px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs text-orange-600 mb-1">Use Soon</label>
          <input
            type="number"
            value={setting.use_soon_days}
            onChange={(e) => onUpdate(setting.id, "use_soon_days", parseInt(e.target.value) || 0)}
            className="w-full px-2 sm:px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="mt-3 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 disabled:opacity-50 transition-colors w-full sm:w-auto"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
