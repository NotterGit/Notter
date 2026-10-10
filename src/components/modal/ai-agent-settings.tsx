/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  ImageIcon,
  Pencil,
  Plus,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useAiSettings } from "@/components/hooks/use-ai-settings";
import { useQualAiLimits } from "@/components/hooks/use-qualai-limits";
import { CustomAiProvider } from "@/config/types/ai.types";

async function processImageFile(file: File): Promise<string> {
  if (file.type === "image/svg+xml" && file.size < 150 * 1024) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = document.createElement("img");
      img.onload = () => {
        const maxSize = 128;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const format = file.type === "image/png" ? "image/png" : "image/jpeg";
        resolve(canvas.toDataURL(format, 0.85));
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AiAgentSettings() {
  const {
    isHydrated,
    activeProviderId,
    activeProvider,
    activeMeta,
    customProviders,
    allProviders,
    systemPrompt,
    providers,
    setActiveProvider,
    setProviderApiKey,
    setProviderModel,
    addProviderModel,
    removeProviderModel,
    addCustomProvider,
    updateCustomProvider,
    deleteCustomProvider,
    importSettings,
  } = useAiSettings();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconUploadRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"standard" | "custom">("standard");
  const [showApiKey, setShowApiKey] = useState(false);
  const [modelInput, setModelInput] = useState("");

  // Custom provider editor state
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customIcon, setCustomIcon] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("http://localhost:11434/v1");
  const [customApiKey, setCustomApiKey] = useState("");
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [customSelectedModel, setCustomSelectedModel] = useState("");
  const [customModelInput, setCustomModelInput] = useState("");
  const [showCustomApiKey, setShowCustomApiKey] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);

  const { limits: qualAiLimits, isLoading: isLimitsLoading, isOrg } = useQualAiLimits();

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

  const handleOpenAddCustom = () => {
    setEditingCustomId("new");
    setCustomName("");
    setCustomIcon("");
    setCustomBaseUrl("http://localhost:11434/v1");
    setCustomApiKey("");
    setCustomModels(["llama3.2"]);
    setCustomSelectedModel("llama3.2");
    setCustomModelInput("");
    setShowCustomApiKey(false);
    setActiveTab("custom");
  };

  const handleOpenEditCustom = (p: CustomAiProvider) => {
    setEditingCustomId(p.id);
    setCustomName(p.name);
    setCustomIcon(p.iconSrc || "");
    setCustomBaseUrl(p.baseUrl || "http://localhost:11434/v1");
    setCustomApiKey(p.apiKey || "");
    setCustomModels(Array.isArray(p.models) ? [...p.models] : []);
    setCustomSelectedModel(p.selectedModel || p.models?.[0] || "");
    setCustomModelInput("");
    setShowCustomApiKey(false);
    setActiveTab("custom");
  };

  const handleSaveCustom = () => {
    const trimmedName = customName.trim();
    if (!trimmedName) {
      toast.error("Введите название провайдера");
      return;
    }

    const trimmedBaseUrl = customBaseUrl.trim() || "http://localhost:11434/v1";

    if (editingCustomId === "new") {
      const newId = addCustomProvider({
        name: trimmedName,
        iconSrc: customIcon.trim() || undefined,
        baseUrl: trimmedBaseUrl,
        apiKey: customApiKey.trim(),
        models: customModels,
        selectedModel: customSelectedModel || customModels[0] || "",
      });
      setActiveProvider(newId);
      toast.success("Провайдер добавлен");
    } else if (editingCustomId) {
      updateCustomProvider(editingCustomId, {
        name: trimmedName,
        iconSrc: customIcon.trim() || undefined,
        baseUrl: trimmedBaseUrl,
        apiKey: customApiKey.trim(),
        models: customModels,
        selectedModel: customSelectedModel || customModels[0] || "",
      });
      toast.success("Провайдер обновлен");
    }

    setEditingCustomId(null);
  };

  const handleAddCustomModel = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = customModelInput.trim();
    if (!val) return;
    if (customModels.includes(val)) {
      setCustomSelectedModel(val);
      setCustomModelInput("");
      return;
    }
    const updated = [...customModels, val];
    setCustomModels(updated);
    if (!customSelectedModel) {
      setCustomSelectedModel(val);
    }
    setCustomModelInput("");
  };

  const handleRemoveCustomModel = (m: string) => {
    const updated = customModels.filter((model) => model !== m);
    setCustomModels(updated);
    if (customSelectedModel === m) {
      setCustomSelectedModel(updated[0] || "");
    }
  };

  const handleCustomIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingIcon(true);
      const dataUrl = await processImageFile(file);
      setCustomIcon(dataUrl);
      toast.success("Логотип загружен");
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error("Не удалось обработать изображение");
    } finally {
      setIsUploadingIcon(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleExport = () => {
    try {
      const exportData = {
        version: 2,
        exportedAt: new Date().toISOString(),
        activeProviderId,
        systemPrompt,
        providers,
        customProviders,
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
        const hasCustomProviders = Array.isArray(data.customProviders);
        const hasDirectProviders = Boolean(
          data.openai ||
            data.claude ||
            data.gemini ||
            data.deepseek ||
            data.qwen ||
            data.openrouter ||
            data.opencode ||
            data.yandex ||
            data.qualai ||
            data.custom
        );
        const hasValidData =
          hasProviders || hasCustomProviders || hasDirectProviders || data.activeProviderId;

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
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
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
              <img
                src={activeMeta.iconSrc}
                alt={activeMeta.name}
                width={14}
                height={14}
                className={cn(
                  "shrink-0 object-contain rounded-xs h-3.5 w-3.5",
                  (activeProviderId === "openai" || activeProviderId === "opencode") && "dark:invert"
                )}
              />
            ) : (
              <Cpu className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
            <span className="truncate max-w-[120px]">{activeMeta.name}</span>
          </div>

          <div className="text-muted-foreground/80">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-border/60 space-y-3 bg-background/50">
          {/* Tabs bar */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg border border-border/50 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab("standard");
                setEditingCustomId(null);
              }}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-md font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer",
                activeTab === "standard"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Провайдеры</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-md font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer",
                activeTab === "custom"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PlusCircle className="h-3.5 w-3.5 text-primary" />
              <span>Мои провайдеры</span>
              {customProviders.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-mono font-bold">
                  {customProviders.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: Standart & Selected Provider */}
          {activeTab === "standard" && (
            <div className="space-y-3">
              {/* Providers carousel */}
              <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1.5 scrollbar-minimal">
                {allProviders.map((meta) => {
                  const id = meta.id;
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
                        "flex shrink-0 basis-20 grow flex-col items-center justify-center p-2 rounded-lg border text-center transition-all gap-1.5 cursor-pointer",
                        isActive
                          ? "border-primary bg-primary/10 ring-1 ring-primary/40 text-foreground shadow-xs"
                          : "border-border/60 hover:border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {meta.iconSrc ? (
                        <img
                          src={meta.iconSrc}
                          alt={meta.name}
                          width={22}
                          height={22}
                          className={cn(
                            "object-contain rounded-xs h-5.5 w-5.5",
                            (id === "openai" || id === "opencode") && "dark:invert"
                          )}
                        />
                      ) : (
                        <Cpu className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                      )}

                      <span className="text-xs font-medium leading-tight truncate max-w-full">
                        {meta.name}
                      </span>
                      {id === "qualai" && qualAiLimits && (
                        <span className="text-[10px] text-muted-foreground font-mono leading-none">
                          {qualAiLimits.remaining}/{qualAiLimits.limit}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Quick Add Custom Provider Button */}
                <button
                  type="button"
                  onClick={handleOpenAddCustom}
                  className="flex shrink-0 basis-20 grow flex-col items-center justify-center p-2 rounded-lg border border-dashed border-border/80 hover:border-primary/80 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all gap-1.5 cursor-pointer"
                  title="Добавить своего провайдера"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-xs font-medium leading-tight">Свой</span>
                </button>
              </div>

              {/* Provider details */}
              <div className="space-y-2.5 pt-1">
                {/* QualAI details */}
                {activeProviderId === "qualai" && (
                  <div className="rounded-lg border border-border/70 bg-muted/40 p-2.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        Недельный лимит Q.AI {isOrg ? "(Организация)" : "(Личный)"}
                      </span>
                      {isLimitsLoading ? (
                        <span className="h-3 w-28 bg-primary/10 rounded-md animate-pulse" />
                      ) : (
                        <span className="font-semibold font-mono text-primary">
                          {qualAiLimits ? `${qualAiLimits.remaining} / ${qualAiLimits.limit}` : "—"} осталось
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Тариф: <strong className="text-foreground">{qualAiLimits?.tier ?? "Free"}</strong></span>
                      <span>Использовано за неделю: <strong className="text-foreground">{qualAiLimits?.used ?? 0}</strong></span>
                    </div>

                    <div className="w-full bg-border/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all rounded-full",
                          (qualAiLimits?.remaining ?? 1) === 0 ? "bg-destructive" : "bg-primary"
                        )}
                        style={{
                          width: qualAiLimits && qualAiLimits.limit > 0
                            ? `${Math.min(100, Math.round((qualAiLimits.used / qualAiLimits.limit) * 100))}%`
                            : "0%",
                        }}
                      />
                    </div>

                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-0.5">
                      <span>Сброс в понедельник в 00:00 UTC</span>
                    </div>
                  </div>
                )}

                {/* Custom Provider Info banner in standard tab */}
                {activeMeta.isCustom && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      {activeMeta.iconSrc ? (
                        <img
                          src={activeMeta.iconSrc}
                          alt={activeMeta.name}
                          className="h-4 w-4 rounded-xs object-contain shrink-0"
                        />
                      ) : (
                        <Cpu className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <span className="font-medium text-foreground truncate">
                        Пользовательский провайдер: {activeMeta.name}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const target = customProviders.find((p) => p.id === activeProviderId);
                        if (target) {
                          handleOpenEditCustom(target);
                        } else {
                          setActiveTab("custom");
                        }
                      }}
                      className="h-6 text-[11px] gap-1 px-2 text-primary hover:text-primary cursor-pointer shrink-0"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Настроить</span>
                    </Button>
                  </div>
                )}

                {/* Base URL for Custom Provider */}
                {activeMeta.isCustom && (
                  <div className="space-y-1">
                    <Label className="text-xs">Базовый URL (OpenAI-совместимый)</Label>
                    <Input
                      value={activeProvider?.baseUrl || ""}
                      onChange={(e) => {
                        if (activeMeta.isCustom) {
                          updateCustomProvider(activeProviderId, { baseUrl: e.target.value });
                        }
                      }}
                      placeholder="http://localhost:11434/v1"
                      className="h-8 text-xs font-mono bg-background"
                    />
                  </div>
                )}

                {/* API Key */}
                {activeMeta.requiresKey !== false && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">
                        API Ключ {activeMeta.isCustom ? "(Опционально)" : ""}
                      </Label>
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
                        onChange={(e) => setProviderApiKey(activeProviderId, e.target.value)}
                        placeholder={activeMeta.placeholderKey}
                        className="h-8 text-xs pr-8 font-mono bg-background"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Models List */}
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
                            {activeProviderId !== "qualai" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeProviderModel(activeProviderId, model);
                                }}
                                className={cn(
                                  "rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/20 transition-colors",
                                  isSelected
                                    ? "text-primary-foreground/80 hover:text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeProviderId !== "qualai" && (
                    <Input
                      value={modelInput}
                      onChange={(e) => setModelInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Введите название модели и нажмите Enter..."
                      className="h-8 text-xs font-mono bg-background"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Custom Providers Management */}
          {activeTab === "custom" && (
            <div className="space-y-3">
              {/* Form to add or edit custom provider */}
              {editingCustomId !== null ? (
                <div className="p-3 rounded-lg border border-primary/30 bg-card/60 space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-border/50">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-primary" />
                      <span>
                        {editingCustomId === "new"
                          ? "Новый пользовательский провайдер"
                          : "Редактирование провайдера"}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setEditingCustomId(null)}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Provider Name */}
                  <div className="space-y-1">
                    <Label className="text-xs">Название провайдера</Label>
                    <Input
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Например: Ollama Локальный, LM Studio, Groq..."
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  {/* Logo / Image */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Картинка / Логотип</Label>
                    <div className="flex items-center gap-3">
                      {/* Image preview */}
                      <div className="relative h-11 w-11 shrink-0 rounded-lg border border-border/80 bg-muted/40 flex items-center justify-center overflow-hidden">
                        {customIcon ? (
                          <img
                            src={customIcon}
                            alt="Логотип"
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploadingIcon}
                            onClick={() => iconUploadRef.current?.click()}
                            className="h-7 text-xs gap-1.5 border-border/70 hover:bg-muted cursor-pointer"
                          >
                            <Upload className="h-3 w-3" />
                            <span>{isUploadingIcon ? "Обработка..." : "Загрузить файл"}</span>
                          </Button>

                          {customIcon && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setCustomIcon("")}
                              className="h-7 text-xs text-rose-400/90 hover:text-rose-400 hover:bg-rose-500/10 dark:text-rose-300/90 dark:hover:text-rose-300 dark:hover:bg-rose-500/15 cursor-pointer px-2.5 rounded-md transition-colors"
                            >
                              Удалить
                            </Button>
                          )}

                          <input
                            ref={iconUploadRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCustomIconUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Base URL */}
                  <div className="space-y-1">
                    <Label className="text-xs">Базовый URL (OpenAI-совместимый)</Label>
                    <Input
                      value={customBaseUrl}
                      onChange={(e) => setCustomBaseUrl(e.target.value)}
                      placeholder="http://localhost:11434/v1"
                      className="h-8 text-xs font-mono bg-background"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Для локального Ollama: <code>http://localhost:11434/v1</code>. Endpoint должен поддерживать <code>/chat/completions</code>.
                    </p>
                  </div>

                  {/* API Key */}
                  <div className="space-y-1">
                    <Label className="text-xs">API Ключ (опционально)</Label>
                    <div className="relative">
                      <Input
                        type={showCustomApiKey ? "text" : "password"}
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="Оставьте пустым для локальных моделей"
                        className="h-8 text-xs pr-8 font-mono bg-background"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCustomApiKey(!showCustomApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showCustomApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Models list & input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Модели</Label>
                      {customSelectedModel && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          По умолчанию: <strong className="text-foreground">{customSelectedModel}</strong>
                        </span>
                      )}
                    </div>

                    {customModels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        {customModels.map((m) => {
                          const isSel = customSelectedModel === m;
                          return (
                            <div
                              key={m}
                              onClick={() => setCustomSelectedModel(m)}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border cursor-pointer select-none transition-all",
                                isSel
                                  ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                                  : "bg-background border-border/80 hover:bg-muted text-foreground"
                              )}
                            >
                              <span>{m}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCustomModel(m);
                                }}
                                className={cn(
                                  "rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/20 transition-colors",
                                  isSel
                                    ? "text-primary-foreground/80 hover:text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <Input
                        value={customModelInput}
                        onChange={(e) => setCustomModelInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomModel();
                          }
                        }}
                        placeholder="Название модели (например, llama3.2, mistral)..."
                        className="h-8 text-xs font-mono bg-background flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCustomModel}
                        variant="secondary"
                        className="h-8 text-xs px-2.5 cursor-pointer"
                      >
                        Добавить
                      </Button>
                    </div>
                  </div>

                  {/* Form actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCustomId(null)}
                      className="h-8 text-xs cursor-pointer"
                    >
                      Отмена
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveCustom}
                      className="h-8 text-xs gap-1.5 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{editingCustomId === "new" ? "Добавить" : "Сохранить"}</span>
                    </Button>
                  </div>
                </div>
              ) : (
                /* Custom Providers Listing */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground">
                        Пользовательские провайдеры
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Локальные или сторонние OpenAI-совместимые серверы
                      </span>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleOpenAddCustom}
                      className="h-7 text-xs gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Добавить</span>
                    </Button>
                  </div>

                  {customProviders.length === 0 ? (
                    <div className="p-6 rounded-lg border border-dashed border-border/70 text-center flex flex-col items-center justify-center space-y-2 bg-muted/20">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <Cpu className="h-6 w-6" />
                      </div>
                      <div className="text-xs font-medium text-foreground">
                        Нет добавленных провайдеров
                      </div>
                      <p className="text-[11px] text-muted-foreground max-w-xs">
                        Вы можете добавить любой OpenAI-совместимый сервер (Ollama, LM Studio, vLLM, Groq и др.), указав его адрес и модели.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleOpenAddCustom}
                        className="mt-2 h-7 text-xs gap-1 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Добавить первый провайдер</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customProviders.map((p) => {
                        const isActive = activeProviderId === p.id;
                        const modelsCount = p.models?.length || 0;

                        return (
                          <div
                            key={p.id}
                            className={cn(
                              "p-2.5 rounded-lg border transition-all space-y-2",
                              isActive
                                ? "border-primary/60 bg-primary/5 ring-1 ring-primary/20"
                                : "border-border/60 bg-card/40 hover:border-border"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-8 w-8 shrink-0 rounded-md border border-border/80 bg-background flex items-center justify-center overflow-hidden">
                                  {p.iconSrc ? (
                                    <img
                                      src={p.iconSrc}
                                      alt={p.name}
                                      className="h-full w-full object-contain p-0.5"
                                    />
                                  ) : (
                                    <Cpu className="h-4 w-4 text-primary" />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-foreground truncate">
                                      {p.name}
                                    </span>
                                    {isActive && (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        Активен
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-muted-foreground font-mono truncate block">
                                    {p.baseUrl}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0 pl-1">
                                {!isActive && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setActiveProvider(p.id);
                                      toast.success(`Провайдер ${p.name} выбран`);
                                    }}
                                    className="h-7 text-xs px-2.5 cursor-pointer border-border/70 hover:bg-muted font-medium"
                                  >
                                    Выбрать
                                  </Button>
                                )}

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEditCustom(p)}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer rounded-md transition-colors"
                                  title="Редактировать"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>

                                <div className="h-3.5 w-px bg-border/60" />

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    deleteCustomProvider(p.id);
                                    toast.success(`Провайдер ${p.name} удален`);
                                  }}
                                  className="h-7 w-7 p-0 text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 dark:text-rose-300/80 dark:hover:text-rose-300 dark:hover:bg-rose-500/15 cursor-pointer rounded-md transition-colors"
                                  title="Удалить"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Models info */}
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                              <span>
                                Моделей: <strong className="text-foreground">{modelsCount}</strong>
                              </span>
                              {p.selectedModel && (
                                <span className="font-mono truncate max-w-[200px]">
                                  Модель: <strong className="text-foreground">{p.selectedModel}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer: Export / Import & Privacy */}
          <div className="pt-2 border-t border-border/60 space-y-2.5">
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50 text-[11px] text-muted-foreground leading-relaxed">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                Все данные о провайдерах, включая логотипы и API-ключи, хранятся локально в вашем браузере
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-8 text-xs gap-1.5 flex-1 border-border/70 hover:bg-muted cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Экспорт данных</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImportClick}
                className="h-8 text-xs gap-1.5 flex-1 border-border/70 hover:bg-muted cursor-pointer"
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
      )}
    </div>
  );
}
