import type { Stats, Category } from "../types";

interface StatsBarProps {
  stats: Stats;
  currentCategory: Category;
  onNavigateToStats: () => void;
}

export function StatsBar({ stats, currentCategory, onNavigateToStats }: StatsBarProps) {
  const renderContent = () => {
    switch (currentCategory) {
      case "all":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              icon="🥩"
              label="Raw Food"
              value={`${stats.rawFood.inFreezerKg}kg + ${stats.rawFood.inFreezerPieces}pcs`}
              onClick={onNavigateToStats}
            />
            <StatCard
              icon="🍱"
              label="Prepared"
              value={`${stats.preparedMeals.bagsInFreezer} bags`}
              subValue={`${stats.preparedMeals.portionsInFreezer} portions`}
              onClick={onNavigateToStats}
            />
            <StatCard
              icon="🍼"
              label="Milk"
              value={`${stats.breastMilk.inFreezerMl}ml`}
              onClick={onNavigateToStats}
            />
          </div>
        );

      case "raw":
        return (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon="📦"
              label="In Freezer (kg)"
              value={`${stats.rawFood.inFreezerKg} kg`}
              onClick={onNavigateToStats}
            />
            <StatCard
              icon="📦"
              label="In Freezer (pcs)"
              value={`${stats.rawFood.inFreezerPieces} pcs`}
              onClick={onNavigateToStats}
            />
            <StatCard
              icon="✓"
              label="Consumed (kg)"
              value={`${stats.rawFood.consumedKg} kg`}
              onClick={onNavigateToStats}
            />
            <StatCard
              icon="✓"
              label="Consumed (pcs)"
              value={`${stats.rawFood.consumedPieces} pcs`}
              onClick={onNavigateToStats}
            />
          </div>
        );

      case "prepared":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              icon="📦"
              label="Bags"
              value={`${stats.preparedMeals.bagsInFreezer}`}
              onClick={onNavigateToStats}
            />
            <StatCard
              icon="🍽️"
              label="Portions"
              value={`${stats.preparedMeals.portionsInFreezer}`}
              onClick={onNavigateToStats}
            />
            <StatCard
              icon="✓"
              label="Consumed"
              value={`${stats.preparedMeals.portionsConsumed} portions`}
              onClick={onNavigateToStats}
            />
          </div>
        );

      case "milk":
        return (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon="🍼"
              label="In Freezer"
              value={`${stats.breastMilk.inFreezerMl} ml`}
              onClick={onNavigateToStats}
            />
            <StatCard
              icon="✓"
              label="Consumed"
              value={`${stats.breastMilk.consumedMl} ml`}
              onClick={onNavigateToStats}
            />
          </div>
        );
    }
  };

  return <div className="mb-6">{renderContent()}</div>;
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  onClick: () => void;
}

function StatCard({ icon, label, value, subValue, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left w-full"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-lg font-bold text-gray-800 truncate">{value}</div>
          {subValue && <div className="text-sm text-gray-500">{subValue}</div>}
          <div className="text-xs text-gray-400">{label}</div>
        </div>
      </div>
    </button>
  );
}
