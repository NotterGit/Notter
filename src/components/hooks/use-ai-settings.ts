import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AiProviderId, AiSettingsStore, CustomProviderConfig } from "@/config/types/ai.types";
import { AI_PROVIDERS, AI_SYSTEM_PROMPTS, DEFAULT_AI_SETTINGS } from "@/config/ai-providers";
import { useEffect, useState } from "react";

export const useAiStore = create<AiSettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_AI_SETTINGS,

      setActiveProvider: (id: AiProviderId) => {
        set({ activeProviderId: id });
      },

      setProviderApiKey: (id: AiProviderId, apiKey: string) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [id]: {
              ...state.providers[id],
              apiKey,
            },
          },
        }));
      },

      setProviderModel: (id: AiProviderId, model: string) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [id]: {
              ...state.providers[id],
              selectedModel: model,
            },
          },
        }));
      },

      addProviderModel: (id: AiProviderId, rawModel: string) => {
        const trimmed = rawModel.trim();
        if (!trimmed) return;

        set((state) => {
          const current = state.providers[id];
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
        set((state) => {
          const current = state.providers[id];
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
        set((state) => ({
          providers: {
            ...state.providers,
            custom: {
              ...state.providers.custom,
              ...config,
            },
          },
        }));
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
          const validIds: AiProviderId[] = ["openai", "claude", "gemini", "deepseek", "custom"];

          let nextActive = state.activeProviderId;
          if (
            data.activeProviderId &&
            validIds.includes(data.activeProviderId)
          ) {
            nextActive = data.activeProviderId;
          }

          let nextSystemPrompt = state.systemPrompt;
          if (typeof data.systemPrompt === "string" && data.systemPrompt.trim()) {
            nextSystemPrompt = data.systemPrompt;
          }

          const rawProviders =
            data.providers && typeof data.providers === "object"
              ? data.providers
              : data;

          const nextProviders = { ...state.providers };

          for (const id of validIds) {
            const p = rawProviders[id];
            if (p && typeof p === "object") {
              const current = nextProviders[id];
              const apiKey = typeof p.apiKey === "string" ? p.apiKey : current.apiKey;
              const selectedModel =
                typeof p.selectedModel === "string" ? p.selectedModel : current.selectedModel;
              const models: string[] = Array.isArray(p.models)
                ? Array.from<string>(
                    new Set(
                      p.models.filter(
                        (m: unknown): m is string =>
                          typeof m === "string" && m.trim().length > 0
                      )
                    )
                  )
                : current.models;

              if (id === "custom") {
                const baseUrl =
                  typeof p.baseUrl === "string" && p.baseUrl.trim()
                    ? p.baseUrl
                    : (current as CustomProviderConfig).baseUrl;
                nextProviders.custom = {
                  ...current,
                  apiKey,
                  selectedModel,
                  models,
                  baseUrl,
                };
              } else {
                nextProviders[id] = {
                  ...current,
                  apiKey,
                  selectedModel,
                  models,
                };
              }
            }
          }

          return {
            activeProviderId: nextActive,
            systemPrompt: nextSystemPrompt,
            providers: nextProviders,
          };
        });
      },
    }),
    {
      name: "notter_ai_settings_v2",
      storage: createJSONStorage(() => localStorage),
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

  const activeProvider = store.providers[store.activeProviderId];
  const activeMeta = AI_PROVIDERS[store.activeProviderId];
  const activeModel = activeProvider?.selectedModel || "";

  return {
    ...store,
    isHydrated: mounted,
    activeProvider,
    activeMeta,
    activeModel,
  };
}
