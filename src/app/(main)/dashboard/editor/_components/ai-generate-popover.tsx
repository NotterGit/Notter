"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { type Editor } from "@tiptap/react";
import { Sparkles, Loader2, Cpu, Settings2 } from "lucide-react";
import toast from "react-hot-toast";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAiSettings } from "@/components/hooks/use-ai-settings";
import { useSettings } from "@/components/hooks/use-settings";
import { AI_PROVIDERS } from "@/config/ai-providers";
import { AiProviderId } from "@/config/types/ai.types";
import { generateAiText } from "@/lib/ai/generate";
import { cn } from "@/lib/utils";

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

  const [selectedProviderId, setSelectedProviderId] = useState<AiProviderId>(activeProviderId);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [customModelMode, setCustomModelMode] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedProviderId(activeProviderId);
      const prov = providers[activeProviderId];
      const model =
        prov?.selectedModel ||
        (Array.isArray(prov?.models) && prov.models[0]) ||
        "";
      setSelectedModel(model);
      setCustomModelMode(!prov?.models?.length);
      setPrompt("");
      setIsLoading(false);
    }
  }, [isOpen, activeProviderId, providers]);

  const handleProviderSelect = (id: AiProviderId) => {
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

  const isCloudWithoutKey = selectedProviderId !== "custom" && !currentProviderConfig?.apiKey?.trim();

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

    if (!editor) return;

    setIsLoading(true);

    try {
      const generatedText = await generateAiText({
        provider: selectedProviderId,
        model: selectedModel.trim(),
        prompt: trimmedPrompt,
        systemPrompt,
        apiKey: currentProviderConfig?.apiKey,
        baseUrl: selectedProviderId === "custom" ? providers.custom.baseUrl : undefined,
      });

      const targetPos = selectionBackupRef.current
        ? selectionBackupRef.current
        : editor.state.selection.from;

      editor.chain().focus().insertContentAt(targetPos, generatedText).run();
      setIsOpen(false);
      setPrompt("");
      toast.success("Текст добавлен");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Не удалось сгенерировать текст";
      toast.error(msg);
    } finally {
      setIsLoading(false);
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
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>ИИ Генерация</span>
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

        <div className="grid grid-cols-5 gap-1">
          {(Object.keys(AI_PROVIDERS) as AiProviderId[]).map((id) => {
            const meta = AI_PROVIDERS[id];
            const isSelected = selectedProviderId === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => handleProviderSelect(id)}
                className={cn(
                  "flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all gap-1 cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                    : "border-border/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
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
              </button>
            );
          })}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Модель</span>
            {availableModels.length > 0 && (
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
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              placeholder="Название модели..."
              className="w-full h-7 px-2 text-xs font-mono rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full h-7 px-2 text-xs font-mono rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
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
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Что нужно написать или сгенерировать?..."
            rows={3}
            autoFocus
            className="w-full p-2 text-xs rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <span className="text-[10px] text-muted-foreground/60 select-none">
            Ctrl + Enter
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="h-7 px-2.5 text-xs"
            >
              Отмена
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim() || !selectedModel.trim()}
              className="h-7 px-3 text-xs gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Генерация...</span>
                </>
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
