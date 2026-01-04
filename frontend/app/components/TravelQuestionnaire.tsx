"use client";

import { useState, useCallback } from "react";
import type { Questionnaire } from "@/lib/types";

interface TravelQuestionnaireProps {
  questionnaire: Questionnaire;
  onSubmit: (answers: Record<string, string | string[]>, context: Record<string, unknown>) => void;
}

/**
 * Multi-step questionnaire component inspired by Claude Code's AskUserQuestion UI.
 *
 * Features:
 * - Progress indicator showing current step
 * - Auto-advance on single-select questions
 * - "Continue" button for multi-select questions
 * - "Other" text input for custom answers
 * - Back navigation between steps
 */
export function TravelQuestionnaire({ questionnaire, onSubmit }: TravelQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const { title, steps } = questionnaire;
  const totalSteps = steps.length;
  const currentQuestion = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  const handleOptionClick = useCallback((questionId: string, value: string, multiSelect: boolean) => {
    if (multiSelect) {
      // Toggle selection for multi-select
      const current = (answers[questionId] as string[]) || [];
      if (current.includes(value)) {
        setAnswers({ ...answers, [questionId]: current.filter((v) => v !== value) });
      } else {
        setAnswers({ ...answers, [questionId]: [...current, value] });
      }
    } else {
      // Single select - set answer and auto-advance
      setAnswers({ ...answers, [questionId]: value });
      // Clear custom input when option is selected
      if (customInputs[questionId]) {
        setCustomInputs({ ...customInputs, [questionId]: "" });
      }
      // Auto-advance to next step or submit on last step
      setTimeout(() => {
        if (isLastStep) {
          handleSubmit({ ...answers, [questionId]: value });
        } else {
          setCurrentStep((prev) => prev + 1);
        }
      }, 150);
    }
  }, [answers, customInputs, isLastStep]);

  const handleCustomInput = useCallback((questionId: string, value: string) => {
    setCustomInputs({ ...customInputs, [questionId]: value });
    // Set custom value as the answer
    if (value.trim()) {
      setAnswers({ ...answers, [questionId]: value.trim() });
    }
  }, [answers, customInputs]);

  const isSelected = useCallback((questionId: string, value: string): boolean => {
    const answer = answers[questionId];
    if (Array.isArray(answer)) {
      return answer.includes(value);
    }
    return answer === value;
  }, [answers]);

  const handleContinue = useCallback(() => {
    if (isLastStep) {
      handleSubmit(answers);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, answers]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback((finalAnswers: Record<string, string | string[]>) => {
    // Merge custom inputs
    const merged = { ...finalAnswers };
    for (const [key, value] of Object.entries(customInputs)) {
      if (value.trim() && !merged[key]) {
        merged[key] = value.trim();
      }
    }
    // Pass both answers and existing context from questionnaire
    onSubmit(merged, questionnaire.context);
  }, [customInputs, onSubmit, questionnaire.context]);

  const hasCurrentAnswer = Boolean(
    answers[currentQuestion.id] ||
    (customInputs[currentQuestion.id] && customInputs[currentQuestion.id].trim())
  );

  return (
    <div className="bg-rose-50 rounded-lg border border-rose-200 overflow-hidden">
      {/* Header with title and progress */}
      <div className="bg-rose-100 px-4 py-3 border-b border-rose-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-rose-800">{title}</span>
          <span className="text-xs text-rose-600">
            {currentStep + 1} of {totalSteps}
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 bg-rose-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-rose-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Question content */}
      <div className="p-4">
        {/* Header label */}
        <div className="mb-2">
          <span className="inline-block px-2 py-0.5 text-xs font-medium text-rose-700 bg-rose-100 rounded">
            {currentQuestion.header}
          </span>
        </div>

        {/* Question text */}
        <p className="text-sm font-medium text-gray-700 mb-3">
          {currentQuestion.question}
          {currentQuestion.multiSelect && (
            <span className="text-gray-400 font-normal ml-1">(select multiple)</span>
          )}
        </p>

        {/* Options - Claude Code style cards with visible descriptions */}
        <div className="space-y-2 mb-3">
          {currentQuestion.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleOptionClick(currentQuestion.id, opt.value, currentQuestion.multiSelect)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-150
                ${isSelected(currentQuestion.id, opt.value)
                  ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                  : "bg-white text-gray-700 border-gray-200 hover:border-rose-300 hover:bg-rose-50"
                }`}
            >
              <div className="font-medium text-sm">{opt.label}</div>
              {opt.description && (
                <div className={`text-xs mt-0.5 ${isSelected(currentQuestion.id, opt.value) ? "text-rose-100" : "text-gray-500"}`}>
                  {opt.description}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Custom input */}
        {currentQuestion.allowCustom && (
          <input
            type="text"
            placeholder="Other..."
            value={customInputs[currentQuestion.id] || ""}
            onChange={(e) => handleCustomInput(currentQuestion.id, e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
          />
        )}
      </div>

      {/* Navigation footer */}
      <div className="px-4 py-3 bg-rose-50 border-t border-rose-100 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`text-sm px-3 py-1.5 rounded transition-colors
            ${currentStep === 0
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:text-gray-800 hover:bg-rose-100"
            }`}
        >
          Back
        </button>

        {/* Continue/Submit button (only for multi-select or custom input) */}
        {(currentQuestion.multiSelect || currentQuestion.allowCustom) && (
          <button
            type="button"
            onClick={handleContinue}
            disabled={!hasCurrentAnswer}
            className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-all duration-150
              ${hasCurrentAnswer
                ? "bg-rose-500 text-white hover:bg-rose-600 shadow-sm"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            {isLastStep ? "Plan My Trip" : "Continue"}
          </button>
        )}
      </div>
    </div>
  );
}
