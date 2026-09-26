"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { type Editor } from "@tiptap/react";
import { Sparkles, Loader2, Cpu, Settings2 } from "lucide-react";
import toast from "react-hot-toast";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAiSettings } from "@/components/hooks/use-ai-settings";
import { useQualAiLimits } from "@/components/hooks/use-qualai-limits";
import { useSettings } from "@/components/hooks/use-settings";
import { AI_PROVIDERS } from "@/config/ai-providers";
import { AiProviderId } from "@/config/types/ai.types";
import { generateAiText } from "@/lib/ai/generate";
import { cn } from "@/lib/utils";
import { markdownToEditorHtml } from "@/lib/editor/markdown-to-html";
import { getAiGeneratingPos, setAiGenerating } from "../extensions/ai-indicator";

interface AiGeneratePopoverProps {
  editor: Editor | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectionBackupRef: React.MutableRefObject<{ from: number; to: number } | null>;
  children: React.ReactNode;
}

export function AiGeneratePopover({
  editor,
  isOpen,
  setIsOpen,
  selectionBackupRef,
  children,
}: AiGeneratePopoverProps) {
  const { activeProviderId, providers, systemPrompt } = useAiSettings();
  const settingsModal = useSettings();
  const { limits: qualAiLimits, refresh: refreshQualAiLimits, workspaceId, isOrg } = useQualAiLimits();

  const [selectedProviderId, setSelectedProviderId] = useState<AiProviderId>(activeProviderId);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [customModelMode, setCustomModelMode] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const generatingTargetPosRef = useRef<{ from: number; to: number } | null>(null);
  const initializedRef = useRef<boolean>(false);

  // Initialize model/provider once per open, without clearing existing prompt or interrupting loading
  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false;
      return;
    }
    void refreshQualAiLimits();
    if (isLoading) return;
    if (initializedRef.current) return;

    initializedRef.current = true;

    setSelectedProviderId(activeProviderId);
    const prov = providers[activeProviderId];
    const model =
      prov?.selectedModel ||
      (Array.isArray(prov?.models) && prov.models[0]) ||
      "";
    setSelectedModel(model);
    setCustomModelMode(!prov?.models?.length);
  }, [isOpen, isLoading, activeProviderId, providers, refreshQualAiLimits]);

  // Clean up if component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (editor && !editor.isDestroyed) {
        setAiGenerating(editor, false);
      }
    };
  }, [editor]);

  const handleProviderSelect = (id: AiProviderId) => {
    if (isLoading) return;
    setSelectedProviderId(id);
    const prov = providers[id];
    const model =
      prov?.selectedModel ||
      (Array.isArray(prov?.models) && prov.models[0]) ||
      "";
    setSelectedModel(model);
    setCustomModelMode(!prov?.models?.length);
  };

  const currentProviderConfig = providers[selectedProviderId];
  const currentMeta = AI_PROVIDERS[selectedProviderId];
  const availableModels = Array.isArray(currentProviderConfig?.models)
    ? currentProviderConfig.models.filter(Boolean)
    : [];

  const isCloudWithoutKey =
    selectedProviderId !== "custom" &&
    currentMeta.requiresKey !== false &&
    !currentProviderConfig?.apiKey?.trim();

  const handleCancel = () => {
    if (isLoading) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setAiGenerating(editor, false);
      setIsLoading(false);
      generatingTargetPosRef.current = null;
      abortControllerRef.current = null;
    } else {
      setIsOpen(false);
    }
  };

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      toast.error("Введите промпт");
      return;
    }

    if (!selectedModel.trim()) {
      toast.error("Выберите модель");
      return;
    }

    if (isCloudWithoutKey) {
      toast.error(`Укажите API ключ для ${currentMeta.name} в настройках`);
      return;
    }

    if (selectedProviderId === "qualai" && qualAiLimits && qualAiLimits.remaining <= 0) {
      toast.error(`Вы исчерпали недельный лимит генераций для тарифа ${qualAiLimits.tier} (${qualAiLimits.limit} в неделю)`);
      return;
    }

    if (!editor) return;

    const targetPos = selectionBackupRef.current
      ? { ...selectionBackupRef.current }
      : { from: editor.state.selection.from, to: editor.state.selection.to };

    generatingTargetPosRef.current = targetPos;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setAiGenerating(editor, true, targetPos);

    try {
      const generatedText = await generateAiText({
        provider: selectedProviderId,
        model: selectedModel.trim(),
        prompt: trimmedPrompt,
        systemPrompt,
        apiKey: currentProviderConfig?.apiKey,
        baseUrl: selectedProviderId === "custom" ? providers.custom.baseUrl : undefined,
        workspaceId,
        isOrg,
        signal: abortController.signal,
      });

      const finalPos = getAiGeneratingPos(editor) ?? generatingTargetPosRef.current ?? targetPos;
      setAiGenerating(editor, false);

      const html = markdownToEditorHtml(generatedText);

      // Determine smart target range
      let insertRange: number | { from: number; to: number } = finalPos;
      const { doc } = editor.state;
      const from = typeof finalPos === "number" ? finalPos : finalPos.from;
      const to = typeof finalPos === "number" ? finalPos : finalPos.to;

      // If cursor is collapsed (no selection) and inside an empty block, replace the whole empty block
      if (from === to && from >= 0 && from <= doc.content.size) {
        const $pos = doc.resolve(from);
        const parent = $pos.parent;
        if (parent.isTextblock && parent.textContent === "") {
          insertRange = { from: $pos.before(), to: $pos.after() };
        }
      }

      editor.chain().focus().insertContentAt(insertRange, html).run();
      setIsOpen(false);
      setPrompt("");
      toast.success("Текст добавлен");
      void refreshQualAiLimits();
    } catch (error: any) {
      void refreshQualAiLimits();
      if (error?.name === "AbortError" || abortController.signal.aborted) {
        toast("Генерация отменена");
      } else {
        const msg = error instanceof Error ? error.message : "Не удалось сгенерировать текст";
        toast.error(msg);
      }
      setAiGenerating(editor, false);
    } finally {
      setIsLoading(false);
      generatingTargetPosRef.current = null;
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-80 sm:w-96 p-3 shadow-xl rounded-xl border bg-popover text-popover-foreground space-y-2.5"
      >
        <div className="flex items-center justify-between pb-1 border-b border-border/50">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent font-bold">
              ИИ Генерация
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              settingsModal.onOpen();
            }}
            title="Настройки ИИ"
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings2 className="h-3 w-3" />
            <span>Настройки</span>
          </button>
        </div>

        <div className="flex flex-nowrap gap-1 overflow-x-auto pb-1.5 scrollbar-minimal">
          {(Object.keys(AI_PROVIDERS) as AiProviderId[]).map((id) => {
            const meta = AI_PROVIDERS[id];
            const isSelected = selectedProviderId === id;

            return (
              <button
                key={id}
                type="button"
                disabled={isLoading}
                onClick={() => handleProviderSelect(id)}
                className={cn(
                  "flex shrink-0 basis-16 grow flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all gap-1 cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                    : "border-border/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                  isLoading && "opacity-60 cursor-not-allowed"
                )}
              >
                {meta.iconSrc ? (
                  <Image
                    src={meta.iconSrc}
                    alt={meta.name}
                    width={15}
                    height={15}
                    className={cn(
                      "shrink-0 object-contain rounded-xs",
                      id === "openai" && "dark:invert"
                    )}
                  />
                ) : (
                  <Cpu className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="text-[10px] font-medium leading-none truncate max-w-full">
                  {meta.name}
                </span>
                {id === "qualai" && qualAiLimits && (
                  <span className="text-[9px] font-mono text-muted-foreground leading-none">
                    {qualAiLimits.remaining}/{qualAiLimits.limit}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedProviderId === "qualai" && (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
            <span className="text-muted-foreground text-[11px]">Недельный лимит QualAI:</span>
            <span className={cn(
              "font-mono font-medium text-[11px]",
              (qualAiLimits?.remaining ?? 1) === 0 ? "text-destructive font-semibold" : "text-primary"
            )}>
              {qualAiLimits ? `${qualAiLimits.remaining} из ${qualAiLimits.limit} осталось` : "Загрузка..."}
            </span>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Модель</span>
            {availableModels.length > 0 && !isLoading && selectedProviderId !== "qualai" && (
              <button
                type="button"
                onClick={() => setCustomModelMode(!customModelMode)}
                className="text-primary hover:underline cursor-pointer"
              >
                {customModelMode ? "Список моделей" : "Ввести вручную"}
              </button>
            )}
          </div>

          {customModelMode || availableModels.length === 0 ? (
            <input
              type="text"
              disabled={isLoading}
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              placeholder="Название модели..."
              className={cn(
                "w-full h-7 px-2 text-xs font-mono rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary",
                isLoading && "opacity-60 cursor-not-allowed"
              )}
            />
          ) : (
            <select
              disabled={isLoading}
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className={cn(
                "w-full h-7 px-2 text-xs font-mono rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer",
                isLoading && "opacity-60 cursor-not-allowed"
              )}
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              {!availableModels.includes(selectedModel) && selectedModel && (
                <option value={selectedModel}>{selectedModel}</option>
              )}
            </select>
          )}
        </div>

        {isCloudWithoutKey && (
          <div className="flex items-center justify-between px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px]">
            <span>Ключ не указан</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                settingsModal.onOpen();
              }}
              className="underline font-medium hover:opacity-80"
            >
              Настроить
            </button>
          </div>
        )}

        <div className="space-y-1">
          <textarea
            disabled={isLoading}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Что нужно написать или сгенерировать?..."
            rows={3}
            autoFocus
            className={cn(
              "w-full p-2 text-xs rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary",
              isLoading && "opacity-60 cursor-not-allowed"
            )}
          />
        </div>

        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          {isLoading ? (
            <span className="flex items-center gap-1.5 text-[11px] text-primary animate-pulse select-none">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Генерация текста...</span>
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground/60 select-none">
              Ctrl + Enter
            </span>
          )}

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Отмена
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleGenerate}
              disabled={
                isLoading ||
                !prompt.trim() ||
                !selectedModel.trim() ||
                (selectedProviderId === "qualai" && qualAiLimits?.remaining === 0)
              }
              className="h-7 px-3 text-xs gap-1.5 cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Генерация...</span>
                </>
              ) : selectedProviderId === "qualai" && qualAiLimits?.remaining === 0 ? (
                <span>Лимит исчерпан</span>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  <span>Сгенерировать</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
