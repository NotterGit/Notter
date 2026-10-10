import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  AiProviderId,
  AiSettingsData,
  AiSettingsStore,
  CustomAiProvider,
  CustomProviderConfig,
  ProviderMeta,
  StandardProviderConfig,
} from "@/config/types/ai.types";
import {
  AI_PROVIDERS,
  AI_SYSTEM_PROMPTS,
  DEFAULT_AI_SETTINGS,
  QUALAI_DEFAULT_MODELS,
} from "@/config/ai-providers";
import { useCallback, useEffect, useMemo, useState } from "react";

const useAiStore = create<AiSettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_AI_SETTINGS,

      setActiveProvider: (id: AiProviderId) => {
        set({ activeProviderId: id });
      },

      setProviderApiKey: (id: AiProviderId, apiKey: string) => {
        set((state) => {
          const isCustom = state.customProviders?.some((p) => p.id === id);
          const current: StandardProviderConfig = state.providers[id] || {
            apiKey: "",
            selectedModel: "",
            models: [],
          };

          if (isCustom) {
            return {
              customProviders: state.customProviders.map((p) =>
                p.id === id ? { ...p, apiKey } : p
              ),
              providers: {
                ...state.providers,
                [id]: {
                  ...current,
                  apiKey,
                },
              },
            };
          }

          return {
            providers: {
              ...state.providers,
              [id]: {
                ...current,
                apiKey,
              },
            },
          };
        });
      },

      setProviderModel: (id: AiProviderId, model: string) => {
        set((state) => {
          const isCustom = state.customProviders?.some((p) => p.id === id);
          const current: StandardProviderConfig = state.providers[id] || {
            apiKey: "",
            selectedModel: "",
            models: [],
          };

          if (isCustom) {
            return {
              customProviders: state.customProviders.map((p) =>
                p.id === id ? { ...p, selectedModel: model } : p
              ),
              providers: {
                ...state.providers,
                [id]: {
                  ...current,
                  selectedModel: model,
                },
              },
            };
          }

          return {
            providers: {
              ...state.providers,
              [id]: {
                ...current,
                selectedModel: model,
              },
            },
          };
        });
      },

      addProviderModel: (id: AiProviderId, rawModel: string) => {
        if (id === "qualai") return;

        const trimmed = rawModel.trim();
        if (!trimmed) return;

        set((state) => {
          const customMatch = state.customProviders?.find((p) => p.id === id);
          if (customMatch) {
            const existing = customMatch.models || [];
            const updatedModels = existing.includes(trimmed)
              ? existing
              : [...existing, trimmed];
            const selectedModel = customMatch.selectedModel || trimmed;

            return {
              customProviders: state.customProviders.map((p) =>
                p.id === id ? { ...p, models: updatedModels, selectedModel } : p
              ),
              providers: {
                ...state.providers,
                [id]: {
                  apiKey: customMatch.apiKey,
                  baseUrl: customMatch.baseUrl,
                  models: updatedModels,
                  selectedModel,
                },
              },
            };
          }

          const current: StandardProviderConfig = state.providers[id] || {
            apiKey: "",
            selectedModel: "",
            models: [],
          };
          const existingModels = Array.isArray(current.models) ? current.models : [];

          if (existingModels.includes(trimmed)) {
            return {
              providers: {
                ...state.providers,
                [id]: {
                  ...current,
                  selectedModel: trimmed,
                },
              },
            };
          }

          const updatedModels = [...existingModels, trimmed];
          return {
            providers: {
              ...state.providers,
              [id]: {
                ...current,
                models: updatedModels,
                selectedModel: current.selectedModel || trimmed,
              },
            },
          };
        });
      },

      removeProviderModel: (id: AiProviderId, modelToRemove: string) => {
        if (id === "qualai") return;

        set((state) => {
          const customMatch = state.customProviders?.find((p) => p.id === id);
          if (customMatch) {
            const existing = customMatch.models || [];
            const updatedModels = existing.filter((m) => m !== modelToRemove);
            let selectedModel = customMatch.selectedModel;
            if (selectedModel === modelToRemove) {
              selectedModel = updatedModels[0] || "";
            }

            return {
              customProviders: state.customProviders.map((p) =>
                p.id === id ? { ...p, models: updatedModels, selectedModel } : p
              ),
              providers: {
                ...state.providers,
                [id]: {
                  apiKey: customMatch.apiKey,
                  baseUrl: customMatch.baseUrl,
                  models: updatedModels,
                  selectedModel,
                },
              },
            };
          }

          const current: StandardProviderConfig = state.providers[id] || {
            apiKey: "",
            selectedModel: "",
            models: [],
          };
          const existingModels = Array.isArray(current.models) ? current.models : [];
          const updatedModels = existingModels.filter((m) => m !== modelToRemove);

          let newSelected = current.selectedModel;
          if (newSelected === modelToRemove) {
            newSelected = updatedModels[0] || "";
          }

          return {
            providers: {
              ...state.providers,
              [id]: {
                ...current,
                models: updatedModels,
                selectedModel: newSelected,
              },
            },
          };
        });
      },

      setCustomProviderConfig: (config: Partial<CustomProviderConfig>) => {
        set((state) => {
          const list = state.customProviders || [];
          if (list.length > 0) {
            const updatedList = list.map((p, idx) =>
              idx === 0 ? { ...p, ...config } : p
            );
            return {
              customProviders: updatedList,
            };
          }

          const newCustom: CustomAiProvider = {
            id: "custom_default",
            name: "Custom Provider",
            baseUrl: config.baseUrl || "http://localhost:11434/v1",
            apiKey: config.apiKey || "",
            models: config.models || [],
            selectedModel: config.selectedModel || "",
            createdAt: Date.now(),
          };

          return {
            customProviders: [newCustom],
            providers: {
              ...state.providers,
              custom_default: {
                apiKey: newCustom.apiKey,
                baseUrl: newCustom.baseUrl,
                models: newCustom.models,
                selectedModel: newCustom.selectedModel,
              },
            },
          };
        });
      },

      addCustomProvider: (rawProvider) => {
        const newId =
          rawProvider.id ||
          `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const models = Array.isArray(rawProvider.models)
          ? Array.from(
              new Set(
                rawProvider.models
                  .map((m) => (typeof m === "string" ? m.trim() : ""))
                  .filter(Boolean)
              )
            )
          : [];
        const selectedModel = rawProvider.selectedModel || models[0] || "";

        const newProvider: CustomAiProvider = {
          id: newId,
          name: rawProvider.name.trim() || "Новый провайдер",
          iconSrc: rawProvider.iconSrc?.trim() || undefined,
          baseUrl: rawProvider.baseUrl?.trim() || "http://localhost:11434/v1",
          apiKey: rawProvider.apiKey?.trim() || "",
          models,
          selectedModel,
          createdAt: Date.now(),
        };

        set((state) => ({
          customProviders: [...(state.customProviders || []), newProvider],
          providers: {
            ...state.providers,
            [newId]: {
              apiKey: newProvider.apiKey,
              baseUrl: newProvider.baseUrl,
              models: newProvider.models,
              selectedModel: newProvider.selectedModel,
            },
          },
        }));

        return newId;
      },

      updateCustomProvider: (id, updates) => {
        set((state) => {
          const list = state.customProviders || [];
          const updatedList = list.map((p) => {
            if (p.id !== id) return p;
            const updatedModels =
              updates.models !== undefined
                ? Array.from(
                    new Set(
                      updates.models
                        .map((m) => (typeof m === "string" ? m.trim() : ""))
                        .filter(Boolean)
                    )
                  )
                : p.models;
            let updatedSelected =
              updates.selectedModel !== undefined
                ? updates.selectedModel
                : p.selectedModel;
            if (
              !updatedModels.includes(updatedSelected) &&
              updatedModels.length > 0
            ) {
              updatedSelected = updatedModels[0];
            }
            return {
              ...p,
              ...updates,
              models: updatedModels,
              selectedModel: updatedSelected,
            };
          });

          const target = updatedList.find((p) => p.id === id);
          const updatedProviders = { ...state.providers };
          if (target) {
            updatedProviders[id] = {
              apiKey: target.apiKey,
              baseUrl: target.baseUrl,
              models: target.models,
              selectedModel: target.selectedModel,
            };
          }

          return {
            customProviders: updatedList,
            providers: updatedProviders,
          };
        });
      },

      deleteCustomProvider: (id) => {
        set((state) => {
          const list = state.customProviders || [];
          const updatedList = list.filter((p) => p.id !== id);
          const updatedProviders = { ...state.providers };
          delete updatedProviders[id];

          let nextActive = state.activeProviderId;
          if (nextActive === id) {
            nextActive = updatedList[0]?.id || "openai";
          }

          return {
            customProviders: updatedList,
            providers: updatedProviders,
            activeProviderId: nextActive,
          };
        });
      },

      setSystemPrompt: (systemPrompt: string) => {
        set({ systemPrompt });
      },

      resetToDefaults: () => {
        set(DEFAULT_AI_SETTINGS);
      },

      importSettings: (data: any) => {
        if (!data || typeof data !== "object") return;

        set((state) => {
          let nextCustomProviders: CustomAiProvider[] = Array.isArray(
            data.customProviders
          )
            ? data.customProviders.map((item: any) => ({
                id:
                  typeof item.id === "string" && item.id.trim()
                    ? item.id
                    : `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                name:
                  typeof item.name === "string" && item.name.trim()
                    ? item.name
                    : "Пользовательский",
                iconSrc:
                  typeof item.iconSrc === "string" && item.iconSrc.trim()
                    ? item.iconSrc
                    : undefined,
                baseUrl:
                  typeof item.baseUrl === "string" && item.baseUrl.trim()
                    ? item.baseUrl
                    : "http://localhost:11434/v1",
                apiKey: typeof item.apiKey === "string" ? item.apiKey : "",
                models: Array.isArray(item.models)
                  ? item.models.filter(
                      (m: any) => typeof m === "string" && m.trim().length > 0
                    )
                  : [],
                selectedModel:
                  typeof item.selectedModel === "string"
                    ? item.selectedModel
                    : "",
                createdAt:
                  typeof item.createdAt === "number"
                    ? item.createdAt
                    : Date.now(),
              }))
            : state.customProviders || [];

          // Backward compatibility for old single custom provider
          const oldCustom = data.providers?.custom || data.custom;
          if (
            (!data.customProviders || data.customProviders.length === 0) &&
            oldCustom &&
            typeof oldCustom === "object"
          ) {
            const exists = nextCustomProviders.some(
              (p) => p.id === "custom" || p.id === "custom_default"
            );
            if (!exists) {
              nextCustomProviders = [
                ...nextCustomProviders,
                {
                  id: "custom",
                  name: "Custom (Ollama)",
                  baseUrl:
                    typeof oldCustom.baseUrl === "string"
                      ? oldCustom.baseUrl
                      : "http://localhost:11434/v1",
                  apiKey:
                    typeof oldCustom.apiKey === "string" ? oldCustom.apiKey : "",
                  models: Array.isArray(oldCustom.models) ? oldCustom.models : [],
                  selectedModel:
                    typeof oldCustom.selectedModel === "string"
                      ? oldCustom.selectedModel
                      : "",
                  createdAt: Date.now(),
                },
              ];
            }
          }

          const validBuiltinIds: AiProviderId[] = [
            "openai",
            "claude",
            "gemini",
            "deepseek",
            "qwen",
            "openrouter",
            "opencode",
            "yandex",
            "qualai",
            "mock",
          ];

          let nextActive = state.activeProviderId;
          if (
            typeof data.activeProviderId === "string" &&
            (validBuiltinIds.includes(data.activeProviderId) ||
              nextCustomProviders.some((p) => p.id === data.activeProviderId))
          ) {
            nextActive = data.activeProviderId;
          }

          let nextSystemPrompt = state.systemPrompt;
          if (
            typeof data.systemPrompt === "string" &&
            data.systemPrompt.trim()
          ) {
            nextSystemPrompt = data.systemPrompt;
          }

          const rawProviders =
            data.providers && typeof data.providers === "object"
              ? data.providers
              : data;

          const nextProviders = { ...state.providers };

          for (const id of validBuiltinIds) {
            const p = rawProviders[id];
            if (p && typeof p === "object") {
              const current = nextProviders[id];
              const apiKey =
                typeof p.apiKey === "string" ? p.apiKey : current?.apiKey || "";
              const selectedModel =
                typeof p.selectedModel === "string"
                  ? p.selectedModel
                  : current?.selectedModel || "";
              const models: string[] = Array.isArray(p.models)
                ? Array.from<string>(
                    new Set(
                      p.models.filter(
                        (m: unknown): m is string =>
                          typeof m === "string" && m.trim().length > 0
                      )
                    )
                  )
                : current?.models || [];

              nextProviders[id] = {
                apiKey,
                selectedModel,
                models,
              };
            }
          }

          for (const cp of nextCustomProviders) {
            nextProviders[cp.id] = {
              apiKey: cp.apiKey,
              baseUrl: cp.baseUrl,
              models: cp.models,
              selectedModel: cp.selectedModel,
            };
          }

          nextProviders.qualai = {
            apiKey: "",
            models: [...QUALAI_DEFAULT_MODELS],
            selectedModel: QUALAI_DEFAULT_MODELS.includes(
              nextProviders.qualai?.selectedModel
            )
              ? nextProviders.qualai.selectedModel
              : QUALAI_DEFAULT_MODELS[0],
          };

          return {
            activeProviderId: nextActive,
            systemPrompt: nextSystemPrompt,
            providers: nextProviders,
            customProviders: nextCustomProviders,
          };
        });
      },
    }),
    {
      name: "notter_ai_settings_v2",
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AiSettingsData>;
        const persistedProviders = (persisted.providers ?? {}) as Record<
          string,
          any
        >;

        let customProviders: CustomAiProvider[] = Array.isArray(
          persisted.customProviders
        )
          ? persisted.customProviders
          : [];

        // Migrate single old custom provider if present
        if (customProviders.length === 0 && persistedProviders?.custom) {
          const oldCustom = persistedProviders.custom;
          if (
            oldCustom.baseUrl ||
            (oldCustom.models && oldCustom.models.length > 0) ||
            oldCustom.apiKey
          ) {
            customProviders = [
              {
                id: "custom",
                name: "Custom (Ollama)",
                baseUrl: oldCustom.baseUrl || "http://localhost:11434/v1",
                apiKey: oldCustom.apiKey || "",
                models: Array.isArray(oldCustom.models) ? oldCustom.models : [],
                selectedModel: oldCustom.selectedModel || "",
                createdAt: Date.now(),
              },
            ];
          }
        }

        const mergedProviders = { ...DEFAULT_AI_SETTINGS.providers } as Record<
          string,
          any
        >;

        for (const id of Object.keys(mergedProviders)) {
          const stored = persistedProviders[id];
          if (stored) {
            mergedProviders[id] = { ...mergedProviders[id], ...stored };
          }
        }

        for (const cp of customProviders) {
          mergedProviders[cp.id] = {
            apiKey: cp.apiKey,
            baseUrl: cp.baseUrl,
            models: cp.models,
            selectedModel: cp.selectedModel,
          };
        }

        mergedProviders.qualai = {
          ...mergedProviders.qualai,
          models: [...QUALAI_DEFAULT_MODELS],
          selectedModel: QUALAI_DEFAULT_MODELS.includes(
            mergedProviders.qualai?.selectedModel
          )
            ? mergedProviders.qualai.selectedModel
            : QUALAI_DEFAULT_MODELS[0],
        };

        return {
          ...currentState,
          ...persisted,
          customProviders,
          providers: mergedProviders as AiSettingsData["providers"],
        };
      },
    }
  )
);

