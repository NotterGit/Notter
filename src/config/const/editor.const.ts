import type { ColorPreset, DocumentMeta, MediaAlignment } from "@/config/types/editor.types"

// --- Palette & Colors ---

export const TEXT_COLORS: ColorPreset[] = [
  { name: "По умолчанию", value: "inherit", bg: "#64748b" },
  { name: "Черный", value: "#000000", bg: "#000000" },
  { name: "Темно-серый", value: "#334155", bg: "#334155" },
  { name: "Серый", value: "#64748b", bg: "#64748b" },
  { name: "Красный", value: "#ef4444", bg: "#ef4444" },
  { name: "Оранжевый", value: "#f97316", bg: "#f97316" },
  { name: "Янтарный", value: "#d97706", bg: "#d97706" },
  { name: "Зеленый", value: "#16a34a", bg: "#16a34a" },
  { name: "Бирюзовый", value: "#0891b2", bg: "#0891b2" },
  { name: "Синий", value: "#2563eb", bg: "#2563eb" },
  { name: "Индиго", value: "#4f46e5", bg: "#4f46e5" },
  { name: "Фиолетовый", value: "#9333ea", bg: "#9333ea" },
  { name: "Розовый", value: "#db2777", bg: "#db2777" },
]

export const HIGHLIGHT_COLORS: ColorPreset[] = [
  { name: "Без выделения", value: "transparent", bg: "transparent" },
  { name: "Желтый", value: "#fef08a", bg: "#fef08a" },
  { name: "Зеленый", value: "#bbf7d0", bg: "#bbf7d0" },
  { name: "Голубой", value: "#bfdbfe", bg: "#bfdbfe" },
  { name: "Фиолетовый", value: "#e9d5ff", bg: "#e9d5ff" },
  { name: "Розовый", value: "#fbcfe8", bg: "#fbcfe8" },
  { name: "Оранжевый", value: "#fed7aa", bg: "#fed7aa" },
  { name: "Красный", value: "#fecaca", bg: "#fecaca" },
  { name: "Бирюзовый", value: "#99f6e4", bg: "#99f6e4" },
  { name: "Серый", value: "#e2e8f0", bg: "#e2e8f0" },
  { name: "Лаймовый", value: "#d9f99d", bg: "#d9f99d" },
  { name: "Персиковый", value: "#ffedd5", bg: "#ffedd5" },
]

// --- Media & Alignment ---

export const DEFAULT_UPLOAD_LIMIT_MB = 10
export const INLINE_MEDIA_MAX_BYTES = 2 * 1024 * 1024

export const DEFAULT_MEDIA_ALIGNMENT: MediaAlignment = "center"
export const MEDIA_ALIGNMENTS: readonly MediaAlignment[] = ["left", "center", "right"] as const
export const DEFAULT_MEDIA_WIDTH = "100%"

export const MEDIA_ACCEPTED_IMAGE_TYPES = "image/*"
export const MEDIA_ACCEPTED_VIDEO_TYPES = "video/*"
export const MEDIA_ACCEPTED_AUDIO_TYPES = "audio/*"

// --- Image Compression for Cover ---

export const MAX_COVER_WIDTH = 1400
export const MAX_COVER_HEIGHT = 600
export const COVER_COMPRESSION_QUALITY = 0.82

// --- Headings & Typography ---

export const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const

// --- Timing & Delays ---

export const SAVE_STATUS_IDLE_DELAY_MS = 2500
export const TITLE_DEBOUNCE_MS = 300

// --- Default Content & Storage ---

export const EMPTY_EDITOR_DOCUMENT = {
  type: "doc",
  content: [{ type: "paragraph" }],
}

export const EDITOR_STORAGE_KEY = "notter-tiptap-prototype-v3"
export const EDITOR_META_STORAGE_KEY = "notter-tiptap-prototype-meta-v2"

export const DEFAULT_EDITOR_META: DocumentMeta = {
  title: "Проверка кастомного редактора Tiptap",
  icon: "📝",
  coverImage: "/defaults/default-cover.svg",
}

export const DEFAULT_STARTER_CONTENT = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Полнофункциональный редактор с удобной палитрой цветов, поддержкой перетаскивания картинок, заголовками H1–H5, обложками и эмодзи.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 4 },
      content: [{ type: "text", text: "Подзаголовок уровня H4 (теперь работает)" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Для H4 и H5 настроена четкая типографическая иерархия, правильные размеры шрифта и отступы.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 5 },
      content: [{ type: "text", text: "Секция уровня H5 (компактный заголовок)" }],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Сделана поддержка H4 и H5 в тулбаре и в меню" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Полная палитра текста и выделения с кастомным HEX" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Кастомные медиа-блоки (фото, видео, аудио) с ресайзом и DnD" }],
            },
          ],
        },
      ],
    },
  ],
}
