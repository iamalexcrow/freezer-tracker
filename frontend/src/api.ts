import type {
  RawFoodItem,
  PreparedMealItem,
  BreastMilkItem,
  Stats,
  FreshnessSetting,
  CreateRawFoodInput,
  CreatePreparedMealInput,
  CreateBreastMilkInput,
  RawFoodSubCategory,
} from "./types";

const API_BASE = "/api";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return res.json();
}

export const api = {
  // ============ RAW FOOD ============
  getRawFood: () => request<RawFoodItem[]>("/raw-food"),
  getRawFoodConsumed: () => request<RawFoodItem[]>("/raw-food/consumed"),
  getRawFoodNames: (subCategory: RawFoodSubCategory) =>
    request<string[]>(`/raw-food/names/${encodeURIComponent(subCategory)}`),
  createRawFood: (data: CreateRawFoodInput) =>
    request<RawFoodItem>("/raw-food", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateRawFood: (id: number, data: Partial<CreateRawFoodInput>) =>
    request<RawFoodItem>(`/raw-food/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  takeOutRawFood: (id: number, amountTaken: number) =>
    request<{ success: boolean }>(`/raw-food/${id}/take-out`, {
      method: "POST",
      body: JSON.stringify({ amount_taken: amountTaken }),
    }),
  deleteRawFood: (id: number) =>
    request<{ success: boolean }>(`/raw-food/${id}`, { method: "DELETE" }),
  putBackRawFood: (id: number) =>
    request<{ success: boolean }>(`/raw-food/${id}/put-back`, { method: "POST" }),

  // ============ PREPARED MEALS ============
  getPreparedMeals: () => request<PreparedMealItem[]>("/prepared-meals"),
  getPreparedMealsConsumed: () => request<PreparedMealItem[]>("/prepared-meals/consumed"),
  getPreparedMealNames: () => request<string[]>("/prepared-meals/names"),
  createPreparedMeal: (data: CreatePreparedMealInput) =>
    request<PreparedMealItem[]>("/prepared-meals", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePreparedMeal: (id: number, data: Partial<CreatePreparedMealInput>) =>
    request<PreparedMealItem>(`/prepared-meals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  takeOutPreparedMeal: (id: number) =>
    request<{ success: boolean }>(`/prepared-meals/${id}/take-out`, {
      method: "POST",
    }),
  deletePreparedMeal: (id: number) =>
    request<{ success: boolean }>(`/prepared-meals/${id}`, { method: "DELETE" }),
  putBackPreparedMeal: (id: number) =>
    request<{ success: boolean }>(`/prepared-meals/${id}/put-back`, { method: "POST" }),

  // ============ BREAST MILK ============
  getBreastMilk: () => request<BreastMilkItem[]>("/breast-milk"),
  getBreastMilkConsumed: () => request<BreastMilkItem[]>("/breast-milk/consumed"),
  createBreastMilk: (data: CreateBreastMilkInput) =>
    request<BreastMilkItem>("/breast-milk", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateBreastMilk: (id: number, data: Partial<CreateBreastMilkInput>) =>
    request<BreastMilkItem>(`/breast-milk/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  takeOutBreastMilk: (id: number) =>
    request<{ success: boolean }>(`/breast-milk/${id}/take-out`, {
      method: "POST",
    }),
  deleteBreastMilk: (id: number) =>
    request<{ success: boolean }>(`/breast-milk/${id}`, { method: "DELETE" }),
  putBackBreastMilk: (id: number) =>
    request<{ success: boolean }>(`/breast-milk/${id}/put-back`, { method: "POST" }),

  // ============ STATS ============
  getStats: () => request<Stats>("/stats"),

  // ============ FRESHNESS SETTINGS ============
  getFreshnessSettings: () => request<FreshnessSetting[]>("/freshness-settings"),
  updateFreshnessSetting: (
    id: number,
    data: { fresh_days: number; good_days: number; use_soon_days: number }
  ) =>
    request<FreshnessSetting>(`/freshness-settings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // ============ RED ZONE ============
  isRedZoneDismissed: () => request<{ dismissed: boolean }>("/red-zone-dismissed"),
  dismissRedZone: () =>
    request<{ success: boolean }>("/red-zone-dismiss", { method: "POST" }),
};
