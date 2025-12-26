import type { Stats } from "../types";

interface StatsPageProps {
  stats: Stats;
  onClose: () => void;
}

export function StatsPage({ stats, onClose }: StatsPageProps) {
  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-sky-50 to-blue-100 z-50 overflow-y-auto"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Sticky header */}
      <div className="sticky top-0 bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onClose()}
            className="flex items-center gap-2 text-white font-medium p-2 -ml-2 hover:bg-white/20 rounded-xl transition-colors active:bg-white/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-lg font-semibold">Statistics</h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Raw Food Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl sm:text-3xl">🥩</span>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Raw Food</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-sky-50 rounded-xl p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-sky-600 mb-1">In Freezer (kg)</div>
              <div className="text-2xl sm:text-3xl font-bold text-sky-700">{stats.rawFood.inFreezerKg}</div>
            </div>
            <div className="bg-sky-50 rounded-xl p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-sky-600 mb-1">In Freezer (pcs)</div>
              <div className="text-2xl sm:text-3xl font-bold text-sky-700">{stats.rawFood.inFreezerPieces}</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-emerald-600 mb-1">Consumed (kg)</div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700">{stats.rawFood.consumedKg}</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-emerald-600 mb-1">Consumed (pcs)</div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700">{stats.rawFood.consumedPieces}</div>
            </div>
          </div>
        </div>

        {/* Prepared Meals Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl sm:text-3xl">🍱</span>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Prepared Meals</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-sky-50 rounded-xl p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-sky-600 mb-1">Bags</div>
              <div className="text-2xl sm:text-3xl font-bold text-sky-700">{stats.preparedMeals.bagsInFreezer}</div>
            </div>
            <div className="bg-sky-50 rounded-xl p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-sky-600 mb-1">Portions</div>
              <div className="text-2xl sm:text-3xl font-bold text-sky-700">{stats.preparedMeals.portionsInFreezer}</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-emerald-600 mb-1">Consumed</div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700">{stats.preparedMeals.portionsConsumed}</div>
            </div>
          </div>
        </div>

        {/* Breast Milk Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl sm:text-3xl">🍼</span>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Breast Milk</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-sky-50 rounded-xl p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-sky-600 mb-1">In Freezer</div>
              <div className="text-2xl sm:text-3xl font-bold text-sky-700">{stats.breastMilk.inFreezerMl} ml</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-emerald-600 mb-1">Consumed</div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700">{stats.breastMilk.consumedMl} ml</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
