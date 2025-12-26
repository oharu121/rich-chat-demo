"use client";

import { useEffect, useRef } from "react";
import type { SlashCommand } from "@/lib/types";

interface SlashCommandMenuProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
  isVisible: boolean;
}

function CommandIcon({ type, className }: { type: string; className?: string }) {
  const iconClass = className || "w-5 h-5";

  switch (type) {
    case "code":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    case "search":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      );
    case "book":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case "help":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
  }
}

export function SlashCommandMenu({
  commands,
  selectedIndex,
  onSelect,
  isVisible,
}: SlashCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current && menuRef.current) {
      selectedRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  if (!isVisible || commands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 mb-2 w-80 max-h-64 overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-xl animate-fade-in-up z-50"
    >
      <div className="p-2">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-2">
          Slash Commands
        </div>
        {commands.map((cmd, index) => (
          <button
            key={cmd.command}
            ref={index === selectedIndex ? selectedRef : null}
            onClick={() => onSelect(cmd)}
            className={`w-full px-3 py-2.5 flex items-center gap-3 text-left rounded-lg transition-colors ${
              index === selectedIndex
                ? "bg-blue-50 text-blue-700"
                : "hover:bg-gray-50 text-gray-700"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                index === selectedIndex ? "bg-blue-100" : "bg-gray-100"
              }`}
            >
              <CommandIcon
                type={cmd.icon}
                className={`w-5 h-5 ${
                  index === selectedIndex ? "text-blue-600" : "text-gray-500"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{cmd.command}</div>
              <div
                className={`text-sm truncate ${
                  index === selectedIndex ? "text-blue-600/70" : "text-gray-500"
                }`}
              >
                {cmd.description}
              </div>
            </div>
            {index === selectedIndex && (
              <kbd className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded font-mono">
                Tab
              </kbd>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
