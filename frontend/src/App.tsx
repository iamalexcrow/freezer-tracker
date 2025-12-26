import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "./api";
import type {
  Category,
  ViewMode,
  SortOrder,
  FreshnessFilter,
  FreezerItem,
  RawFoodItem,
  PreparedMealItem,
  BreastMilkItem,
  Stats,
  FreshnessSetting,
  FreshnessStatus,
} from "./types";
import { getFreshnessStatus, getItemDateAdded, getItemId } from "./utils";

import { StatsBar } from "./components/StatsBar";
import { CategoryTabs } from "./components/CategoryTabs";
import { Toolbar } from "./components/Toolbar";
import { RedZoneAlert } from "./components/RedZoneAlert";
import { ItemCard } from "./components/ItemCard";
import { ListView } from "./components/ListView";
import { AddItemModal } from "./components/AddItemModal";
import { EditItemModal } from "./components/EditItemModal";
import { TakeOutModal } from "./components/TakeOutModal";
import { StatsPage } from "./pages/StatsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { HistoryPage } from "./pages/HistoryPage";

type Page = "main" | "stats" | "settings" | "history";

export default function App() {
  // Data state
  const [rawFood, setRawFood] = useState<RawFoodItem[]>([]);
  const [preparedMeals, setPreparedMeals] = useState<PreparedMealItem[]>([]);
  const [breastMilk, setBreastMilk] = useState<BreastMilkItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [freshnessSettings, setFreshnessSettings] = useState<FreshnessSetting[]>([]);
  const [redZoneDismissed, setRedZoneDismissed] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>("all");
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    (localStorage.getItem("freezer-view-mode") as ViewMode) || "rows"
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [freshnessFilter, setFreshnessFilter] = useState<FreshnessFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState<Page>("main");

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [takeOutItem, setTakeOutItem] = useState<RawFoodItem | null>(null);
  const [editItem, setEditItem] = useState<FreezerItem | null>(null);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem("freezer-view-mode", viewMode);
  }, [viewMode]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [raw, prepared, milk, statsData, settings, dismissed] = await Promise.all([
        api.getRawFood(),
        api.getPreparedMeals(),
        api.getBreastMilk(),
        api.getStats(),
        api.getFreshnessSettings(),
        api.isRedZoneDismissed(),
      ]);
      setRawFood(raw);
      setPreparedMeals(prepared);
      setBreastMilk(milk);
      setStats(statsData);
      setFreshnessSettings(settings);
      setRedZoneDismissed(dismissed.dismissed);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get freshness setting for an item
  const getFreshnessSetting = useCallback(
    (item: FreezerItem): FreshnessSetting => {
      if (item.type === "raw") {
        const setting = freshnessSettings.find(
          (s) => s.category === "raw_food" && s.sub_category === item.data.sub_category
        );
        return setting || freshnessSettings.find((s) => s.category === "raw_food" && s.sub_category === "Other")!;
      }
      if (item.type === "prepared") {
        return freshnessSettings.find((s) => s.category === "prepared_meals")!;
      }
      return freshnessSettings.find((s) => s.category === "breast_milk")!;
    },
    [freshnessSettings]
  );

  // Get freshness status for an item
  const getItemFreshness = useCallback(
    (item: FreezerItem): FreshnessStatus => {
      const setting = getFreshnessSetting(item);
      if (!setting) return "good";
      return getFreshnessStatus(item.data.date_added, setting);
    },
    [getFreshnessSetting]
  );

  // Convert all items to unified format
  const allItems = useMemo((): FreezerItem[] => {
    const items: FreezerItem[] = [
      ...rawFood.map((data) => ({ type: "raw" as const, data })),
      ...preparedMeals.map((data) => ({ type: "prepared" as const, data })),
      ...breastMilk.map((data) => ({ type: "milk" as const, data })),
    ];
    return items;
  }, [rawFood, preparedMeals, breastMilk]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items = allItems;

    // Category filter
    if (category !== "all") {
      items = items.filter((item) => {
        if (category === "raw") return item.type === "raw";
        if (category === "prepared") return item.type === "prepared";
        if (category === "milk") return item.type === "milk";
        return true;
      });
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter((item) => {
        if (item.type === "milk") {
          return item.data.comment?.toLowerCase().includes(searchLower);
        }
        return (
          (item.data as any).name?.toLowerCase().includes(searchLower) ||
          item.data.comment?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Freshness filter
    if (freshnessFilter !== "all") {
      items = items.filter((item) => getItemFreshness(item) === freshnessFilter);
    }

    // Sort
    items = [...items].sort((a, b) => {
      const dateA = new Date(getItemDateAdded(a)).getTime();
      const dateB = new Date(getItemDateAdded(b)).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return items;
  }, [allItems, category, search, freshnessFilter, sortOrder, getItemFreshness]);

  // Get red zone items (not dismissed)
  const redZoneItems = useMemo(() => {
    if (redZoneDismissed) return [];
    return allItems.filter((item) => getItemFreshness(item) === "red");
  }, [allItems, redZoneDismissed, getItemFreshness]);

  // Non-red items for main list
  const mainItems = useMemo(() => {
    return filteredItems.filter((item) => getItemFreshness(item) !== "red" || redZoneDismissed);
  }, [filteredItems, redZoneDismissed, getItemFreshness]);

  // Group items by category for "all" view
  const groupedItems = useMemo(() => {
    if (category !== "all") return null;

    const raw = mainItems.filter((i) => i.type === "raw");
    const prepared = mainItems.filter((i) => i.type === "prepared");
    const milk = mainItems.filter((i) => i.type === "milk");

    return { raw, prepared, milk };
  }, [category, mainItems]);

  // Handlers
  const handleTakeOut = async (item: FreezerItem) => {
    if (item.type === "raw") {
      setTakeOutItem(item.data);
    } else if (item.type === "prepared") {
      try {
        await api.takeOutPreparedMeal(item.data.id);
        fetchData();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to take out item");
      }
    } else {
      try {
        await api.takeOutBreastMilk(item.data.id);
        fetchData();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to take out item");
      }
    }
  };

  const handleConfirmTakeOut = async (amount: number) => {
    if (!takeOutItem) return;
    try {
      await api.takeOutRawFood(takeOutItem.id, amount);
      setTakeOutItem(null);
      fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to take out item");
    }
  };

  const handleDelete = async (item: FreezerItem) => {
    if (!confirm("Delete this item permanently?")) return;
    try {
      if (item.type === "raw") {
        await api.deleteRawFood(item.data.id);
      } else if (item.type === "prepared") {
        await api.deletePreparedMeal(item.data.id);
      } else {
        await api.deleteBreastMilk(item.data.id);
      }
      fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete item");
    }
  };

  const handleDismissRedZone = async () => {
    try {
      await api.dismissRedZone();
      setRedZoneDismissed(true);
    } catch (e) {
      console.error("Failed to dismiss red zone", e);
    }
  };

  // Render
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
          <span className="text-sky-700 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (page === "stats" && stats) {
    return <StatsPage stats={stats} onClose={() => setPage("main")} />;
  }

  if (page === "settings") {
    return (
      <SettingsPage
        settings={freshnessSettings}
        onClose={() => setPage("main")}
        onUpdated={fetchData}
      />
    );
  }

  if (page === "history") {
    return (
      <HistoryPage
        onClose={() => setPage("main")}
        onUpdated={fetchData}
      />
    );
  }

  const renderItems = (items: FreezerItem[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">No items found</div>
      );
    }

    if (viewMode === "list") {
      return (
        <ListView
          items={items}
          getItemFreshness={getItemFreshness}
          onTakeOut={handleTakeOut}
          onEdit={setEditItem}
          onDelete={handleDelete}
        />
      );
    }

    return (
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            : "flex flex-col gap-3"
        }
      >
        {items.map((item) => (
          <ItemCard
            key={getItemId(item)}
            item={item}
            viewMode={viewMode}
            freshnessStatus={getItemFreshness(item)}
            onTakeOut={() => handleTakeOut(item)}
            onEdit={() => setEditItem(item)}
            onDelete={() => handleDelete(item)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl sm:text-2xl backdrop-blur-sm">
                ❄️
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">Freezer Tracker</h1>
                <p className="text-sky-200 text-xs sm:text-sm hidden sm:block">Keep track of what's frozen</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => window.open("/api/export", "_blank")}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                title="Export to Excel"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button
                onClick={() => setPage("history")}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                title="History"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={() => setPage("settings")}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                title="Settings"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-white text-sky-600 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl font-semibold hover:bg-sky-50 transition-all shadow-md hover:shadow-lg active:scale-95 text-sm sm:text-base"
              >
                <span className="sm:hidden">+ Add</span>
                <span className="hidden sm:inline">+ Add New</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold">
              ×
            </button>
          </div>
        )}

        {stats && (
          <StatsBar
            stats={stats}
            currentCategory={category}
            onNavigateToStats={() => setPage("stats")}
          />
        )}

        <CategoryTabs selected={category} onChange={setCategory} />

        <Toolbar
          search={search}
          onSearchChange={setSearch}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          freshnessFilter={freshnessFilter}
          onFreshnessFilterChange={setFreshnessFilter}
        />

        {/* Red Zone Alert */}
        {!redZoneDismissed && redZoneItems.length > 0 && (
          <RedZoneAlert
            items={redZoneItems}
            onDismiss={handleDismissRedZone}
            onTakeOut={handleTakeOut}
          />
        )}

        {/* Items */}
        {groupedItems ? (
          <div className="space-y-8">
            {groupedItems.raw.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  🥩 Raw Food
                </h2>
                {renderItems(groupedItems.raw)}
              </div>
            )}
            {groupedItems.prepared.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  🍱 Prepared Meals
                </h2>
                {renderItems(groupedItems.prepared)}
              </div>
            )}
            {groupedItems.milk.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  🍼 Breast Milk
                </h2>
                {renderItems(groupedItems.milk)}
              </div>
            )}
            {groupedItems.raw.length === 0 &&
              groupedItems.prepared.length === 0 &&
              groupedItems.milk.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🧊</div>
                  <p className="text-gray-500 text-lg">
                    {allItems.length === 0
                      ? "Your freezer is empty. Add something!"
                      : "No items match your filters."}
                  </p>
                </div>
              )}
          </div>
        ) : (
          <>
            {mainItems.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🧊</div>
                <p className="text-gray-500 text-lg">
                  {allItems.length === 0
                    ? "Your freezer is empty. Add something!"
                    : "No items match your filters."}
                </p>
              </div>
            ) : (
              renderItems(mainItems)
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {showAddModal && (
        <AddItemModal
          defaultCategory={category}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            fetchData();
          }}
        />
      )}

      {editItem && (
        <EditItemModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => {
            setEditItem(null);
            fetchData();
          }}
        />
      )}

      {takeOutItem && (
        <TakeOutModal
          item={takeOutItem}
          onConfirm={handleConfirmTakeOut}
          onClose={() => setTakeOutItem(null)}
        />
      )}
    </div>
  );
}
