"use client";

import { useState } from "react";
import type { TravelQuestion } from "@/lib/types";

interface TravelQuestionFormProps {
  questions: TravelQuestion[];
  onSubmit: (answers: Record<string, string | string[]>) => void;
}

export function TravelQuestionForm({ questions, onSubmit }: TravelQuestionFormProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const handleOptionClick = (questionId: string, value: string, multiSelect: boolean) => {
    if (multiSelect) {
      const current = (answers[questionId] as string[]) || [];
      if (current.includes(value)) {
        setAnswers({ ...answers, [questionId]: current.filter((v) => v !== value) });
      } else {
        setAnswers({ ...answers, [questionId]: [...current, value] });
      }
    } else {
      setAnswers({ ...answers, [questionId]: value });
    }
  };

  const handleCustomInput = (questionId: string, value: string) => {
    setCustomInputs({ ...customInputs, [questionId]: value });
    if (value.trim()) {
      setAnswers({ ...answers, [questionId]: value });
    }
  };

  const isSelected = (questionId: string, value: string): boolean => {
    const answer = answers[questionId];
    if (Array.isArray(answer)) {
      return answer.includes(value);
    }
    return answer === value;
  };

  const handleSubmit = () => {
    // Merge custom inputs with selected answers
    const finalAnswers = { ...answers };
    for (const [key, value] of Object.entries(customInputs)) {
      if (value.trim() && !finalAnswers[key]) {
        finalAnswers[key] = value;
      }
    }
    onSubmit(finalAnswers);
  };

  const hasAnswers = Object.keys(answers).length > 0 ||
    Object.values(customInputs).some(v => v.trim());

  return (
    <div className="space-y-4 p-4 bg-rose-50 rounded-lg border border-rose-200">
      <div className="text-sm text-rose-700 font-medium mb-2">
        Help me plan your perfect trip:
      </div>

      {questions.map((q) => (
        <div key={q.id} className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {q.question}
            {q.multiSelect && (
              <span className="text-gray-400 font-normal ml-1">(select multiple)</span>
            )}
          </label>

          <div className="flex flex-wrap gap-2">
            {q.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleOptionClick(q.id, opt.value, q.multiSelect)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all duration-150
                  ${isSelected(q.id, opt.value)
                    ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                    : "bg-white text-gray-700 border-gray-300 hover:border-rose-300 hover:bg-rose-50"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {q.allowCustom && (
            <input
              type="text"
              placeholder="Other..."
              value={customInputs[q.id] || ""}
              onChange={(e) => handleCustomInput(q.id, e.target.value)}
              className="mt-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
            />
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!hasAnswers}
        className={`mt-4 w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-150
          ${hasAnswers
            ? "bg-rose-500 text-white hover:bg-rose-600 shadow-sm"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
      >
        Plan My Trip
      </button>
    </div>
  );
}
