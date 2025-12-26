import type { FreshnessStatus, FreshnessSetting, FreezerItem } from "./types";

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDaysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function formatRelativeDate(dateStr: string): string {
  const days = getDaysSince(dateStr);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getFreshnessStatus(
  dateAdded: string,
  settings: FreshnessSetting
): FreshnessStatus {
  const days = getDaysSince(dateAdded);
  if (days <= settings.fresh_days) return "fresh";
  if (days <= settings.good_days) return "good";
  if (days <= settings.use_soon_days) return "use_soon";
  return "red";
}

export function getFreshnessInfo(status: FreshnessStatus): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  switch (status) {
    case "fresh":
      return {
        label: "Fresh",
        color: "text-emerald-700",
        bgColor: "bg-emerald-100",
        borderColor: "border-emerald-200",
      };
    case "good":
      return {
        label: "Good",
        color: "text-amber-700",
        bgColor: "bg-amber-100",
        borderColor: "border-amber-200",
      };
    case "use_soon":
      return {
        label: "Use Soon",
        color: "text-orange-700",
        bgColor: "bg-orange-100",
        borderColor: "border-orange-200",
      };
    case "red":
      return {
        label: "Use Now!",
        color: "text-red-700",
        bgColor: "bg-red-100",
        borderColor: "border-red-200",
      };
  }
}

export function getItemDateAdded(item: FreezerItem): string {
  return item.data.date_added;
}

export function getItemId(item: FreezerItem): string {
  return `${item.type}-${item.data.id}`;
}

export function getCategoryIcon(type: FreezerItem["type"]): string {
  switch (type) {
    case "raw":
      return "🥩";
    case "prepared":
      return "🍱";
    case "milk":
      return "🍼";
  }
}

export function getSubCategoryIcon(subCategory: string): string {
  switch (subCategory) {
    case "Poultry":
      return "🍗";
    case "Red Meat":
      return "🥩";
    case "Fish/Seafood":
      return "🐟";
    case "Ground Meat":
      return "🍖";
    case "Vegetables":
      return "🥦";
    case "Fruits":
      return "🍓";
    default:
      return "📦";
  }
}
