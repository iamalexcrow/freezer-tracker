import { useMemo, useState } from "react";
import type { FreezerItem, RawFoodItem, PreparedMealItem, BreastMilkItem, FreshnessStatus } from "../types";
import { getSubCategoryIcon, getCategoryIcon } from "../utils";
import { ListItemModal } from "./ListItemModal";

interface AggregatedItem {
  key: string;
  name: string;
  icon: string;
  type: "raw" | "prepared" | "milk";
  items: FreezerItem[];
  bagCount: number;
  // For raw food
  totalAmount?: number;
  measuringUnit?: "kg" | "pieces";
  // For prepared meals
  totalPortions?: number;
  // For milk
  totalVolumeMl?: number;
}

interface ListViewProps {
  items: FreezerItem[];
  getItemFreshness: (item: FreezerItem) => FreshnessStatus;
  onTakeOut: (item: FreezerItem) => void;
  onEdit: (item: FreezerItem) => void;
  onDelete: (item: FreezerItem) => void;
}

export function ListView({ items, getItemFreshness, onTakeOut, onEdit, onDelete }: ListViewProps) {
  const [selectedGroup, setSelectedGroup] = useState<AggregatedItem | null>(null);

  const aggregatedItems = useMemo(() => {
    const groups = new Map<string, AggregatedItem>();

    for (const item of items) {
      let key: string;
      let name: string;
      let icon: string;

      if (item.type === "raw") {
        const data = item.data as RawFoodItem;
        key = `raw-${data.sub_category}-${data.name}`;
        name = data.name;
        icon = getSubCategoryIcon(data.sub_category);
      } else if (item.type === "prepared") {
        const data = item.data as PreparedMealItem;
        key = `prepared-${data.name}`;
        name = data.name;
        icon = getCategoryIcon("prepared");
      } else {
        key = "milk-all";
        name = "Breast Milk";
        icon = getCategoryIcon("milk");
      }

      const existing = groups.get(key);
      if (existing) {
        existing.items.push(item);
        existing.bagCount++;

        if (item.type === "raw") {
          const data = item.data as RawFoodItem;
          existing.totalAmount = (existing.totalAmount || 0) + data.amount;
        } else if (item.type === "prepared") {
          const data = item.data as PreparedMealItem;
          existing.totalPortions = (existing.totalPortions || 0) + data.portions;
        } else {
          const data = item.data as BreastMilkItem;
          existing.totalVolumeMl = (existing.totalVolumeMl || 0) + data.volume_ml;
        }
      } else {
        const newGroup: AggregatedItem = {
          key,
          name,
          icon,
          type: item.type,
          items: [item],
          bagCount: 1,
        };

        if (item.type === "raw") {
          const data = item.data as RawFoodItem;
          newGroup.totalAmount = data.amount;
          newGroup.measuringUnit = data.measuring_unit;
        } else if (item.type === "prepared") {
          const data = item.data as PreparedMealItem;
          newGroup.totalPortions = data.portions;
        } else {
          const data = item.data as BreastMilkItem;
          newGroup.totalVolumeMl = data.volume_ml;
        }

        groups.set(key, newGroup);
      }
    }

    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const formatCount = (group: AggregatedItem): string => {
    const bags = group.bagCount === 1 ? "1 bag" : `${group.bagCount} bags`;

    if (group.type === "raw" && group.totalAmount !== undefined) {
      const amount = group.measuringUnit === "kg"
        ? `${group.totalAmount.toFixed(1)} kg`
        : `${group.totalAmount} pcs`;
      return `${bags} / ${amount}`;
    }

    if (group.type === "prepared" && group.totalPortions !== undefined) {
      const portions = group.totalPortions === 1 ? "1 portion" : `${group.totalPortions} portions`;
      return `${bags} / ${portions}`;
    }

    if (group.type === "milk" && group.totalVolumeMl !== undefined) {
      return `${bags} / ${group.totalVolumeMl} ml`;
    }

    return bags;
  };

  if (aggregatedItems.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">No items found</div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {aggregatedItems.map((group) => (
          <button
            key={group.key}
            onClick={() => setSelectedGroup(group)}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-sky-300 hover:shadow-md transition-all text-left w-full"
          >
            <span className="text-2xl flex-shrink-0">{group.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 truncate">{group.name}</div>
              <div className="text-sm text-gray-500">{formatCount(group)}</div>
            </div>
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {selectedGroup && (
        <ListItemModal
          group={selectedGroup}
          getItemFreshness={getItemFreshness}
          onClose={() => setSelectedGroup(null)}
          onTakeOut={(item) => {
            onTakeOut(item);
            setSelectedGroup(null);
          }}
          onEdit={(item) => {
            onEdit(item);
            setSelectedGroup(null);
          }}
          onDelete={(item) => {
            onDelete(item);
            setSelectedGroup(null);
          }}
        />
      )}
    </>
  );
}
