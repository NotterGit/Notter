import { images } from "@/config/routing/image.route";
import { AiProviderId, AiSettingsData } from "@/config/types/ai.types";

export interface ProviderMeta {
  id: AiProviderId;
  name: string;
  isCustom?: boolean;
  iconSrc?: string;
  placeholderKey: string;
  keyHelpUrl?: string;
  defaultBaseUrl?: string;
}

export const AI_PROVIDERS: Record<AiProviderId, ProviderMeta> = {
  openai: {
    id: "openai",
    name: "ChatGPT",
    iconSrc: images.AI.OPENAI,
    placeholderKey: "sk-proj-...",
    keyHelpUrl: "https://platform.openai.com/api-keys",
  },
  claude: {
    id: "claude",
    name: "Claude",
    iconSrc: images.AI.CLAUDE,
    placeholderKey: "sk-ant-api03-...",
    keyHelpUrl: "https://console.anthropic.com/settings/keys",
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    iconSrc: images.AI.GEMINI,
    placeholderKey: "AIzaSy...",
    keyHelpUrl: "https://aistudio.google.com/app/apikey",
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    iconSrc: images.AI.DEEPSEEK,
    placeholderKey: "sk-...",
    keyHelpUrl: "https://platform.deepseek.com/api_keys",
  },
  custom: {
    id: "custom",
    name: "Custom",
    isCustom: true,
    placeholderKey: "Опционально",
    defaultBaseUrl: "http://localhost:11434/v1",
  },
};

export const AI_SYSTEM_PROMPTS = {
  DEFAULT:
    "Ты — ИИ-помощник и редактор текста внутри приложения заметок. Помогай писать, дополнять и редактировать текст понятно, грамотно и структурированно. Если тебя спрашивают о твоей модели или создателе, отвечай честно своей настоящей идентичностью.",
};

export const DEFAULT_AI_SETTINGS: AiSettingsData = {
  activeProviderId: "openai",
  systemPrompt: AI_SYSTEM_PROMPTS.DEFAULT,
  providers: {
    openai: {
      apiKey: "",
      selectedModel: "",
      models: [],
    },
    claude: {
      apiKey: "",
      selectedModel: "",
      models: [],
    },
    gemini: {
      apiKey: "",
      selectedModel: "",
      models: [],
    },
    deepseek: {
      apiKey: "",
      selectedModel: "",
      models: [],
    },
    custom: {
      apiKey: "",
      baseUrl: "http://localhost:11434/v1",
      selectedModel: "",
      models: [],
    },
  },
};
