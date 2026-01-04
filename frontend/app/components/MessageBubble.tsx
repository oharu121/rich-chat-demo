"use client";

import type { Message, AgentType } from "@/lib/types";
import { MayaAvatar, type AvatarState } from "./MayaAvatar";
import { LoadingSpinner } from "./LoadingSpinner";
import { AgentBadge } from "./AgentBadge";
import { TravelQuestionForm } from "./TravelQuestionForm";
import { TravelQuestionnaire } from "./TravelQuestionnaire";

/**
 * Check if a bracketed text is a citation
 * Handles multiple formats:
 * - Standard: [file.md:10] or [file.md:10-20]
 * - Japanese: [出典: file, X-Y行目]
 */
function isCitation(text: string): boolean {
  // Standard format: [file.md:10] or [file.md:10-20]
  if (/^\[[^\]]+:\d+(-\d+)?\]$/.test(text)) return true;
  // Japanese format with 行目: [出典: file, 121-162行目]
  if (/^\[出典[：:].+\d+.*行目\]$/.test(text)) return true;
  return false;
}

/**
 * Renders message content with simple inline formatting:
 * - Citations [file:10-20] → blue text
 * - Bold **text** → <strong>
 * - Code `text` → <code>
 * Preserves whitespace and line breaks via CSS whitespace-pre-wrap
 */
function renderContent(content: string): React.ReactNode {
  // Combined regex for citations, bold and inline code
  const regex = /(\[[^\]]+\])|(\*\*[^*]+\*\*)|(`[^`]+`)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Citation match
      if (isCitation(match[1])) {
        parts.push(
          <span key={match.index} className="text-blue-600 font-medium">
            {match[1]}
          </span>
        );
      } else {
        // Not a citation, render as plain text
        parts.push(match[1]);
      }
    } else if (match[2]) {
      // Bold match - remove ** markers
      const boldText = match[2].slice(2, -2);
      parts.push(
        <strong key={match.index} className="font-semibold">
          {boldText}
        </strong>
      );
    } else if (match[3]) {
      // Code match - remove ` markers
      const codeText = match[3].slice(1, -1);
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
  statusMessage?: string | null;
  onQuestionSubmit?: (answers: Record<string, string | string[]>, context: Record<string, unknown>, agent: AgentType) => void;
}

export function MessageBubble({ message, statusMessage, onQuestionSubmit }: MessageBubbleProps) {
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
          <div className="whitespace-pre-wrap wrap-break-word leading-relaxed text-white/95">
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
          <div className="whitespace-pre-wrap wrap-break-word leading-relaxed text-gray-700">
            {renderContent(message.content)}
            {message.isStreaming && (
              <span className="inline-block w-0.5 h-5 ml-1 bg-current animate-typing-cursor rounded-full" />
            )}
          </div>

          {/* Loading indicator with status */}
          {message.isStreaming && !message.content && (
            <div className="flex items-center gap-3 py-1">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-gray-500">
                {statusMessage || "Generating response..."}
              </span>
            </div>
          )}
          {/* Status bubble when streaming with content */}
          {message.isStreaming && message.content && statusMessage && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-gray-500">{statusMessage}</span>
            </div>
          )}

          {/* Sources from web search */}
          {message.sources && message.sources.length > 0 && !message.isStreaming && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2">Sources:</div>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {source.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Multi-step questionnaire (new Claude Code style) */}
          {message.questionnaire && message.questionnaire.steps.length > 0 && !message.isStreaming && (
            <div className="mt-3">
              <TravelQuestionnaire
                questionnaire={message.questionnaire}
                onSubmit={(answers, context) => {
                  if (onQuestionSubmit && message.agent) {
                    onQuestionSubmit(answers, context, message.agent);
                  }
                }}
              />
            </div>
          )}

          {/* Legacy travel questions form */}
          {message.questions && message.questions.length > 0 && !message.questionnaire && !message.isStreaming && (
            <div className="mt-3">
              <TravelQuestionForm
                questions={message.questions}
                onSubmit={(answers) => {
                  if (onQuestionSubmit && message.agent) {
                    onQuestionSubmit(answers, {}, message.agent);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
