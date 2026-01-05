"use client";

import { useState, useRef } from "react";
import type { TravelHighlightsData } from "@/lib/types";

interface DestinationHighlightsProps {
  data: TravelHighlightsData;
}

/**
 * Builds an Unsplash image URL for an attraction.
 * Uses the Source API which returns a random photo matching the query.
 */
function getUnsplashUrl(query: string, width = 400, height = 300): string {
  const encodedQuery = encodeURIComponent(query);
  return `https://source.unsplash.com/${width}x${height}/?${encodedQuery}`;
}

/**
 * Destination Highlights Component
 *
 * Displays a carousel of attraction images with tips and best time to visit.
 * Uses CSS scroll-snap for smooth native scrolling.
 */
export function DestinationHighlights({ data }: DestinationHighlightsProps) {
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleImageError = (index: number) => {
    setFailedImages((prev) => new Set([...prev, index]));
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -220, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 220, behavior: "smooth" });
    }
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

      {/* Carousel */}
      {data.attractions.length > 0 && (
        <div className="relative">
          {/* Scroll buttons */}
          {data.attractions.length > 2 && (
            <>
              <button
                onClick={scrollLeft}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-colors"
                aria-label="Scroll left"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={scrollRight}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-colors"
                aria-label="Scroll right"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Scrollable container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory p-4 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {data.attractions.map((attraction, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-52 snap-start"
              >
                {/* Image container */}
                <div className="relative h-36 rounded-lg overflow-hidden bg-gray-100">
                  {failedImages.has(index) ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-100 to-orange-100">
                      <span className="text-4xl">🏛️</span>
                    </div>
                  ) : (
                    <img
                      src={getUnsplashUrl(attraction.imageQuery)}
                      alt={attraction.name}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(index)}
                      loading="lazy"
                    />
                  )}
                </div>
                {/* Card content */}
                <div className="mt-2">
                  <h4 className="font-medium text-gray-800 text-sm truncate">
                    {attraction.name}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                    {attraction.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info section */}
      <div className="px-4 pb-4 space-y-3">
        {/* Best time to visit */}
        <div className="flex items-start gap-2">
          <span className="text-base mt-0.5">📅</span>
          <div>
            <span className="text-sm font-medium text-gray-700">Best Time to Visit:</span>
            <span className="text-sm text-gray-600 ml-1">{data.bestTimeToVisit}</span>
          </div>
        </div>

        {/* Tips */}
        {data.tips.length > 0 && (
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
