import type { FreezerItem } from "../types";
import { getCategoryIcon, getSubCategoryIcon } from "../utils";

interface RedZoneAlertProps {
  items: FreezerItem[];
  onDismiss: () => void;
  onTakeOut: (item: FreezerItem) => void;
}

export function RedZoneAlert({ items, onDismiss, onTakeOut }: RedZoneAlertProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-red-800">Use These Soon!</h3>
            <p className="text-sm text-red-600">
              {items.length} item{items.length > 1 ? "s" : ""} should be used immediately
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 p-2 hover:bg-red-100 rounded-lg transition-colors"
          title="Dismiss until tomorrow"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {items.map((item) => (
          <div
            key={`${item.type}-${item.data.id}`}
            className="flex items-center justify-between bg-white rounded-xl p-3 border border-red-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {item.type === "raw"
                  ? getSubCategoryIcon((item.data as any).sub_category)
                  : getCategoryIcon(item.type)}
              </span>
              <div>
                <div className="font-medium text-gray-900">
                  {item.type === "milk"
                    ? `Milk - ${(item.data as any).volume_ml}ml`
                    : (item.data as any).name}
                </div>
                <div className="text-xs text-gray-500">
                  Added {new Date(item.data.date_added).toLocaleDateString()}
                </div>
              </div>
            </div>
            <button
              onClick={() => onTakeOut(item)}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Take out
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
