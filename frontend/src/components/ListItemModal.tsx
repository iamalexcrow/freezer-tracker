import type { FreezerItem, RawFoodItem, PreparedMealItem, BreastMilkItem, FreshnessStatus } from "../types";
import { formatRelativeDate, getFreshnessInfo } from "../utils";

interface AggregatedItem {
  key: string;
  name: string;
  icon: string;
  type: "raw" | "prepared" | "milk";
  items: FreezerItem[];
  bagCount: number;
  totalAmount?: number;
  measuringUnit?: "kg" | "pieces";
  totalPortions?: number;
  totalVolumeMl?: number;
}

interface ListItemModalProps {
  group: AggregatedItem;
  getItemFreshness: (item: FreezerItem) => FreshnessStatus;
  onClose: () => void;
  onTakeOut: (item: FreezerItem) => void;
  onEdit: (item: FreezerItem) => void;
  onDelete: (item: FreezerItem) => void;
}

export function ListItemModal({ group, getItemFreshness, onClose, onTakeOut, onEdit, onDelete }: ListItemModalProps) {
  const getItemDetails = (item: FreezerItem): string => {
    if (item.type === "raw") {
      const data = item.data as RawFoodItem;
      return `${data.amount} ${data.measuring_unit}`;
    }
    if (item.type === "prepared") {
      const data = item.data as PreparedMealItem;
      return `${data.portions} portion${data.portions > 1 ? "s" : ""}`;
    }
    const data = item.data as BreastMilkItem;
    return `${data.volume_ml} ml`;
  };

  const getItemDate = (item: FreezerItem): string => {
    return formatRelativeDate(item.data.date_added);
  };

  const getItemComment = (item: FreezerItem): string | null => {
    return item.data.comment;
  };

  // Sort items by date (oldest first for use priority)
  const sortedItems = [...group.items].sort((a, b) => {
    return new Date(a.data.date_added).getTime() - new Date(b.data.date_added).getTime();
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-sky-500 to-blue-500 px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{group.icon}</span>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-white">{group.name}</h2>
                <p className="text-sky-100 text-sm">{group.bagCount} item{group.bagCount > 1 ? "s" : ""} in freezer</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-3">
          {sortedItems.map((item) => {
            const freshness = getFreshnessInfo(getItemFreshness(item));
            return (
              <div
                key={`${item.type}-${item.data.id}`}
                className={`border rounded-xl p-4 ${freshness.borderColor} ${freshness.bgColor}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${freshness.color}`}>
                        {freshness.label}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500">{getItemDate(item)}</span>
                    </div>
                    <div className="font-medium text-gray-800">{getItemDetails(item)}</div>
                    {getItemComment(item) && (
                      <div className="text-sm text-gray-500 mt-1 italic">{getItemComment(item)}</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200/50">
                  <button
                    onClick={() => onTakeOut(item)}
                    className="flex-1 px-3 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
                  >
                    Take Out
                  </button>
                  <button
                    onClick={() => onEdit(item)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
