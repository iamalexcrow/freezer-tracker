import { useState, useEffect } from "react";
import { api } from "../api";
import type { RawFoodItem, PreparedMealItem, BreastMilkItem } from "../types";
import { formatDate, getSubCategoryIcon } from "../utils";

interface HistoryPageProps {
  onClose: () => void;
  onUpdated: () => void;
}

type HistoryCategory = "all" | "raw" | "prepared" | "milk";

interface ConsumedItem {
  type: "raw" | "prepared" | "milk";
  data: RawFoodItem | PreparedMealItem | BreastMilkItem;
}

export function HistoryPage({ onClose, onUpdated }: HistoryPageProps) {
  const [rawFood, setRawFood] = useState<RawFoodItem[]>([]);
  const [preparedMeals, setPreparedMeals] = useState<PreparedMealItem[]>([]);
  const [breastMilk, setBreastMilk] = useState<BreastMilkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<HistoryCategory>("all");
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [raw, prepared, milk] = await Promise.all([
        api.getRawFoodConsumed(),
        api.getPreparedMealsConsumed(),
        api.getBreastMilkConsumed(),
      ]);
      setRawFood(raw);
      setPreparedMeals(prepared);
      setBreastMilk(milk);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePutBack = async (item: ConsumedItem) => {
    try {
      if (item.type === "raw") {
        await api.putBackRawFood(item.data.id);
      } else if (item.type === "prepared") {
        await api.putBackPreparedMeal(item.data.id);
      } else {
        await api.putBackBreastMilk(item.data.id);
      }
      fetchData();
      onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to put back item");
    }
  };

  const allItems: ConsumedItem[] = [
    ...rawFood.map((data) => ({ type: "raw" as const, data })),
    ...preparedMeals.map((data) => ({ type: "prepared" as const, data })),
    ...breastMilk.map((data) => ({ type: "milk" as const, data })),
  ].sort((a, b) => {
    const dateA = new Date(a.data.date_removed || "").getTime();
    const dateB = new Date(b.data.date_removed || "").getTime();
    return dateB - dateA;
  });

  const filteredItems = category === "all" 
    ? allItems 
    : allItems.filter((item) => item.type === category);

  const getCategoryTabs = () => [
    { value: "all" as const, label: "All", count: allItems.length },
    { value: "raw" as const, label: "Raw", count: rawFood.length },
    { value: "prepared" as const, label: "Prepared", count: preparedMeals.length },
    { value: "milk" as const, label: "Milk", count: breastMilk.length },
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-sky-50 to-blue-100 z-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">History</h1>
            <p className="text-gray-500 text-sm">Items taken out of the freezer</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-xl transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
            <button onClick={() => setError(null)} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 mb-6">
          {getCategoryTabs().map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                category === tab.value
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                category === tab.value ? "bg-white/20" : "bg-gray-100"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500 text-lg">No history yet</p>
            <p className="text-gray-400 text-sm">Items you take out will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <HistoryCard
                key={`${item.type}-${item.data.id}`}
                item={item}
                onPutBack={() => handlePutBack(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface HistoryCardProps {
  item: ConsumedItem;
  onPutBack: () => void;
}

function HistoryCard({ item, onPutBack }: HistoryCardProps) {
  const getIcon = () => {
    if (item.type === "raw") {
      return getSubCategoryIcon((item.data as RawFoodItem).sub_category);
    }
    if (item.type === "prepared") return "🍱";
    return "🍼";
  };

  const getName = () => {
    if (item.type === "milk") return "Breast Milk";
    return (item.data as RawFoodItem | PreparedMealItem).name;
  };

  const getDetails = () => {
    if (item.type === "raw") {
      const raw = item.data as RawFoodItem;
      return `${raw.amount} ${raw.measuring_unit} · ${raw.sub_category}`;
    }
    if (item.type === "prepared") {
      const prepared = item.data as PreparedMealItem;
      return `${prepared.portions} portion${prepared.portions > 1 ? "s" : ""}`;
    }
    const milk = item.data as BreastMilkItem;
    return `${milk.volume_ml} ml`;
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case "raw": return "Raw Food";
      case "prepared": return "Prepared Meal";
      case "milk": return "Breast Milk";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      {/* Mobile layout */}
      <div className="sm:hidden">
        <div className="flex items-start gap-3 mb-3">
          <div className="text-2xl flex-shrink-0">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{getName()}</h3>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {getTypeLabel()}
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-0.5">{getDetails()}</div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs text-gray-400 mb-3">
          <span>Added: {formatDate(item.data.date_added)}</span>
          {item.data.date_removed && (
            <span>Removed: {formatDate(item.data.date_removed)}</span>
          )}
        </div>
        <button
          onClick={onPutBack}
          className="w-full py-2.5 bg-emerald-100 text-emerald-700 rounded-xl font-medium text-sm hover:bg-emerald-200 transition-colors"
        >
          Put Back
        </button>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:flex items-center gap-4">
        <div className="text-3xl flex-shrink-0">{getIcon()}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{getName()}</h3>
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {getTypeLabel()}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-0.5">{getDetails()}</div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span>Added: {formatDate(item.data.date_added)}</span>
            {item.data.date_removed && (
              <span>Removed: {formatDate(item.data.date_removed)}</span>
            )}
          </div>
        </div>

        <button
          onClick={onPutBack}
          className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-medium text-sm hover:bg-emerald-200 transition-colors whitespace-nowrap"
        >
          Put Back
        </button>
      </div>
    </div>
  );
}
