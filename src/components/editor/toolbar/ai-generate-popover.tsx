/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { type Editor } from "@tiptap/react";
import { Sparkles, Loader2, Cpu, Settings2, FlaskConical, Plus, FileText } from "lucide-react";
import toast from "react-hot-toast";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAiSettings } from "@/components/hooks/use-ai-settings";
import { useQualAiLimits } from "@/components/hooks/use-qualai-limits";
import { useSettings } from "@/components/hooks/use-settings";
import { AI_PROVIDERS } from "@/config/ai-providers";
import { AiProviderId } from "@/config/types/ai.types";
import { isDevEnvironment } from "@/config/const/app.const";
import type { AiGeneratePopoverProps, AiTypewriterController } from "@/config/types/editor.types";
import { generateAiText } from "@/lib/ai/generate";
import { editorToMarkdown } from "@/lib/editor/tiptap-to-markdown";
import { cn } from "@/lib/utils";
import { typewriteAiText } from "@/lib/editor/ai-typewriter";
import { getAiGeneratingPos, setAiGenerating } from "../extensions/ai-indicator";

export function AiGeneratePopover({
  editor,
  documentTitle,
  isOpen,
  setIsOpen,
  selectionBackupRef,
  children,
}: AiGeneratePopoverProps) {
  const {
    activeProviderId,
    systemPrompt,
    builtinProviders,
    customProviders,
    getProviderConfig,
    getProviderMeta,
  } = useAiSettings();
  const settingsModal = useSettings();
  const { limits: qualAiLimits, refresh: refreshQualAiLimits, workspaceId, isOrg } = useQualAiLimits();

  const [providerTab, setProviderTab] = useState<"builtin" | "custom">("builtin");
  const [selectedProviderId, setSelectedProviderId] = useState<AiProviderId>(activeProviderId);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [customModelMode, setCustomModelMode] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>("");
  const [includeNoteContext, setIncludeNoteContext] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [mockWordCount, setMockWordCount] = useState<number>(100);
  const [mockWithMarkdown, setMockWithMarkdown] = useState<boolean>(true);

  const abortControllerRef = useRef<AbortController | null>(null);
  const generatingTargetPosRef = useRef<{ from: number; to: number } | null>(null);
  const typewriterControllerRef = useRef<AiTypewriterController | null>(null);
  const initializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false;
      return;
    }
    if (isLoading) return;
    if (initializedRef.current) return;

    initializedRef.current = true;

    setSelectedProviderId(activeProviderId);
    const isCustomActive = Boolean(getProviderMeta(activeProviderId).isCustom);
    setProviderTab(isCustomActive ? "custom" : "builtin");

    const prov = getProviderConfig(activeProviderId);
    const model =
      prov?.selectedModel ||
      (Array.isArray(prov?.models) && prov.models[0]) ||
      "";
    setSelectedModel(model);
    setCustomModelMode(!prov?.models?.length);
  }, [isOpen, isLoading, activeProviderId, getProviderConfig, getProviderMeta]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (typewriterControllerRef.current) {
        typewriterControllerRef.current.finishImmediately();
      }
      if (editor && !editor.isDestroyed) {
        setAiGenerating(editor, false);
      }
    };
  }, [editor]);

  const handleProviderSelect = (id: AiProviderId) => {
    if (isLoading) return;
    setSelectedProviderId(id);
    const prov = getProviderConfig(id);
    const model =
      prov?.selectedModel ||
      (Array.isArray(prov?.models) && prov.models[0]) ||
      "";
    setSelectedModel(model);
    setCustomModelMode(!prov?.models?.length);
  };

  const currentProviderConfig = getProviderConfig(selectedProviderId);
  const currentMeta = getProviderMeta(selectedProviderId);
  const availableModels = Array.isArray(currentProviderConfig?.models)
    ? currentProviderConfig.models.filter(Boolean)
    : [];

  const isCloudWithoutKey =
    !currentMeta.isCustom &&
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
      setIsOpen(false);
    } else {
      if (typewriterControllerRef.current) {
        typewriterControllerRef.current.finishImmediately();
      }
      setIsOpen(false);
    }
  };

  const handleGenerate = async () => {
    const isMock = selectedProviderId === "mock";
    const trimmedPrompt = isMock ? String(mockWordCount) : prompt.trim();

    if (!isMock && !trimmedPrompt) {
      toast.error("Введите промпт");
      return;
    }

    const effectiveModel = isMock
      ? (mockWithMarkdown ? "lorem-markdown" : "lorem-plain")
      : selectedModel.trim();

    if (!isMock && !effectiveModel) {
      toast.error("Выберите модель");
      return;
    }

    if (!isMock && isCloudWithoutKey) {
      toast.error(`Укажите API ключ для ${currentMeta.name} в настройках`);
      return;
    }

    if (selectedProviderId === "qualai" && qualAiLimits && qualAiLimits.remaining <= 0) {
      toast.error(`Вы исчерпали недельный лимит генераций для тарифа ${qualAiLimits.tier} (${qualAiLimits.limit} в неделю)`);
      return;
    }

    if (!editor) return;

    if (typewriterControllerRef.current) {
      typewriterControllerRef.current.finishImmediately();
    }

    const targetPos = selectionBackupRef.current
      ? { ...selectionBackupRef.current }
      : { from: editor.state.selection.from, to: editor.state.selection.to };

    generatingTargetPosRef.current = targetPos;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const savedPrompt = prompt;
    setIsLoading(true);
    setAiGenerating(editor, true, targetPos);
    setIsOpen(false);
    setPrompt("");
    editor?.commands.focus();

    const noteText = editor ? editor.getText().trim() : "";
    const isNoteEmpty = !noteText;
    const noteContext =
      includeNoteContext && !isNoteEmpty && editor
        ? editorToMarkdown(editor)
        : undefined;

    try {
      const generatedText = await generateAiText({
        provider: selectedProviderId,
        model: effectiveModel,
        prompt: trimmedPrompt,
        systemPrompt,
        noteContext,
        documentTitle,
        apiKey: currentProviderConfig?.apiKey,
        baseUrl: currentProviderConfig?.baseUrl,
        workspaceId,
        isOrg,
        signal: abortController.signal,
      });

      const finalPos = getAiGeneratingPos(editor) ?? generatingTargetPosRef.current ?? targetPos;
      setAiGenerating(editor, false);

      const from = typeof finalPos === "number" ? finalPos : finalPos.from;
      const to = typeof finalPos === "number" ? finalPos : finalPos.to;

      setIsOpen(false);

      typewriterControllerRef.current = typewriteAiText({
        editor,
        markdown: generatedText,
        range: { from, to },
        onComplete: () => {
          toast.success("Текст добавлен");
          void refreshQualAiLimits();
          typewriterControllerRef.current = null;
        },
        onError: (err) => {
          console.error("AI typing error:", err);
          toast.error("Не удалось напечатать текст");
          void refreshQualAiLimits();
          typewriterControllerRef.current = null;
        },
      });
    } catch (error: any) {
      void refreshQualAiLimits();
      if (error?.name === "AbortError" || abortController.signal.aborted) {
        toast("Генерация отменена");
      } else {
        const msg = error instanceof Error ? error.message : "Не удалось сгенерировать текст";
        toast.error(msg);
        setPrompt(savedPrompt);
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

  const noteText = editor ? editor.getText().trim() : "";
  const isNoteEmpty = !noteText;
  const noteWordsCount = isNoteEmpty ? 0 : noteText.split(/\s+/).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor?.commands.focus();
        }}
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

        {/* Provider Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-muted/60 rounded-lg border border-border/50 text-[11px]">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setProviderTab("builtin");
              if (getProviderMeta(selectedProviderId).isCustom) {
                handleProviderSelect("openai");
              }
            }}
            className={cn(
              "flex-1 py-1 px-2.5 rounded-md font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer",
              providerTab === "builtin"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Встроенные</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setProviderTab("custom");
              if (!getProviderMeta(selectedProviderId).isCustom && customProviders.length > 0) {
                handleProviderSelect(customProviders[0].id);
              }
            }}
            className={cn(
              "flex-1 py-1 px-2.5 rounded-md font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer",
              providerTab === "custom"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Cpu className="h-3 w-3 text-primary" />
            <span>Мои провайдеры</span>
            {customProviders.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-mono font-bold">
                {customProviders.length}
              </span>
            )}
          </button>
        </div>

        {/* Builtin Providers Carousel */}
        {providerTab === "builtin" && (
          <div className="flex flex-nowrap gap-1 overflow-x-auto pb-1.5 scrollbar-minimal">
            {builtinProviders
              .filter((p) => !p.isDevOnly || isDevEnvironment())
              .map((meta) => {
                const id = meta.id;
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
                    {id === "mock" ? (
                      <FlaskConical className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    ) : meta.iconSrc ? (
                      <img
                        src={meta.iconSrc}
                        alt={meta.name}
                        width={15}
                        height={15}
                        className={cn(
                          "shrink-0 object-contain rounded-xs",
                          (id === "openai" || id === "opencode") && "dark:invert"
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
        )}

        {/* Custom Providers Carousel */}
        {providerTab === "custom" && (
          <>
            {customProviders.length === 0 ? (
              <div className="p-3 rounded-lg border border-dashed border-border/70 text-center flex flex-col items-center justify-center gap-1.5 bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  У вас пока нет своих провайдеров
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsOpen(false);
                    settingsModal.onOpen();
                  }}
                  className="h-6 text-[11px] gap-1 px-2.5 border-border/80 hover:bg-muted cursor-pointer"
                >
                  <Settings2 className="h-3 w-3" />
                  <span>Добавить в настройках</span>
                </Button>
              </div>
            ) : (
              <div className="flex flex-nowrap gap-1 overflow-x-auto pb-1.5 scrollbar-minimal">
                {customProviders.map((cp) => {
                  const id = cp.id;
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
                      {cp.iconSrc ? (
                        <img
                          src={cp.iconSrc}
                          alt={cp.name}
                          width={15}
                          height={15}
                          className="shrink-0 object-contain rounded-xs h-3.5 w-3.5"
                        />
                      ) : (
                        <Cpu className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                      <span className="text-[10px] font-medium leading-none truncate max-w-full">
                        {cp.name}
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    settingsModal.onOpen();
                  }}
                  className="flex shrink-0 basis-16 grow flex-col items-center justify-center p-1.5 rounded-lg border border-dashed border-border/80 hover:border-primary/80 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all gap-1 cursor-pointer"
                  title="Управление провайдерами"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium leading-none">Еще</span>
                </button>
              </div>
            )}
          </>
        )}

        {selectedProviderId === "qualai" && (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
            <span className="text-muted-foreground text-[11px]">Недельный лимит Q.AI:</span>
            <span className={cn(
              "font-mono font-medium text-[11px]",
              (qualAiLimits?.remaining ?? 1) === 0 ? "text-destructive font-semibold" : "text-primary"
            )}>
              {qualAiLimits ? `${qualAiLimits.remaining} из ${qualAiLimits.limit} осталось` : "Загрузка..."}
            </span>
          </div>
        )}

        {selectedProviderId === "mock" ? (
          <div className="space-y-2 py-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground flex items-center gap-1 font-medium">
                <FlaskConical className="h-3.5 w-3.5 text-amber-500" />
                <span>Генерация Lorem Ipsum</span>
              </span>
              <span className="font-mono font-bold text-foreground text-xs">{mockWordCount} слов</span>
            </div>

            {/* Quick chips */}
            <div className="grid grid-cols-3 gap-1">
              {[25, 50, 100, 250, 500, 1000].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setMockWordCount(num)}
                  className={cn(
                    "py-1 px-1.5 text-xs rounded-md border font-mono transition-all cursor-pointer text-center",
                    mockWordCount === num
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                      : "border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {num} слов
                </button>
              ))}
            </div>

            {/* Slider and number input */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="range"
                min={10}
                max={1500}
                step={10}
                disabled={isLoading}
                value={mockWordCount}
                onChange={(e) => setMockWordCount(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
              />
              <input
                type="number"
                min={5}
                max={5000}
                disabled={isLoading}
                value={mockWordCount}
                onChange={(e) => setMockWordCount(Math.max(5, Math.min(5000, Number(e.target.value) || 0)))}
                className="w-16 h-7 text-xs font-mono text-center rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Format toggle */}
            <div className="flex items-center justify-between pt-0.5 text-[11px]">
              <span className="text-muted-foreground">Формат:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setMockWithMarkdown(true)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[11px] border transition-colors cursor-pointer",
                    mockWithMarkdown
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  Markdown (H2, списки)
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setMockWithMarkdown(false)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[11px] border transition-colors cursor-pointer",
                    !mockWithMarkdown
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  Текст
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
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

            <div className="flex items-center justify-between px-0.5 pt-0.5">
              <label
                htmlFor="ai-include-context"
                className={cn(
                  "flex items-center gap-2 text-[11px] select-none cursor-pointer transition-colors",
                  isNoteEmpty
                    ? "text-muted-foreground/50 cursor-not-allowed"
                    : "text-muted-foreground hover:text-foreground",
                  isLoading && "opacity-60 cursor-not-allowed"
                )}
              >
                <Checkbox
                  id="ai-include-context"
                  disabled={isLoading || isNoteEmpty}
                  checked={includeNoteContext && !isNoteEmpty}
                  onCheckedChange={(checked) => setIncludeNoteContext(Boolean(checked))}
                  className="h-3.5 w-3.5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-border/80 cursor-pointer"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <FileText className="h-3 w-3 text-violet-500" />
                  <span>Добавить заметку в контекст</span>
                </span>
              </label>

              <span className="text-[10px] text-muted-foreground/60 font-mono">
                {isNoteEmpty ? "(пусто)" : `~${noteWordsCount} ${noteWordsCount === 1 ? "слово" : "слов"}`}
              </span>
            </div>
          </>
        )}

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
                (selectedProviderId !== "mock" && (!prompt.trim() || !selectedModel.trim())) ||
                (selectedProviderId === "qualai" && qualAiLimits?.remaining === 0)
              }
              className={cn(
                "h-7 px-3 text-xs gap-1.5 cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-xs disabled:opacity-50 transition-all",
                isLoading && "ai-generate-button-loading disabled:opacity-90 cursor-wait"
              )}
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
