import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSlashCommands } from "@/hooks/useSlashCommands";

describe("useSlashCommands", () => {
  describe("parseInput", () => {
    it("should return default agent for plain text", () => {
      const { result } = renderHook(() => useSlashCommands());

      const parsed = result.current.parseInput("hello world");

      expect(parsed.command).toBeNull();
      expect(parsed.message).toBe("hello world");
      expect(parsed.agent).toBe("default");
    });

    it("should parse /code command", () => {
      const { result } = renderHook(() => useSlashCommands());

      const parsed = result.current.parseInput("/code write a function");

      expect(parsed.command?.command).toBe("/code");
      expect(parsed.message).toBe("write a function");
      expect(parsed.agent).toBe("code");
    });

    it("should parse /search command", () => {
      const { result } = renderHook(() => useSlashCommands());

      const parsed = result.current.parseInput("/search latest news");

      expect(parsed.command?.command).toBe("/search");
      expect(parsed.message).toBe("latest news");
      expect(parsed.agent).toBe("search");
    });

    it("should parse /explain command", () => {
      const { result } = renderHook(() => useSlashCommands());

      const parsed = result.current.parseInput("/explain quantum computing");

      expect(parsed.command?.command).toBe("/explain");
      expect(parsed.message).toBe("quantum computing");
      expect(parsed.agent).toBe("explain");
    });

    it("should handle command without message", () => {
      const { result } = renderHook(() => useSlashCommands());

      const parsed = result.current.parseInput("/code");

      expect(parsed.command?.command).toBe("/code");
      expect(parsed.message).toBe("");
      expect(parsed.agent).toBe("code");
    });

    it("should return default for unknown command", () => {
      const { result } = renderHook(() => useSlashCommands());

      const parsed = result.current.parseInput("/unknown test");

      expect(parsed.command).toBeNull();
      expect(parsed.message).toBe("/unknown test");
      expect(parsed.agent).toBe("default");
    });
  });

  describe("getFilteredCommands", () => {
    it("should return all commands when filter is empty", () => {
      const { result } = renderHook(() => useSlashCommands());

      const commands = result.current.getFilteredCommands("");

      expect(commands.length).toBe(4); // code, search, explain, help
    });

    it("should filter commands by partial match", () => {
      const { result } = renderHook(() => useSlashCommands());

      const commands = result.current.getFilteredCommands("/cod");

      expect(commands.some((c) => c.command === "/code")).toBe(true);
    });

    it("should filter commands by description", () => {
      const { result } = renderHook(() => useSlashCommands());

      const commands = result.current.getFilteredCommands("/search");

      expect(commands.some((c) => c.command === "/search")).toBe(true);
    });
  });

  describe("isCommandMode", () => {
    it("should return true when input starts with /", () => {
      const { result } = renderHook(() => useSlashCommands());

      expect(result.current.isCommandMode("/")).toBe(true);
      expect(result.current.isCommandMode("/co")).toBe(true);
    });

    it("should return false when input has space after command", () => {
      const { result } = renderHook(() => useSlashCommands());

      expect(result.current.isCommandMode("/code hello")).toBe(false);
    });

    it("should return false for plain text", () => {
      const { result } = renderHook(() => useSlashCommands());

      expect(result.current.isCommandMode("hello")).toBe(false);
    });
  });

  describe("handleInputChange", () => {
    it("should show menu when typing /", () => {
      const { result } = renderHook(() => useSlashCommands());

      act(() => {
        result.current.handleInputChange("/");
      });

      expect(result.current.showMenu).toBe(true);
    });

    it("should hide menu when input has space", () => {
      const { result } = renderHook(() => useSlashCommands());

      act(() => {
        result.current.handleInputChange("/code ");
      });

      expect(result.current.showMenu).toBe(false);
    });
  });
});
