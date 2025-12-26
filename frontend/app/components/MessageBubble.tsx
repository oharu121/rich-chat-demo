"use client";

import type { Message } from "@/lib/types";
import { MayaAvatar, type AvatarState } from "./MayaAvatar";
import { LoadingSpinner } from "./LoadingSpinner";
import { AgentBadge } from "./AgentBadge";

/**
 * Renders message content with simple inline formatting:
 * - Bold **text** → <strong>
 * - Code `text` → <code>
 * Preserves whitespace and line breaks via CSS whitespace-pre-wrap
 */
function renderContent(content: string): React.ReactNode {
  // Combined regex for bold and inline code
  const regex = /(\*\*[^*]+\*\*)|(`[^`]+`)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Bold match - remove ** markers
      const boldText = match[1].slice(2, -2);
      parts.push(
        <strong key={match.index} className="font-semibold">
          {boldText}
        </strong>
      );
    } else if (match[2]) {
      // Code match - remove ` markers
      const codeText = match[2].slice(1, -1);
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono">
          {codeText}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  // Determine avatar state based on message streaming status
  const avatarState: AvatarState = message.isStreaming
    ? message.content
      ? "speaking"
      : "thinking"
    : "idling";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-md shadow-md shadow-blue-500/20 px-5 py-3.5 transition-all duration-200 hover:shadow-lg">
          {/* Agent badge for user message if using a specific agent */}
          {message.agent && message.agent !== "default" && (
            <div className="mb-2 flex justify-end">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-white/20 text-white/90">
                /{message.agent}
              </span>
            </div>
          )}
          <div className="whitespace-pre-wrap break-words leading-relaxed text-white/95">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // Assistant message with avatar
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-3 max-w-[90%]">
        <MayaAvatar state={avatarState} size={56} />
        <div className="bg-white text-gray-800 rounded-2xl rounded-tl-md shadow-md border border-gray-100 px-5 py-3.5 transition-all duration-200 hover:shadow-lg">
          {/* Agent badge */}
          {message.agent && (
            <div className="mb-2">
              <AgentBadge agent={message.agent} />
            </div>
          )}

          {/* Message content */}
          <div className="whitespace-pre-wrap break-words leading-relaxed text-gray-700">
            {renderContent(message.content)}
            {message.isStreaming && (
              <span className="inline-block w-0.5 h-5 ml-1 bg-current animate-typing-cursor rounded-full" />
            )}
          </div>

          {/* Loading indicator */}
          {message.isStreaming && !message.content && (
            <div className="flex items-center gap-3 py-1">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-gray-500">Generating response...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
