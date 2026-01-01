import { describe, it, expect, vi } from "vitest";
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

      expect(commands.length).toBe(5); // code, search, explain, help, rag
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

    it("should set menu filter when in command mode", () => {
      const { result } = renderHook(() => useSlashCommands());

      act(() => {
        result.current.handleInputChange("/cod");
      });

      expect(result.current.menuFilter).toBe("/cod");
    });

    it("should reset menu filter when not in command mode", () => {
      const { result } = renderHook(() => useSlashCommands());

      act(() => {
        result.current.handleInputChange("/cod");
      });
      act(() => {
        result.current.handleInputChange("hello");
      });

      expect(result.current.menuFilter).toBe("");
    });

    it("should clamp selectedIndex when filtered commands shrink", () => {
      const { result } = renderHook(() => useSlashCommands());

      // Start with all commands visible, select index 4
      act(() => {
        result.current.handleInputChange("/");
        result.current.setSelectedIndex(4);
      });

      // Filter to fewer commands
      act(() => {
        result.current.handleInputChange("/code");
      });

      // Index should be clamped
      expect(result.current.selectedIndex).toBeLessThanOrEqual(
        result.current.getFilteredCommands("/code").length - 1
      );
    });
  });

  describe("handleKeyDown", () => {
    const createKeyboardEvent = (key: string): React.KeyboardEvent => {
      return {
        key,
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;
    };

    it("should return false when menu is not shown", () => {
      const { result } = renderHook(() => useSlashCommands());
      const onSelect = vi.fn();

      const handled = result.current.handleKeyDown(
        createKeyboardEvent("ArrowDown"),
        [],
        onSelect
      );

      expect(handled).toBe(false);
    });

    it("should return false when filtered commands is empty", () => {
      const { result } = renderHook(() => useSlashCommands());
      const onSelect = vi.fn();

      act(() => {
        result.current.handleInputChange("/");
      });

      const handled = result.current.handleKeyDown(
        createKeyboardEvent("ArrowDown"),
        [],
        onSelect
      );

      expect(handled).toBe(false);
    });

    it("should navigate down with ArrowDown", () => {
      const { result } = renderHook(() => useSlashCommands());
      const onSelect = vi.fn();
      const commands = result.current.getFilteredCommands("");

      act(() => {
        result.current.handleInputChange("/");
      });

      const event = createKeyboardEvent("ArrowDown");
      act(() => {
        result.current.handleKeyDown(event, commands, onSelect);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.selectedIndex).toBe(1);
    });

    it("should wrap around when navigating down past last item", () => {
      const { result } = renderHook(() => useSlashCommands());
      const onSelect = vi.fn();
      const commands = result.current.getFilteredCommands("");

      act(() => {
        result.current.handleInputChange("/");
        result.current.setSelectedIndex(commands.length - 1);
      });

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"), commands, onSelect);
      });

      expect(result.current.selectedIndex).toBe(0);
    });

    it("should navigate up with ArrowUp", () => {
      const { result } = renderHook(() => useSlashCommands());
      const onSelect = vi.fn();
      const commands = result.current.getFilteredCommands("");

      act(() => {
        result.current.handleInputChange("/");
        result.current.setSelectedIndex(2);
      });

      const event = createKeyboardEvent("ArrowUp");
      act(() => {
        result.current.handleKeyDown(event, commands, onSelect);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.selectedIndex).toBe(1);
    });

    it("should wrap around when navigating up past first item", () => {
      const { result } = renderHook(() => useSlashCommands());
      const onSelect = vi.fn();
      const commands = result.current.getFilteredCommands("");

      act(() => {
        result.current.handleInputChange("/");
        result.current.setSelectedIndex(0);
      });

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowUp"), commands, onSelect);
      });

      expect(result.current.selectedIndex).toBe(commands.length - 1);
    });

    it("should select command with Tab", () => {
      const { result } = renderHook(() => useSlashCommands());
      const onSelect = vi.fn();
      const commands = result.current.getFilteredCommands("");

      act(() => {
        result.current.handleInputChange("/");
      });

      const event = createKeyboardEvent("Tab");
      act(() => {
        result.current.handleKeyDown(event, commands, onSelect);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onSelect).toHaveBeenCalledWith(commands[0]);
    });

    it("should select command with Enter", () => {
      const { result } = renderHook(() => useSlashCommands());
      const onSelect = vi.fn();
      const commands = result.current.getFilteredCommands("");

      act(() => {
        result.current.handleInputChange("/");
        result.current.setSelectedIndex(1);
      });

      const event = createKeyboardEvent("Enter");
      act(() => {
        result.current.handleKeyDown(event, commands, onSelect);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onSelect).toHaveBeenCalledWith(commands[1]);
    });

    it("should close menu with Escape", () => {
      const { result } = renderHook(() => useSlashCommands());
      const onSelect = vi.fn();
      const commands = result.current.getFilteredCommands("");

      act(() => {
        result.current.handleInputChange("/");
      });

      expect(result.current.showMenu).toBe(true);

      const event = createKeyboardEvent("Escape");
      act(() => {
        result.current.handleKeyDown(event, commands, onSelect);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.showMenu).toBe(false);
    });

    it("should return false for unhandled keys", () => {
      const { result } = renderHook(() => useSlashCommands());
      const onSelect = vi.fn();
      const commands = result.current.getFilteredCommands("");

      act(() => {
        result.current.handleInputChange("/");
      });

      const handled = result.current.handleKeyDown(
        createKeyboardEvent("a"),
        commands,
        onSelect
      );

      expect(handled).toBe(false);
    });
  });

  describe("closeMenu", () => {
    it("should close menu and reset state", () => {
      const { result } = renderHook(() => useSlashCommands());

      act(() => {
        result.current.handleInputChange("/cod");
        result.current.setSelectedIndex(2);
      });

      expect(result.current.showMenu).toBe(true);
      expect(result.current.menuFilter).toBe("/cod");

      act(() => {
        result.current.closeMenu();
      });

      expect(result.current.showMenu).toBe(false);
      expect(result.current.menuFilter).toBe("");
      expect(result.current.selectedIndex).toBe(0);
    });
  });
});
