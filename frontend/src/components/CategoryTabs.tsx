import type { Category } from "../types";

interface CategoryTabsProps {
  selected: Category;
  onChange: (category: Category) => void;
}

const TABS: { value: Category; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "📋" },
  { value: "raw", label: "Raw", icon: "🥩" },
  { value: "prepared", label: "Prepared", icon: "🍱" },
  { value: "milk", label: "Milk", icon: "🍼" },
];

export function CategoryTabs({ selected, onChange }: CategoryTabsProps) {
  return (
    <div className="flex bg-white rounded-2xl p-1 sm:p-1.5 shadow-sm border border-gray-100 mb-4">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            selected === tab.value
              ? "bg-sky-500 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <span>{tab.icon}</span>
          <span className="hidden xs:inline sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
