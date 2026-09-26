export type AiProviderId =
  | "openai"
  | "claude"
  | "gemini"
  | "deepseek"
  | "qwen"
  | "openrouter"
  | "qualai"
  | "custom";

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
    qwen: StandardProviderConfig;
    openrouter: StandardProviderConfig;
    qualai: StandardProviderConfig;
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

export interface ProviderMeta {
  id: AiProviderId;
  name: string;
  isCustom?: boolean;
  iconSrc?: string;
  placeholderKey: string;
  keyHelpUrl?: string;
  defaultBaseUrl?: string;
  requiresKey?: boolean;
}

export interface QualAiLimitsData {
  account_id: string;
  tier: string;
  premium: number;
  limit: number;
  used: number;
  remaining: number;
  period?: string;
  week?: string;
  date?: string;
  reset_at?: string;
  is_org?: boolean;
}

export interface GenerateTextOptions {
  provider: AiProviderId;
  model: string;
  prompt: string;
  systemPrompt?: string;
  apiKey?: string;
  baseUrl?: string;
  workspaceId?: string;
  isOrg?: boolean;
  signal?: AbortSignal;
}


