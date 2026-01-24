"use client";

import { useState, useRef, useEffect, KeyboardEvent, forwardRef, useImperativeHandle } from "react";
import { UI_TEXT, AGENT_CONFIG } from "@/lib/constants";
import { useSlashCommands } from "@/hooks/useSlashCommands";
import { SlashCommandMenu } from "./SlashCommandMenu";
import type { AgentType, SlashCommand } from "@/lib/types";

interface ChatInputProps {
  onSend: (message: string, agent: AgentType) => void;
  disabled?: boolean;
}

export interface ChatInputRef {
  focus: () => void;
  selectCommand: (command: SlashCommand) => void;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(function ChatInput(
  { onSend, disabled = false },
  ref
) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<SlashCommand | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    showMenu,
    selectedIndex,
    getFilteredCommands,
    handleInputChange,
    handleKeyDown: handleSlashKeyDown,
    closeMenu,
  } = useSlashCommands();

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    selectCommand: (command: SlashCommand) => {
      setSelectedCommand(command);
      setInput("");
      closeMenu();
      textareaRef.current?.focus();
    },
  }));

  // Auto-focus on mount
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [input]);

  const filteredCommands = getFilteredCommands(input);

  const handleSubmit = () => {
    if (!input.trim() || disabled) return;

    const agent = selectedCommand?.agent || "default";

    if (input.trim()) {
      onSend(input.trim(), agent);
      setInput("");
      // Keep selectedCommand so badge persists for multi-turn conversations
      // User can dismiss via X button or Escape key
      closeMenu();
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleCommandSelect = (command: SlashCommand) => {
    setSelectedCommand(command);
    setInput("");
    closeMenu();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Clear selected command on Escape
    if (e.key === "Escape" && selectedCommand) {
      e.preventDefault();
      setSelectedCommand(null);
      return;
    }

    // First try slash command navigation
    if (handleSlashKeyDown(e, filteredCommands, handleCommandSelect)) {
      return;
    }

    // Then handle Enter to submit
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (value: string) => {
    setInput(value);

    // If user types "/" while a command is selected, clear it and enter command mode
    if (value === "/" && selectedCommand) {
      setSelectedCommand(null);
    }

    handleInputChange(value);
  };

  const canSend = input.trim() && !disabled;

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Slash command menu */}
          <SlashCommandMenu
            commands={filteredCommands}
            selectedIndex={selectedIndex}
            onSelect={handleCommandSelect}
            isVisible={showMenu}
          />

          <div
            className={`relative flex flex-col glass-bubble rounded-2xl border transition-all duration-200 ${
              isFocused
                ? "border-blue-400/50 shadow-lg shadow-blue-500/20"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            {/* Command chip row - appears above input */}
            {selectedCommand && (() => {
              const config = AGENT_CONFIG[selectedCommand.agent];
              return (
                <div className="px-3 pt-2 pb-1">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-medium rounded-full ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
                    <span>{selectedCommand.command.slice(1)}</span>
                    <button
                      onClick={() => setSelectedCommand(null)}
                      className="hover:opacity-70 rounded-full p-0.5 transition-opacity"
                      aria-label="Clear command"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M9 3L3 9M3 3l6 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Input row */}
            <div className="flex items-end gap-3 p-2">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => handleChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={UI_TEXT.inputPlaceholder}
                  disabled={disabled}
                  rows={1}
                  className="w-full resize-none bg-transparent px-3 py-2.5 text-base text-white
                           disabled:text-gray-500
                           placeholder:text-gray-500"
                  style={{
                    minHeight: "44px",
                    maxHeight: "150px",
                  }}
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={!canSend}
                className={`shrink-0 h-11 w-11 rounded-xl flex items-center justify-center
                         transition-all duration-200 ${
                           canSend
                             ? "bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
                             : "bg-white/10 text-gray-500"
                         }`}
                aria-label="Send"
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${
                    canSend ? "translate-x-0.5" : ""
                  }`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <p className="mt-2.5 text-xs text-gray-500 text-center flex items-center justify-center gap-2">
          <span>Type</span>
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-gray-400 font-mono text-[10px]">
            /
          </kbd>
          <span>for commands</span>
          <span className="text-gray-600">|</span>
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-gray-400 font-mono text-[10px]">
            Enter
          </kbd>
          <span>to send</span>
          <span className="text-gray-600">|</span>
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-gray-400 font-mono text-[10px]">
            Shift+Enter
          </kbd>
          <span>for new line</span>
        </p>
      </div>
    </div>
  );
});
