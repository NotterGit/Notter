import { images } from "@/config/routing/image.route";
import { AiProviderId, AiSettingsData, ProviderMeta } from "@/config/types/ai.types";

export type { ProviderMeta };

export const QUALAI_DEFAULT_MODELS = [
  "QualAI-2",
  "QualAI-1.5",
  "QualAI-1.5-mini",
];

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
  qwen: {
    id: "qwen",
    name: "Qwen",
    iconSrc: images.AI.QWEN,
    placeholderKey: "sk-...",
    keyHelpUrl: "https://bailian.console.aliyun.com/?apiKey=1",
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    iconSrc: images.AI.OPENROUTER,
    placeholderKey: "sk-or-v1-...",
    keyHelpUrl: "https://openrouter.ai/keys",
  },
  qualai: {
    id: "qualai",
    name: "QualAI",
    iconSrc: images.AI.QUALAI,
    placeholderKey: "Не требуется",
    requiresKey: false,
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
    "Ты — умный редактор и ассистент внутри приложения заметок Notter. Помогай писать, дополнять и форматировать текст. Форматируй свой ответ с помощью чистого Markdown (заголовки #, ##, ###, списки -, нумерованные списки 1., чекбоксы - [ ] и - [x], жирный текст **, курсив *, зачеркивание ~~, цитаты >, блоки кода с указанием языка). Твой ответ вставляется прямо в тело документа, поэтому выводи исключительно готовое содержимое без вводных слов (например, 'Вот ваш текст:') и без заключительных реплик. Если тебя спрашивают о твоей модели или создателе, отвечай честно своей настоящей идентичностью.",
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
    qwen: {
      apiKey: "",
      selectedModel: "",
      models: [],
    },
    openrouter: {
      apiKey: "",
      selectedModel: "",
      models: [],
    },
    qualai: {
      apiKey: "",
      selectedModel: QUALAI_DEFAULT_MODELS[0],
      models: [...QUALAI_DEFAULT_MODELS],
    },
    custom: {
      apiKey: "",
      baseUrl: "http://localhost:11434/v1",
      selectedModel: "",
      models: [],
    },
  },
};
