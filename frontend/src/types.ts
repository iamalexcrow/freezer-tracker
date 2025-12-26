// Categories
export type Category = "all" | "raw" | "prepared" | "milk";
export type ViewMode = "grid" | "rows" | "list";
export type SortOrder = "newest" | "oldest";
export type FreshnessFilter = "all" | "fresh" | "good" | "use_soon" | "red";

// Raw Food
export const RAW_FOOD_SUB_CATEGORIES = [
  "Poultry",
  "Red Meat",
  "Fish/Seafood",
  "Ground Meat",
  "Vegetables",
  "Fruits",
  "Other",
] as const;

export type RawFoodSubCategory = (typeof RAW_FOOD_SUB_CATEGORIES)[number];

export interface RawFoodItem {
  id: number;
  sub_category: RawFoodSubCategory;
  name: string;
  amount: number;
  measuring_unit: "kg" | "pieces";
  date_added: string;
  comment: string | null;
  date_removed: string | null;
  created_at: string;
}

// Prepared Meals
export interface PreparedMealItem {
  id: number;
  name: string;
  portions: number;
  date_added: string;
  comment: string | null;
  date_removed: string | null;
  created_at: string;
}

// Breast Milk
export interface BreastMilkItem {
  id: number;
  date_expressed: string;
  date_added: string;
  volume_ml: number;
  comment: string | null;
  date_removed: string | null;
  created_at: string;
}

// Unified item type for display
export type FreezerItem =
  | { type: "raw"; data: RawFoodItem }
  | { type: "prepared"; data: PreparedMealItem }
  | { type: "milk"; data: BreastMilkItem };

// Freshness
export type FreshnessStatus = "fresh" | "good" | "use_soon" | "red";

export interface FreshnessSetting {
  id: number;
  category: string;
  sub_category: string | null;
  fresh_days: number;
  good_days: number;
  use_soon_days: number;
}

// Stats
export interface Stats {
  rawFood: {
    inFreezerKg: number;
    inFreezerPieces: number;
    consumedKg: number;
    consumedPieces: number;
  };
  preparedMeals: {
    bagsInFreezer: number;
    portionsInFreezer: number;
    portionsConsumed: number;
  };
  breastMilk: {
    inFreezerMl: number;
    consumedMl: number;
  };
}

// Create inputs
export interface CreateRawFoodInput {
  sub_category: RawFoodSubCategory;
  name: string;
  amount: number;
  measuring_unit: "kg" | "pieces";
  date_added: string;
  comment?: string;
}

export interface CreatePreparedMealInput {
  name: string;
  portions: number;
  date_added: string;
  comment?: string;
  quantity: number;
}

export interface CreateBreastMilkInput {
  date_expressed: string;
  date_added: string;
  volume_ml: number;
  comment?: string;
}
