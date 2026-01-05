"use client";

import { useState } from "react";
import type { TravelItineraryData, ItineraryDay } from "@/lib/types";

interface ItineraryTimelineProps {
  data: TravelItineraryData;
}

const TIME_ICONS: Record<string, string> = {
  morning: "🌅",
  afternoon: "🌆",
  evening: "🌙",
};

const TIME_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

interface DayAccordionProps {
  day: ItineraryDay;
  isExpanded: boolean;
  onToggle: () => void;
}

function DayAccordion({ day, isExpanded, onToggle }: DayAccordionProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header - clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 bg-rose-100 text-rose-600 rounded-full text-sm font-semibold">
            {day.day}
          </span>
          <span className="font-medium text-gray-800">Day {day.day} - {day.title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable content */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-3 space-y-3 bg-white">
          {day.activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="text-lg mt-0.5">{TIME_ICONS[activity.time] || "📍"}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {TIME_LABELS[activity.time] || activity.time}
                  </span>
                </div>
                <p className="text-sm text-gray-800 font-medium">{activity.activity}</p>
                {activity.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Itinerary Timeline Component
 *
 * Displays the trip itinerary as an accordion timeline.
 * First day is expanded by default, others are collapsed.
 */
export function ItineraryTimeline({ data }: ItineraryTimelineProps) {
  // Start with first day expanded
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));

  const toggleDay = (dayNum: number) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayNum)) {
        newSet.delete(dayNum);
      } else {
        newSet.add(dayNum);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedDays(new Set(data.days.map((d) => d.day)));
  };

  const collapseAll = () => {
    setExpandedDays(new Set());
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-xl">📋</span>
            Sample Itinerary
          </h3>
          <p className="text-sm text-gray-600 mt-0.5">{data.duration}</p>
        </div>
        {/* Expand/Collapse controls */}
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Expand all
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Days accordion */}
      <div className="p-4 space-y-2">
        {data.days.map((day) => (
          <DayAccordion
            key={day.day}
            day={day}
            isExpanded={expandedDays.has(day.day)}
            onToggle={() => toggleDay(day.day)}
          />
        ))}
      </div>
    </div>
  );
}
