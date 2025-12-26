import type { ViewMode, SortOrder, FreshnessFilter } from "../types";

interface ToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  freshnessFilter: FreshnessFilter;
  onFreshnessFilterChange: (filter: FreshnessFilter) => void;
}

export function Toolbar({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortOrder,
  onSortOrderChange,
  freshnessFilter,
  onFreshnessFilterChange,
}: ToolbarProps) {
  return (
    <div className="space-y-3 mb-4">
      {/* Search bar */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent shadow-sm"
        />
      </div>

      {/* Filters row - scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap">
        {/* Freshness filter */}
        <select
          value={freshnessFilter}
          onChange={(e) => onFreshnessFilterChange(e.target.value as FreshnessFilter)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm flex-shrink-0"
        >
          <option value="all">All freshness</option>
          <option value="fresh">🟢 Fresh</option>
          <option value="good">🟡 Good</option>
          <option value="use_soon">🟠 Use Soon</option>
          <option value="red">🔴 Use Now!</option>
        </select>

        {/* Sort toggle */}
        <button
          onClick={() => onSortOrderChange(sortOrder === "newest" ? "oldest" : "newest")}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm hover:bg-gray-50 shadow-sm transition-colors flex-shrink-0 whitespace-nowrap"
        >
          {sortOrder === "newest" ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              <span>Newest</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
              <span>Oldest</span>
            </>
          )}
        </button>

        {/* View toggle */}
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm flex-shrink-0 sm:ml-auto">
          <button
            onClick={() => onViewModeChange("rows")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "rows"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="Rows view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange("grid")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "grid"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="Grid view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "list"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="Aggregated list view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
