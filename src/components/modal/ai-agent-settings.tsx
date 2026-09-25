"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useAiSettings } from "@/components/hooks/use-ai-settings";
import { AI_PROVIDERS } from "@/config/ai-providers";
import { AiProviderId } from "@/config/types/ai.types";

export function AiAgentSettings() {
  const {
    isHydrated,
    activeProviderId,
    providers,
    systemPrompt,
    setActiveProvider,
    setProviderApiKey,
    setProviderModel,
    addProviderModel,
    removeProviderModel,
    setCustomProviderConfig,
    importSettings,
  } = useAiSettings();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [modelInput, setModelInput] = useState("");


  const activeProvider = providers[activeProviderId];
  const activeMeta = AI_PROVIDERS[activeProviderId];
  const activeModelName = activeProvider?.selectedModel || "";
  const currentModels = Array.isArray(activeProvider?.models) ? activeProvider.models : [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const val = modelInput.trim();
      if (val) {
        addProviderModel(activeProviderId, val);
        setModelInput("");
      }
    }
  };

  const handleExport = () => {
    try {
      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        activeProviderId,
        systemPrompt,
        providers,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notter-ai-providers-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Настройки провайдеров экспортированы");
    } catch (e) {
      console.error(e);
      toast.error("Не удалось экспортировать настройки");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          throw new Error("Файл пуст");
        }

        const data = JSON.parse(text);
        if (!data || typeof data !== "object") {
          throw new Error("Неверная структура данных");
        }

        const hasProviders = data.providers && typeof data.providers === "object";
        const hasDirectProviders = Boolean(
          data.openai || data.claude || data.gemini || data.deepseek || data.qualai || data.custom
        );
        const hasValidData = hasProviders || hasDirectProviders || data.activeProviderId;

        if (!hasValidData) {
          throw new Error("Файл не содержит настроек ИИ провайдеров");
        }

        importSettings(data);
        toast.success("Настройки успешно импортированы");
      } catch (err: any) {
        console.error("Import error:", err);
        toast.error(err?.message || "Ошибка при импорте файла");
      } finally {
        if (e.target) {
          e.target.value = "";
        }
      }
    };

    reader.onerror = () => {
      toast.error("Ошибка при чтении файла");
      if (e.target) {
        e.target.value = "";
      }
    };

    reader.readAsText(file);
  };


  if (!isHydrated) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border/70 overflow-hidden bg-card/40 transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">ИИ Агент</span>
            <span className="text-xs text-muted-foreground">
              Провайдер и модель для работы с текстом
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border/80 text-xs font-medium">
            {activeMeta.iconSrc ? (
              <Image
                src={activeMeta.iconSrc}
                alt={activeMeta.name}
                width={14}
                height={14}
                className={cn(
                  "shrink-0 object-contain rounded-sm",
                  activeProviderId === "openai" && "dark:invert"
                )}
              />
            ) : (
              <Cpu className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
            <span className="truncate max-w-[100px]">{activeMeta.name}</span>
          </div>

          <div className="text-muted-foreground/80">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-border/60 space-y-3 bg-background/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {(Object.keys(AI_PROVIDERS) as AiProviderId[]).map((id) => {
              const meta = AI_PROVIDERS[id];
              const isActive = activeProviderId === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveProvider(id);
                    setModelInput("");
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all gap-1.5",
                    isActive
                      ? "border-primary bg-primary/10 ring-1 ring-primary/40 text-foreground"
                      : "border-border/60 hover:border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {meta.iconSrc ? (
                    <Image
                      src={meta.iconSrc}
                      alt={meta.name}
                      width={22}
                      height={22}
                      className={cn(
                        "object-contain rounded-sm",
                        id === "openai" && "dark:invert"
                      )}
                    />
                  ) : (
                    <Cpu className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  )}

                  <span className="text-xs font-medium leading-tight truncate max-w-full">
                    {meta.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-2.5 pt-1">
            {activeProviderId === "custom" && (
              <div className="space-y-1">
                <Label className="text-xs">Базовый URL</Label>
                <Input
                  value={providers.custom.baseUrl}
                  onChange={(e) => setCustomProviderConfig({ baseUrl: e.target.value })}
                  placeholder="http://localhost:11434/v1"
                  className="h-8 text-xs font-mono bg-background"
                />
              </div>
            )}

            {activeMeta.requiresKey !== false && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">API Ключ</Label>
                  {activeMeta.keyHelpUrl && (
                    <a
                      href={activeMeta.keyHelpUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      Получить ключ
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>

                <div className="relative">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={activeProvider?.apiKey || ""}
                    onChange={(e) => {
                      if (activeProviderId === "custom") {
                        setCustomProviderConfig({ apiKey: e.target.value });
                      } else {
                        setProviderApiKey(activeProviderId, e.target.value);
                      }
                    }}
                    placeholder={activeMeta.placeholderKey}
                    className="h-8 text-xs pr-8 font-mono bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Модели</Label>
                {activeModelName && (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Выбрана: <strong className="text-foreground">{activeModelName}</strong>
                  </span>
                )}
              </div>

              {currentModels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {currentModels.map((model) => {
                    const isSelected = activeModelName === model;
                    return (
                      <div
                        key={model}
                        onClick={() => setProviderModel(activeProviderId, model)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border cursor-pointer select-none transition-all",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                            : "bg-background border-border/80 hover:bg-muted text-foreground"
                        )}
                      >
                        <span>{model}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeProviderModel(activeProviderId, model);
                          }}
                          className={cn(
                            "rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/20 transition-colors",
                            isSelected ? "text-primary-foreground/80 hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <Input
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введите название модели..."
                className="h-8 text-xs font-mono bg-background"
              />
            </div>

            <div className="pt-2 border-t border-border/60 space-y-2.5">
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50 text-[11px] text-muted-foreground leading-relaxed">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Все данные о провайдерах и API-ключи хранятся локально в вашем браузере
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="h-8 text-xs gap-1.5 flex-1 border-border/70 hover:bg-muted"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Экспорт данных</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleImportClick}
                  className="h-8 text-xs gap-1.5 flex-1 border-border/70 hover:bg-muted"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Импорт данных</span>
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
