"use client";

import { useState, useRef, useEffect, KeyboardEvent, forwardRef, useImperativeHandle } from "react";
import { UI_TEXT } from "@/lib/constants";
import { useSlashCommands } from "@/hooks/useSlashCommands";
import { SlashCommandMenu } from "./SlashCommandMenu";
import type { AgentType, SlashCommand } from "@/lib/types";

interface ChatInputProps {
  onSend: (message: string, agent: AgentType) => void;
  disabled?: boolean;
}

export interface ChatInputRef {
  focus: () => void;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(function ChatInput(
  { onSend, disabled = false },
  ref
) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    showMenu,
    selectedIndex,
    parseInput,
    getFilteredCommands,
    handleInputChange,
    handleKeyDown: handleSlashKeyDown,
    closeMenu,
  } = useSlashCommands();

  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
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

    const { message, agent } = parseInput(input);
    const finalMessage = message || input;

    if (finalMessage.trim()) {
      onSend(finalMessage.trim(), agent);
      setInput("");
      closeMenu();
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleCommandSelect = (command: SlashCommand) => {
    setInput(command.command + " ");
    closeMenu();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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
    handleInputChange(value);
  };

  const canSend = input.trim() && !disabled;

  // Parse current input to show active command
  const { command: activeCommand } = parseInput(input);

  return (
    <div className="glass border-t border-white/20 p-4 shadow-lg shadow-gray-200/50">
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
            className={`relative flex items-end gap-3 p-2 bg-white rounded-2xl border-2 transition-all duration-200 ${
              isFocused
                ? "border-blue-400 shadow-lg shadow-blue-100/50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {/* Active command indicator */}
            {activeCommand && (
              <div className="absolute -top-3 left-4 px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                {activeCommand.command}
              </div>
            )}

            <div className="flex-1 relative">
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
                className="w-full resize-none bg-transparent px-3 py-2.5 text-base
                         disabled:text-gray-400
                         placeholder:text-gray-400"
                style={{ minHeight: "44px", maxHeight: "150px" }}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSend}
              className={`shrink-0 h-11 w-11 rounded-xl flex items-center justify-center
                       transition-all duration-200 ${
                         canSend
                           ? "bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
                           : "bg-gray-100 text-gray-400"
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
        <p className="mt-2.5 text-xs text-gray-400 text-center flex items-center justify-center gap-2">
          <span>Type</span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-[10px]">
            /
          </kbd>
          <span>for commands</span>
          <span className="text-gray-300">|</span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-[10px]">
            Enter
          </kbd>
          <span>to send</span>
          <span className="text-gray-300">|</span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-[10px]">
            Shift+Enter
          </kbd>
          <span>for new line</span>
        </p>
      </div>
    </div>
  );
});