export function useAiSettings() {
  const store = useAiStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!store.systemPrompt || store.systemPrompt.includes("Notter. Пиши грамотно")) {
      store.setSystemPrompt(AI_SYSTEM_PROMPTS.DEFAULT);
    }
  }, [store]);

  const customProviders = useMemo(
    () => store.customProviders || [],
    [store.customProviders]
  );
  const customMatch = customProviders.find(
    (p) => p.id === store.activeProviderId
  );

  const activeProvider: StandardProviderConfig = customMatch
    ? {
        apiKey: customMatch.apiKey,
        selectedModel: customMatch.selectedModel,
        models: customMatch.models,
        baseUrl: customMatch.baseUrl,
      }
    : store.providers[store.activeProviderId] || {
        apiKey: "",
        selectedModel: "",
        models: [],
      };

  const activeMeta: ProviderMeta = customMatch
    ? {
        id: customMatch.id,
        name: customMatch.name,
        iconSrc: customMatch.iconSrc,
        isCustom: true,
        placeholderKey: "Опционально",
        defaultBaseUrl: customMatch.baseUrl,
        requiresKey: false,
      }
    : (AI_PROVIDERS[store.activeProviderId as keyof typeof AI_PROVIDERS] || {
        id: store.activeProviderId,
        name: "Пользовательский",
        isCustom: true,
        placeholderKey: "Опционально",
        defaultBaseUrl: "http://localhost:11434/v1",
        requiresKey: false,
      });

  const activeModel = activeProvider?.selectedModel || "";

  const builtinProviders: ProviderMeta[] = useMemo(
    () => Object.values(AI_PROVIDERS),
    []
  );

  const allProviders: ProviderMeta[] = useMemo(
    () => [
      ...builtinProviders,
      ...customProviders.map((cp) => ({
        id: cp.id,
        name: cp.name,
        iconSrc: cp.iconSrc,
        isCustom: true,
        placeholderKey: "Опционально",
        defaultBaseUrl: cp.baseUrl,
        requiresKey: false,
      })),
    ],
    [builtinProviders, customProviders]
  );

  const getProviderConfig = useCallback(
    (id: AiProviderId): StandardProviderConfig => {
      const cp = customProviders.find((p) => p.id === id);
      if (cp) {
        return {
          apiKey: cp.apiKey,
          selectedModel: cp.selectedModel,
          models: cp.models,
          baseUrl: cp.baseUrl,
        };
      }
      return (
        store.providers[id] || {
          apiKey: "",
          selectedModel: "",
          models: [],
        }
      );
    },
    [customProviders, store.providers]
  );

  const getProviderMeta = useCallback(
    (id: AiProviderId): ProviderMeta => {
      const cp = customProviders.find((p) => p.id === id);
      if (cp) {
        return {
          id: cp.id,
          name: cp.name,
          iconSrc: cp.iconSrc,
          isCustom: true,
          placeholderKey: "Опционально",
          defaultBaseUrl: cp.baseUrl,
          requiresKey: false,
        };
      }
      return (
        AI_PROVIDERS[id as keyof typeof AI_PROVIDERS] || {
          id,
          name: "Пользовательский",
          isCustom: true,
          placeholderKey: "Опционально",
          defaultBaseUrl: "http://localhost:11434/v1",
          requiresKey: false,
        }
      );
    },
    [customProviders]
  );

  return {
    ...store,
    isHydrated: mounted,
    activeProvider,
    activeMeta,
    activeModel,
    customProviders,
    builtinProviders,
    allProviders,
    getProviderConfig,
    getProviderMeta,
  };
}
