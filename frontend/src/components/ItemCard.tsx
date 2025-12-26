import type { FreezerItem, ViewMode, FreshnessStatus } from "../types";
import {
  formatRelativeDate,
  getFreshnessInfo,
  getSubCategoryIcon,
  getCategoryIcon,
} from "../utils";

interface ItemCardProps {
  item: FreezerItem;
  viewMode: ViewMode;
  freshnessStatus: FreshnessStatus;
  onTakeOut: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ItemCard({
  item,
  viewMode,
  freshnessStatus,
  onTakeOut,
  onEdit,
  onDelete,
}: ItemCardProps) {
  const freshness = getFreshnessInfo(freshnessStatus);

  const getIcon = () => {
    if (item.type === "raw") {
      return getSubCategoryIcon(item.data.sub_category);
    }
    return getCategoryIcon(item.type);
  };

  const getName = () => {
    switch (item.type) {
      case "raw":
        return item.data.name;
      case "prepared":
        return item.data.name;
      case "milk":
        return `Breast Milk`;
    }
  };

  const getSubtitle = () => {
    switch (item.type) {
      case "raw":
        return `${item.data.amount} ${item.data.measuring_unit}`;
      case "prepared":
        return `${item.data.portions} portion${item.data.portions > 1 ? "s" : ""}`;
      case "milk":
        return `${item.data.volume_ml} ml`;
    }
  };

  const getCategory = () => {
    switch (item.type) {
      case "raw":
        return item.data.sub_category;
      case "prepared":
        return "Prepared Meal";
      case "milk":
        return `Expressed: ${new Date(item.data.date_expressed).toLocaleDateString()}`;
    }
  };

  if (viewMode === "grid") {
    return (
      <div className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border ${freshness.borderColor} overflow-hidden group`}>
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getIcon()}</span>
              <div>
                <h3 className="font-semibold text-gray-900 leading-tight">
                  {getName()}
                </h3>
                <span className="text-sm text-gray-500">{getSubtitle()}</span>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onEdit}
                className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-2">{getCategory()}</div>

          <div className="flex items-center justify-between mb-3">
            <div className={`text-xs px-2 py-1 rounded-full ${freshness.bgColor} ${freshness.color}`}>
              {freshness.label} · {formatRelativeDate(item.data.date_added)}
            </div>
          </div>

          {item.data.comment && (
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
              {item.data.comment}
            </p>
          )}

          <button
            onClick={onTakeOut}
            className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl font-medium hover:from-sky-600 hover:to-blue-600 transition-all shadow-sm hover:shadow active:scale-[0.98]"
          >
            Take out
          </button>
        </div>
      </div>
    );
  }

  // Rows view
  return (
    <div className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border ${freshness.borderColor} p-4 group`}>
      {/* Mobile layout */}
      <div className="sm:hidden">
        <div className="flex items-start gap-3 mb-3">
          <div className="text-2xl flex-shrink-0">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">{getName()}</h3>
            <div className="text-sm text-gray-500">{getSubtitle()}</div>
            <div className="text-xs text-gray-400 mt-0.5">{getCategory()}</div>
          </div>
          <div className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${freshness.bgColor} ${freshness.color}`}>
            {freshness.label}
          </div>
        </div>
        {item.data.comment && (
          <p className="text-xs text-gray-400 mb-3 truncate">{item.data.comment}</p>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={onTakeOut}
            className="flex-1 py-2.5 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl font-medium text-sm"
          >
            Take out
          </button>
          <button
            onClick={onEdit}
            className="p-2.5 text-gray-400 hover:text-sky-600 bg-gray-100 rounded-xl"
            title="Edit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2.5 text-gray-400 hover:text-red-600 bg-gray-100 rounded-xl"
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:flex items-center gap-4">
        <div className="text-3xl flex-shrink-0">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{getName()}</h3>
            <span className="text-sm text-gray-500">{getSubtitle()}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">{getCategory()}</span>
            {item.data.comment && (
              <span className="text-xs text-gray-400 truncate">· {item.data.comment}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${freshness.bgColor} ${freshness.color}`}>
            {freshness.label} · {formatRelativeDate(item.data.date_added)}
          </div>

          <button
            onClick={onTakeOut}
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl font-medium text-sm hover:from-sky-600 hover:to-blue-600 transition-all shadow-sm hover:shadow whitespace-nowrap active:scale-[0.98]"
          >
            Take out
          </button>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
