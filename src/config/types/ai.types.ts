export type AiProviderId = "openai" | "claude" | "gemini" | "deepseek" | "custom";

export interface StandardProviderConfig {
  apiKey: string;
  selectedModel: string;
  models: string[];
}

export interface CustomProviderConfig extends StandardProviderConfig {
  baseUrl: string;
}

export interface AiSettingsData {
  activeProviderId: AiProviderId;
  systemPrompt: string;
  providers: {
    openai: StandardProviderConfig;
    claude: StandardProviderConfig;
    gemini: StandardProviderConfig;
    deepseek: StandardProviderConfig;
    custom: CustomProviderConfig;
  };
}

export interface AiSettingsStore extends AiSettingsData {
  setActiveProvider: (id: AiProviderId) => void;
  setProviderApiKey: (id: AiProviderId, apiKey: string) => void;
  setProviderModel: (id: AiProviderId, model: string) => void;
  addProviderModel: (id: AiProviderId, model: string) => void;
  removeProviderModel: (id: AiProviderId, model: string) => void;
  setCustomProviderConfig: (config: Partial<CustomProviderConfig>) => void;
  setSystemPrompt: (prompt: string) => void;
  resetToDefaults: () => void;
  importSettings: (data: any) => void;
}

