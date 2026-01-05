"use client";

import type { TravelBudgetData } from "@/lib/types";

interface BudgetSummaryProps {
  data: TravelBudgetData;
}

/**
 * Budget Summary Component
 *
 * Displays the estimated travel budget as a summary card
 * with category breakdown and a money-saving tip.
 */
export function BudgetSummary({ data }: BudgetSummaryProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header with total */}
      <div className="px-4 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-xl">💰</span>
          Budget Estimate
        </h3>
        <div className="mt-2">
          <span className="text-2xl font-bold text-emerald-600">{data.totalRange}</span>
          <span className="text-sm text-gray-500 ml-2">estimated total</span>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="px-4 py-3">
        <div className="space-y-3">
          {data.categories.map((category, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{category.icon}</span>
                <span className="text-sm font-medium text-gray-700">{category.category}</span>
              </div>
              <span className="text-sm text-gray-600 font-medium">{category.range}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pro tip */}
      {data.tip && (
        <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
          <div className="flex items-start gap-2">
            <span className="text-base mt-0.5">💡</span>
            <div>
              <span className="text-sm font-medium text-amber-800">Pro Tip:</span>
              <span className="text-sm text-amber-700 ml-1">{data.tip}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
