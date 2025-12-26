import { useState } from "react";
import type { RawFoodItem } from "../types";

interface TakeOutModalProps {
  item: RawFoodItem;
  onConfirm: (amount: number) => void;
  onClose: () => void;
}

export function TakeOutModal({ item, onConfirm, onClose }: TakeOutModalProps) {
  const [amount, setAmount] = useState(item.amount);
  const isFullAmount = amount >= item.amount;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-sky-500 to-blue-500 px-4 sm:px-6 py-4">
          <h2 className="text-lg sm:text-xl font-semibold text-white">Take Out of Freezer</h2>
          <p className="text-sky-100 text-sm mt-1">{item.name}</p>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
            <div className="text-sm text-gray-500 mb-1">Available</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-800">
              {item.amount} {item.measuring_unit}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How much do you want to take out?
            </label>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setAmount(Math.max(0.1, amount - (item.measuring_unit === "kg" ? 0.1 : 1)))}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-xl text-gray-700 font-bold hover:bg-gray-200 transition-colors text-lg sm:text-xl"
              >
                −
              </button>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.min(item.amount, Math.max(0.1, parseFloat(e.target.value) || 0)))}
                step={item.measuring_unit === "kg" ? "0.1" : "1"}
                min="0.1"
                max={item.amount}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-base sm:text-lg font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => setAmount(Math.min(item.amount, amount + (item.measuring_unit === "kg" ? 0.1 : 1)))}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-xl text-gray-700 font-bold hover:bg-gray-200 transition-colors text-lg sm:text-xl"
              >
                +
              </button>
            </div>
            <div className="text-center text-sm text-gray-500 mt-2">
              {item.measuring_unit}
            </div>
          </div>

          {/* Quick select buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAmount(item.amount * 0.25)}
              className="flex-1 py-2 bg-gray-100 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => setAmount(item.amount * 0.5)}
              className="flex-1 py-2 bg-gray-100 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setAmount(item.amount * 0.75)}
              className="flex-1 py-2 bg-gray-100 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              75%
            </button>
            <button
              type="button"
              onClick={() => setAmount(item.amount)}
              className="flex-1 py-2 bg-gray-100 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              All
            </button>
          </div>

          {!isFullAmount && (
            <div className="bg-amber-50 text-amber-700 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm">
              <strong>Splitting:</strong> {amount.toFixed(item.measuring_unit === "kg" ? 1 : 0)} {item.measuring_unit} will be taken out. 
              Remaining {(item.amount - amount).toFixed(item.measuring_unit === "kg" ? 1 : 0)} {item.measuring_unit} stays in freezer.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(amount)}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl font-medium hover:from-sky-600 hover:to-blue-600"
            >
              Take Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
