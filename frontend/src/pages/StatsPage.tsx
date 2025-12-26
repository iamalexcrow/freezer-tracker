import type { Stats } from "../types";

interface StatsPageProps {
  stats: Stats;
  onClose: () => void;
}

export function StatsPage({ stats, onClose }: StatsPageProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-sky-50 to-blue-100 z-50 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-xl transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

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
