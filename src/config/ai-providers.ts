import { images } from "@/config/routing/image.route";
import { AiProviderId, AiSettingsData, ProviderMeta, SystemPromptPreset } from "@/config/types/ai.types";

export type { ProviderMeta, SystemPromptPreset };

export const QUALAI_DEFAULT_MODELS = [
  "Q.AI 3",
  "Q.AI 3 Mini",
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
  opencode: {
    id: "opencode",
    name: "OpenCode",
    iconSrc: images.AI.OPENCODE,
    placeholderKey: "sk-...",
    keyHelpUrl: "https://opencode.ai/zen",
  },
  yandex: {
    id: "yandex",
    name: "Yandex AI",
    iconSrc: images.AI.YANDEX,
    placeholderKey: "AQVN...",
    keyHelpUrl: "https://aistudio.yandex.ru",
  },
  qualai: {
    id: "qualai",
    name: "Q.AI",
    iconSrc: images.AI.QAI,
    placeholderKey: "Не требуется",
    requiresKey: false,
  },
  mock: {
    id: "mock",
    name: "Lorem (Dev)",
    placeholderKey: "Не требуется",
    requiresKey: false,
    isDevOnly: true,
  },
};

export const AI_SYSTEM_PROMPTS = {
  DEFAULT:
    "Ты — умный редактор и ассистент внутри приложения заметок Notter. Помогай писать, дополнять и форматировать текст. Форматируй свой ответ с помощью чистого Markdown (заголовки #, ##, ###, списки -, нумерованные списки 1., чекбоксы - [ ] и - [x], жирный текст **, курсив *, зачеркивание ~~, цитаты >, блоки кода с указанием языка). Твой ответ вставляется прямо в тело документа, поэтому выводи исключительно готовое содержимое без вводных слов (например, 'Вот ваш текст:') и без заключительных реплик. Если тебя спрашивают о твоей модели или создателе, отвечай честно своей настоящей идентичностью.",
  CONCISE:
    "Ты — лаконичный редактор в Notter. Отвечай максимально кратко, структурированно и по делу. Используй чистый Markdown. Выводи только готовый текст без вводных фраз и заключений.",
  CREATIVE:
    "Ты — креативный копирайтер и ассистент в Notter. Пиши выразительно, живо и увлекательно. Форматируй ответ с помощью чистого Markdown. Выводи готовый текст без лишних пояснений.",
  TECHNICAL:
    "Ты — технический писатель и эксперт в Notter. Пиши строго, структурированно, с точными формулировками и примерами кода. Используй чистый Markdown. Выводи только готовый текст без предисловий.",
};

export const AI_SYSTEM_PROMPT_PRESETS: SystemPromptPreset[] = [
  {
    id: "default",
    name: "По умолчанию",
    prompt: AI_SYSTEM_PROMPTS.DEFAULT,
  },
  {
    id: "concise",
    name: "Краткий",
    prompt: AI_SYSTEM_PROMPTS.CONCISE,
  },
  {
    id: "creative",
    name: "Креативный",
    prompt: AI_SYSTEM_PROMPTS.CREATIVE,
  },
  {
    id: "technical",
    name: "Технический",
    prompt: AI_SYSTEM_PROMPTS.TECHNICAL,
  },
];

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
    opencode: {
      apiKey: "",
      selectedModel: "",
      models: [],
    },
    yandex: {
      apiKey: "",
      selectedModel: "",
      models: [],
    },
    qualai: {
      apiKey: "",
      selectedModel: QUALAI_DEFAULT_MODELS[0],
      models: [...QUALAI_DEFAULT_MODELS],
    },
    mock: {
      apiKey: "",
      selectedModel: "lorem-markdown",
      models: ["lorem-markdown", "lorem-plain"],
    },
  },
  customProviders: [],
};
