"use client";

import { useState, useCallback, useMemo } from "react";
import type { SlashCommand, AgentType } from "@/lib/types";
import { SLASH_COMMANDS } from "@/lib/constants";

export interface ParsedInput {
  command: SlashCommand | null;
  message: string;
  agent: AgentType;
}

export function useSlashCommands() {
  const [showMenu, setShowMenu] = useState(false);
  const [menuFilter, setMenuFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Parse input to extract command and message
  const parseInput = useCallback((input: string): ParsedInput => {
    if (!input.startsWith("/")) {
      return { command: null, message: input, agent: "default" };
    }

    const spaceIndex = input.indexOf(" ");
    const commandStr = spaceIndex === -1 ? input : input.slice(0, spaceIndex);
    const message = spaceIndex === -1 ? "" : input.slice(spaceIndex + 1).trim();

    const command = SLASH_COMMANDS.find((c) => c.command === commandStr);

    if (command) {
      return { command, message, agent: command.agent };
    }

    // Partial command match - return default with full input as message
    return { command: null, message: input, agent: "default" };
  }, []);

  // Get filtered commands based on current input
  const getFilteredCommands = useCallback((filter: string): SlashCommand[] => {
    if (!filter || !filter.startsWith("/")) {
      return SLASH_COMMANDS;
    }

    const searchTerm = filter.slice(1).toLowerCase();
    return SLASH_COMMANDS.filter(
      (c) =>
        c.command.slice(1).toLowerCase().includes(searchTerm) ||
        c.description.toLowerCase().includes(searchTerm)
    );
  }, []);

  // Check if input is in command mode (starts with /)
  const isCommandMode = useCallback((input: string): boolean => {
    return input.startsWith("/") && !input.includes(" ");
  }, []);

  // Handle input change
  const handleInputChange = useCallback(
    (input: string) => {
      const inCommandMode = isCommandMode(input);
      setShowMenu(inCommandMode);

      if (inCommandMode) {
        setMenuFilter(input);
        const filtered = getFilteredCommands(input);
        setSelectedIndex((prev) => Math.min(prev, filtered.length - 1));
      } else {
        setMenuFilter("");
        setSelectedIndex(0);
      }
    },
    [isCommandMode, getFilteredCommands]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      filteredCommands: SlashCommand[],
      onSelect: (command: SlashCommand) => void
    ): boolean => {
      if (!showMenu || filteredCommands.length === 0) {
        return false;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
          return true;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          return true;
        case "Tab":
        case "Enter":
          if (filteredCommands[selectedIndex]) {
            e.preventDefault();
            onSelect(filteredCommands[selectedIndex]);
            return true;
          }
          return false;
        case "Escape":
          e.preventDefault();
          setShowMenu(false);
          return true;
        default:
          return false;
      }
    },
    [showMenu, selectedIndex]
  );

  // Close menu
  const closeMenu = useCallback(() => {
    setShowMenu(false);
    setMenuFilter("");
    setSelectedIndex(0);
  }, []);

  return {
    showMenu,
    setShowMenu,
    menuFilter,
    selectedIndex,
    setSelectedIndex,
    parseInput,
    getFilteredCommands,
    isCommandMode,
    handleInputChange,
    handleKeyDown,
    closeMenu,
  };
}
