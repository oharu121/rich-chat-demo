import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentBadge } from "@/app/components/AgentBadge";
import { LoadingSpinner } from "@/app/components/LoadingSpinner";
import { MayaAvatar } from "@/app/components/MayaAvatar";
import { SlashCommandMenu } from "@/app/components/SlashCommandMenu";
import { MessageBubble } from "@/app/components/MessageBubble";
import type { SlashCommand, Message } from "@/lib/types";

describe("AgentBadge", () => {
  it("renders default agent badge", () => {
    render(<AgentBadge agent="default" />);
    expect(screen.getByText("Assistant")).toBeInTheDocument();
  });

  it("renders code agent badge", () => {
    render(<AgentBadge agent="code" />);
    expect(screen.getByText("Code")).toBeInTheDocument();
  });

  it("renders search agent badge", () => {
    render(<AgentBadge agent="search" />);
    expect(screen.getByText("Search")).toBeInTheDocument();
  });

  it("renders explain agent badge", () => {
    render(<AgentBadge agent="explain" />);
    expect(screen.getByText("Explain")).toBeInTheDocument();
  });

  it("renders help agent badge", () => {
    render(<AgentBadge agent="help" />);
    expect(screen.getByText("Help")).toBeInTheDocument();
  });

  it("renders rag agent badge", () => {
    render(<AgentBadge agent="rag" />);
    expect(screen.getByText("RAG")).toBeInTheDocument();
  });

  it("applies small size classes by default", () => {
    const { container } = render(<AgentBadge agent="code" />);
    const badge = container.querySelector("span");
    expect(badge?.className).toContain("px-2");
    expect(badge?.className).toContain("text-xs");
  });

  it("applies medium size classes when specified", () => {
    const { container } = render(<AgentBadge agent="code" size="md" />);
    const badge = container.querySelector("span");
    expect(badge?.className).toContain("px-3");
    expect(badge?.className).toContain("text-sm");
  });
});

describe("LoadingSpinner", () => {
  it("renders with default size", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
    expect(spinner.className).toContain("w-6");
    expect(spinner.className).toContain("h-6");
  });

  it("renders with small size", () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByRole("status");
    expect(spinner.className).toContain("w-4");
    expect(spinner.className).toContain("h-4");
  });

  it("renders with large size", () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByRole("status");
    expect(spinner.className).toContain("w-8");
    expect(spinner.className).toContain("h-8");
  });

  it("applies custom className", () => {
    render(<LoadingSpinner className="custom-class" />);
    const spinner = screen.getByRole("status");
    expect(spinner.className).toContain("custom-class");
  });

  it("has accessible label", () => {
    render(<LoadingSpinner />);
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });
});

