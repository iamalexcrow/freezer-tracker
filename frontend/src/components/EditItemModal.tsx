import { useState, useEffect } from "react";
import { api } from "../api";
import type { FreezerItem, RawFoodSubCategory, RawFoodItem, PreparedMealItem, BreastMilkItem } from "../types";
import { RAW_FOOD_SUB_CATEGORIES } from "../types";
import { getTodayString } from "../utils";

interface EditItemModalProps {
  item: FreezerItem;
  onClose: () => void;
  onSaved: () => void;
}

export function EditItemModal({ item, onClose, onSaved }: EditItemModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-sky-500 to-blue-500 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Edit Item</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {item.type === "raw" && (
            <EditRawFoodForm item={item.data as RawFoodItem} onClose={onClose} onSaved={onSaved} />
          )}
          {item.type === "prepared" && (
            <EditPreparedMealForm item={item.data as PreparedMealItem} onClose={onClose} onSaved={onSaved} />
          )}
          {item.type === "milk" && (
            <EditBreastMilkForm item={item.data as BreastMilkItem} onClose={onClose} onSaved={onSaved} />
          )}
        </div>
      </div>
    </div>
  );
}

// ============ RAW FOOD EDIT FORM ============
function EditRawFoodForm({
  item,
  onClose,
  onSaved,
}: {
  item: RawFoodItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [subCategory, setSubCategory] = useState<RawFoodSubCategory>(item.sub_category);
  const [name, setName] = useState(item.name);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [amount, setAmount] = useState(String(item.amount));
  const [measuringUnit, setMeasuringUnit] = useState<"kg" | "pieces">(item.measuring_unit);
  const [dateAdded, setDateAdded] = useState(item.date_added.split("T")[0]);
  const [comment, setComment] = useState(item.comment || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: boolean; amount?: boolean }>({});

  useEffect(() => {
    api.getRawFoodNames(subCategory).then(setNameSuggestions).catch(console.error);
  }, [subCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: boolean; amount?: boolean } = {};

    if (!name.trim()) {
      errors.name = true;
    }
    const parsedAmount = parseFloat(amount);
    if (!amount.trim() || isNaN(parsedAmount) || parsedAmount < 0.1) {
      errors.amount = true;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the highlighted fields");
      return;
    }

    setFieldErrors({});

    setSaving(true);
    try {
      await api.updateRawFood(item.id, {
        sub_category: subCategory,
        name: name.trim(),
        amount: parsedAmount,
        measuring_unit: measuringUnit,
        date_added: dateAdded,
        comment: comment.trim() || undefined,
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sub-category</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RAW_FOOD_SUB_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSubCategory(cat)}
              className={`px-2 py-2 rounded-xl text-xs font-medium transition-all ${
                subCategory === cat
                  ? "bg-sky-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Chicken Breast"
          list="name-suggestions-edit"
          className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${fieldErrors.name ? "border-red-500" : "border-gray-200"}`}
        />
        <datalist id="name-suggestions-edit">
          {nameSuggestions.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.1"
            min="0.1"
            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${fieldErrors.amount ? "border-red-500" : "border-gray-200"}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMeasuringUnit("kg")}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                measuringUnit === "kg"
                  ? "bg-sky-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              kg
            </button>
            <button
              type="button"
              onClick={() => setMeasuringUnit("pieces")}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                measuringUnit === "pieces"
                  ? "bg-sky-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              pieces
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date Added</label>
        <input
          type="date"
          value={dateAdded}
          onChange={(e) => setDateAdded(e.target.value)}
          max={getTodayString()}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comment <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl font-medium hover:from-sky-600 hover:to-blue-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ============ PREPARED MEAL EDIT FORM ============
function EditPreparedMealForm({
  item,
  onClose,
  onSaved,
}: {
  item: PreparedMealItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [portions, setPortions] = useState(String(item.portions));
  const [dateAdded, setDateAdded] = useState(item.date_added.split("T")[0]);
  const [comment, setComment] = useState(item.comment || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: boolean; portions?: boolean }>({});

  useEffect(() => {
    api.getPreparedMealNames().then(setNameSuggestions).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: boolean; portions?: boolean } = {};

    if (!name.trim()) {
      errors.name = true;
    }
    const parsedPortions = parseInt(portions);
    if (!portions.trim() || isNaN(parsedPortions) || parsedPortions < 1) {
      errors.portions = true;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the highlighted fields");
      return;
    }

    setFieldErrors({});

    setSaving(true);
    try {
      await api.updatePreparedMeal(item.id, {
        name: name.trim(),
        portions: parsedPortions,
        date_added: dateAdded,
        comment: comment.trim() || undefined,
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Lasagna"
          list="meal-suggestions-edit"
          className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${fieldErrors.name ? "border-red-500" : "border-gray-200"}`}
        />
        <datalist id="meal-suggestions-edit">
          {nameSuggestions.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Portions</label>
        <input
          type="number"
          value={portions}
          onChange={(e) => setPortions(e.target.value)}
          min="1"
          className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${fieldErrors.portions ? "border-red-500" : "border-gray-200"}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date Added</label>
        <input
          type="date"
          value={dateAdded}
          onChange={(e) => setDateAdded(e.target.value)}
          max={getTodayString()}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comment <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl font-medium hover:from-sky-600 hover:to-blue-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ============ BREAST MILK EDIT FORM ============
function EditBreastMilkForm({
  item,
  onClose,
  onSaved,
}: {
  item: BreastMilkItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [dateExpressed, setDateExpressed] = useState(item.date_expressed.split("T")[0]);
  const [dateAdded, setDateAdded] = useState(item.date_added.split("T")[0]);
  const [volumeMl, setVolumeMl] = useState(String(item.volume_ml));
  const [comment, setComment] = useState(item.comment || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ volumeMl?: boolean }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { volumeMl?: boolean } = {};

    const parsedVolume = parseInt(volumeMl);
    if (!volumeMl.trim() || isNaN(parsedVolume) || parsedVolume < 1) {
      errors.volumeMl = true;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the highlighted fields");
      return;
    }

    setFieldErrors({});

    setSaving(true);
    try {
      await api.updateBreastMilk(item.id, {
        date_expressed: dateExpressed,
        date_added: dateAdded,
        volume_ml: parsedVolume,
        comment: comment.trim() || undefined,
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Volume (ml)</label>
        <input
          type="number"
          value={volumeMl}
          onChange={(e) => setVolumeMl(e.target.value)}
          min="1"
          className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 ${fieldErrors.volumeMl ? "border-red-500" : "border-gray-200"}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Expressed</label>
          <input
            type="date"
            value={dateExpressed}
            onChange={(e) => setDateExpressed(e.target.value)}
            max={getTodayString()}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Added</label>
          <input
            type="date"
            value={dateAdded}
            onChange={(e) => setDateAdded(e.target.value)}
            max={getTodayString()}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comment <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl font-medium hover:from-sky-600 hover:to-blue-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
