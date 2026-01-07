"use client";

import { useState } from "react";
import type { TravelHighlightsData } from "@/lib/types";

interface DestinationHighlightsProps {
  data: TravelHighlightsData;
}

/**
 * Destination Highlights Component
 *
 * Displays a full-width single-slide carousel of attractions.
 * One attraction at a time with navigation controls.
 */
export function DestinationHighlights({ data }: DestinationHighlightsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const attractions = data.attractions || [];
  const hasAttractions = attractions.length > 0;
  const currentAttraction = hasAttractions ? attractions[currentIndex] : null;

  const goToPrevious = () => {
    setImageError(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : attractions.length - 1));
  };

  const goToNext = () => {
    setImageError(false);
    setCurrentIndex((prev) => (prev < attractions.length - 1 ? prev + 1 : 0));
  };

  const goToSlide = (index: number) => {
    setImageError(false);
    setCurrentIndex(index);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-orange-50">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-xl">✨</span>
          Destination Highlights
        </h3>
        <p className="text-sm text-gray-600 mt-0.5">{data.destination}</p>
      </div>

      {/* Full-width single-slide carousel */}
      {hasAttractions && currentAttraction && (
        <div className="relative">
          {/* Main image */}
          <div className="relative aspect-video w-full bg-gray-100">
            {imageError ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-100 to-orange-100">
                <div className="text-center">
                  <span className="text-6xl block mb-2">🏛️</span>
                  <span className="text-gray-500 text-sm">{currentAttraction.name}</span>
                </div>
              </div>
            ) : (
              <img
                src={currentAttraction.imageUrl}
                alt={currentAttraction.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            )}

            {/* Navigation arrows */}
            {attractions.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Previous attraction"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Next attraction"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Slide counter */}
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-sm px-2 py-1 rounded">
              {currentIndex + 1} / {attractions.length}
            </div>
          </div>

          {/* Current attraction info */}
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-lg font-semibold text-gray-800">
              {currentAttraction.name}
            </h4>
            <p className="text-gray-600 mt-1">
              {currentAttraction.description}
            </p>
          </div>

          {/* Dot indicators */}
          {attractions.length > 1 && (
            <div className="flex justify-center gap-2 py-3 bg-gray-50">
              {attractions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    index === currentIndex
                      ? "bg-rose-500"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to attraction ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info section */}
      <div className="px-4 py-4 space-y-3">
        {/* Best time to visit */}
        <div className="flex items-start gap-2">
          <span className="text-base mt-0.5">📅</span>
          <div>
            <span className="text-sm font-medium text-gray-700">Best Time to Visit:</span>
            <span className="text-sm text-gray-600 ml-1">{data.bestTimeToVisit}</span>
          </div>
        </div>

        {/* Tips */}
        {data.tips && data.tips.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-base mt-0.5">💡</span>
            <div>
              <span className="text-sm font-medium text-gray-700">Tips:</span>
              <ul className="mt-1 space-y-1">
                {data.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-1.5">
                    <span className="text-gray-400 mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