describe("MayaAvatar", () => {
  it("renders idling state", () => {
    render(<MayaAvatar state="idling" />);
    const img = screen.getByAltText("Maya idling");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/avatars/maya-idling.gif");
  });

  it("renders speaking state", () => {
    render(<MayaAvatar state="speaking" />);
    const img = screen.getByAltText("Maya speaking");
    expect(img).toHaveAttribute("src", "/avatars/maya-speaking.gif");
  });

  it("renders thinking state", () => {
    render(<MayaAvatar state="thinking" />);
    const img = screen.getByAltText("Maya thinking");
    expect(img).toHaveAttribute("src", "/avatars/maya-thinking.gif");
  });

  it("applies default size", () => {
    const { container } = render(<MayaAvatar state="idling" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe("64px");
    expect(wrapper.style.height).toBe("64px");
  });

  it("applies custom size", () => {
    const { container } = render(<MayaAvatar state="idling" size={48} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe("48px");
    expect(wrapper.style.height).toBe("48px");
  });
});

describe("SlashCommandMenu", () => {
  const mockCommands: SlashCommand[] = [
    { command: "/code", agent: "code", description: "Code assistance", icon: "code" },
    { command: "/search", agent: "search", description: "Web search", icon: "search" },
    { command: "/explain", agent: "explain", description: "Explain concepts", icon: "book" },
  ];

  it("renders nothing when not visible", () => {
    const { container } = render(
      <SlashCommandMenu
        commands={mockCommands}
        selectedIndex={0}
        onSelect={() => {}}
        isVisible={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when commands array is empty", () => {
    const { container } = render(
      <SlashCommandMenu
        commands={[]}
        selectedIndex={0}
        onSelect={() => {}}
        isVisible={true}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders all commands when visible", () => {
    render(
      <SlashCommandMenu
        commands={mockCommands}
        selectedIndex={0}
        onSelect={() => {}}
        isVisible={true}
      />
    );

    expect(screen.getByText("/code")).toBeInTheDocument();
    expect(screen.getByText("/search")).toBeInTheDocument();
    expect(screen.getByText("/explain")).toBeInTheDocument();
  });

  it("renders command descriptions", () => {
    render(
      <SlashCommandMenu
        commands={mockCommands}
        selectedIndex={0}
        onSelect={() => {}}
        isVisible={true}
      />
    );

    expect(screen.getByText("Code assistance")).toBeInTheDocument();
    expect(screen.getByText("Web search")).toBeInTheDocument();
    expect(screen.getByText("Explain concepts")).toBeInTheDocument();
  });

  it("highlights selected command", () => {
    render(
      <SlashCommandMenu
        commands={mockCommands}
        selectedIndex={1}
        onSelect={() => {}}
        isVisible={true}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[1].className).toContain("bg-blue-50");
  });

  it("shows Tab hint for selected command", () => {
    render(
      <SlashCommandMenu
        commands={mockCommands}
        selectedIndex={0}
        onSelect={() => {}}
        isVisible={true}
      />
    );

    expect(screen.getByText("Tab")).toBeInTheDocument();
  });

  it("calls onSelect when command is clicked", () => {
    const onSelect = vi.fn();
    render(
      <SlashCommandMenu
        commands={mockCommands}
        selectedIndex={0}
        onSelect={onSelect}
        isVisible={true}
      />
    );

    fireEvent.click(screen.getByText("/search"));
    expect(onSelect).toHaveBeenCalledWith(mockCommands[1]);
  });

  it("renders header text", () => {
    render(
      <SlashCommandMenu
        commands={mockCommands}
        selectedIndex={0}
        onSelect={() => {}}
        isVisible={true}
      />
    );

    expect(screen.getByText("Slash Commands")).toBeInTheDocument();
  });
});

describe("MessageBubble", () => {
  const createMessage = (overrides: Partial<Message> = {}): Message => ({
    id: "test-id",
    role: "assistant",
    content: "Hello, how can I help?",
    timestamp: new Date(),
    ...overrides,
  });

  describe("User messages", () => {
    it("renders user message content", () => {
      const message = createMessage({ role: "user", content: "Hi there!" });
      render(<MessageBubble message={message} />);
      expect(screen.getByText("Hi there!")).toBeInTheDocument();
    });

    it("shows agent tag for non-default agent", () => {
      const message = createMessage({ role: "user", content: "Help", agent: "code" });
      render(<MessageBubble message={message} />);
      expect(screen.getByText("/code")).toBeInTheDocument();
    });

    it("does not show agent tag for default agent", () => {
      const message = createMessage({ role: "user", content: "Help", agent: "default" });
      render(<MessageBubble message={message} />);
      expect(screen.queryByText("/default")).not.toBeInTheDocument();
    });
  });

  describe("Assistant messages", () => {
    it("renders assistant message content", () => {
      const message = createMessage({ content: "Hello!" });
      render(<MessageBubble message={message} />);
      expect(screen.getByText("Hello!")).toBeInTheDocument();
    });

    it("renders agent badge", () => {
      const message = createMessage({ agent: "code" });
      render(<MessageBubble message={message} />);
      expect(screen.getByText("Code")).toBeInTheDocument();
    });

    it("renders MayaAvatar with idling state for completed message", () => {
      const message = createMessage({ isStreaming: false });
      render(<MessageBubble message={message} />);
      expect(screen.getByAltText("Maya idling")).toBeInTheDocument();
    });

    it("renders MayaAvatar with speaking state when streaming with content", () => {
      const message = createMessage({ isStreaming: true, content: "Typing..." });
      render(<MessageBubble message={message} />);
      expect(screen.getByAltText("Maya speaking")).toBeInTheDocument();
    });

    it("renders MayaAvatar with thinking state when streaming without content", () => {
      const message = createMessage({ isStreaming: true, content: "" });
      render(<MessageBubble message={message} />);
      expect(screen.getByAltText("Maya thinking")).toBeInTheDocument();
    });

    it("shows loading spinner when streaming without content", () => {
      const message = createMessage({ isStreaming: true, content: "" });
      render(<MessageBubble message={message} />);
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText("Generating response...")).toBeInTheDocument();
    });

    it("shows custom status message when provided", () => {
      const message = createMessage({ isStreaming: true, content: "" });
      render(<MessageBubble message={message} statusMessage="Searching the web..." />);
      expect(screen.getByText("Searching the web...")).toBeInTheDocument();
    });

    it("shows status bubble when streaming with content and status", () => {
      const message = createMessage({ isStreaming: true, content: "Some content" });
      render(<MessageBubble message={message} statusMessage="Reading results..." />);
      expect(screen.getByText("Reading results...")).toBeInTheDocument();
    });
  });

  describe("Content formatting", () => {
    it("renders bold text", () => {
      const message = createMessage({ content: "This is **bold** text" });
      render(<MessageBubble message={message} />);
      const strong = screen.getByText("bold");
      expect(strong.tagName).toBe("STRONG");
    });

    it("renders inline code", () => {
      const message = createMessage({ content: "Use `console.log()` for debugging" });
      render(<MessageBubble message={message} />);
      const code = screen.getByText("console.log()");
      expect(code.tagName).toBe("CODE");
    });

    it("renders mixed formatting", () => {
      const message = createMessage({ content: "**Bold** and `code`" });
      render(<MessageBubble message={message} />);
      expect(screen.getByText("Bold").tagName).toBe("STRONG");
      expect(screen.getByText("code").tagName).toBe("CODE");
    });
  });

  describe("Sources", () => {
    it("renders sources when present and not streaming", () => {
      const message = createMessage({
        isStreaming: false,
        sources: [
          { title: "Source 1", url: "https://example.com/1" },
          { title: "Source 2", url: "https://example.com/2" },
        ],
      });
      render(<MessageBubble message={message} />);

      expect(screen.getByText("Sources:")).toBeInTheDocument();
      expect(screen.getByText("Source 1")).toBeInTheDocument();
      expect(screen.getByText("Source 2")).toBeInTheDocument();
    });

    it("source links have correct href", () => {
      const message = createMessage({
        isStreaming: false,
        sources: [{ title: "Example", url: "https://example.com" }],
      });
      render(<MessageBubble message={message} />);

      const link = screen.getByText("Example").closest("a");
      expect(link).toHaveAttribute("href", "https://example.com");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("does not render sources when streaming", () => {
      const message = createMessage({
        isStreaming: true,
        content: "Loading...",
        sources: [{ title: "Source", url: "https://example.com" }],
      });
      render(<MessageBubble message={message} />);

      expect(screen.queryByText("Sources:")).not.toBeInTheDocument();
    });

    it("does not render sources section when empty", () => {
      const message = createMessage({ isStreaming: false, sources: [] });
      render(<MessageBubble message={message} />);

      expect(screen.queryByText("Sources:")).not.toBeInTheDocument();
    });
  });
});
