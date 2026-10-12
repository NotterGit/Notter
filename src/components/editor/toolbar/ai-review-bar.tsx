"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Check, X, ArrowUp, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AI_QUICK_REFINEMENTS } from "@/config/const/editor.const";
import type { AiReviewBarProps } from "@/config/types/editor.types";
import { cn } from "@/lib/utils";

export function AiReviewBar({
  isOpen,
  isLoading,
  onAccept,
  onDiscard,
  onRefine,
  modelName,
  providerName,
}: AiReviewBarProps) {
  const [mounted, setMounted] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setRefinePrompt("");
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted || !isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    const trimmed = refinePrompt.trim();
    if (!trimmed || isLoading) return;
    setRefinePrompt("");
    await onRefine(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleQuickChip = (chipText: string) => {
    if (isLoading) return;
    void onRefine(chipText);
  };

  const content = (
    <div
      role="dialog"
      aria-label="Подтверждение текста ИИ"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] sm:w-[560px] md:w-[620px] pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="relative rounded-2xl border border-violet-500/25 bg-background/95 p-3 sm:p-3.5 shadow-2xl backdrop-blur-xl ring-1 ring-violet-500/10 space-y-2.5">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xs shrink-0">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Сгенерировано ИИ
              </span>
              {(modelName || providerName) && (
                <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground truncate max-w-[140px]">
                  {modelName || providerName}
                </span>
              )}
            </div>
            {isLoading && (
              <span className="flex items-center gap-1.5 text-[11px] text-violet-600 dark:text-violet-400 font-medium animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                <span>Исправление…</span>
              </span>
            )}
          </div>

          {/* Action buttons: "Убрать" and "Вставить" */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isLoading}
              onClick={onDiscard}
              title="Удалить сгенерированный текст и вернуть как было"
              className="h-7 px-2.5 text-xs bg-muted/60 hover:bg-muted text-foreground/90 hover:text-foreground border border-border/60 hover:border-border transition-colors gap-1 cursor-pointer font-normal shadow-2xs"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Убрать</span>
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isLoading}
              onClick={onAccept}
              title="Принять и вставить сгенерированный текст в заметку"
              className="h-7 px-3 text-xs gap-1.5 cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-xs transition-all font-medium"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Вставить</span>
            </Button>
          </div>
        </div>

        {/* Refinement Input Row */}
        <div className="relative flex items-center gap-1.5 rounded-xl border border-input/80 bg-muted/40 px-2.5 py-1 focus-within:ring-1 focus-within:ring-violet-500/50 focus-within:border-violet-500/70 transition-all shadow-inner">
          <input
            ref={inputRef}
            type="text"
            disabled={isLoading}
            value={refinePrompt}
            onChange={(e) => setRefinePrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Попросить ИИ исправить... (например: сделай короче, добавь список)"
            className={cn(
              "w-full bg-transparent text-xs py-1 text-foreground placeholder:text-muted-foreground/60 outline-none",
              isLoading && "opacity-60 cursor-not-allowed"
            )}
          />

          <Button
            type="button"
            size="icon"
            disabled={isLoading || !refinePrompt.trim()}
            onClick={() => void handleSubmit()}
            title="Отправить запрос на исправление текста"
            className="h-6 w-6 shrink-0 rounded-lg bg-violet-600 hover:bg-violet-700 text-white cursor-pointer disabled:opacity-30 transition-all"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ArrowUp className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-minimal text-[10px]">
          <span className="text-muted-foreground/60 shrink-0 select-none mr-0.5 font-medium">
            Быстро:
          </span>
          {AI_QUICK_REFINEMENTS.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickChip(chip)}
              className="shrink-0 px-2 py-0.5 rounded-md border border-border/70 bg-background/60 hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-500/40 text-muted-foreground transition-all cursor-pointer disabled:opacity-40"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
