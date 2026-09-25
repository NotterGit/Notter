/**
 * Cover presets for Notter Tiptap Prototype
 * Includes lightweight SVG gradient data URLs and curated photos
 */

export interface CoverPreset {
  id: string
  title: string
  category: "gradient" | "photo" | "notter"
  url: string
}

function createGradientSvg(colors: string[]): string {
  const stops = colors
    .map(
      (c, i) =>
        `<stop offset="${Math.round((i / (colors.length - 1)) * 100)}%" stop-color="${c}"/>`
    )
    .join("")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">${stops}</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const COVER_PRESETS: CoverPreset[] = [
  // Notter official
  {
    id: "notter-default",
    title: "Фирменная Notter",
    category: "notter",
    url: "/defaults/default-cover.svg",
  },

  // Gradients (instant offline vector SVGs)
  {
    id: "gradient-sunset",
    title: "Теплый закат",
    category: "gradient",
    url: createGradientSvg(["#f97316", "#ec4899", "#8b5cf6"]),
  },
  {
    id: "gradient-ocean",
    title: "Глубокий океан",
    category: "gradient",
    url: createGradientSvg(["#06b6d4", "#3b82f6", "#1e1b4b"]),
  },
  {
    id: "gradient-aurora",
    title: "Северное сияние",
    category: "gradient",
    url: createGradientSvg(["#10b981", "#06b6d4", "#6366f1"]),
  },
  {
    id: "gradient-twilight",
    title: "Сумерки",
    category: "gradient",
    url: createGradientSvg(["#8b5cf6", "#ec4899", "#3b82f6"]),
  },
  {
    id: "gradient-emerald",
    title: "Изумрудный рассвет",
    category: "gradient",
    url: createGradientSvg(["#059669", "#10b981", "#6ee7b7"]),
  },
  {
    id: "gradient-obsidian",
    title: "Темный обсидиан",
    category: "gradient",
    url: createGradientSvg(["#334155", "#1e293b", "#0f172a"]),
  },
  {
    id: "gradient-sakura",
    title: "Цветущая сакура",
    category: "gradient",
    url: createGradientSvg(["#fb7185", "#f43f5e", "#fda4af"]),
  },
  {
    id: "gradient-amber",
    title: "Золотистый янтарь",
    category: "gradient",
    url: createGradientSvg(["#f59e0b", "#d97706", "#78350f"]),
  },

  // Curated Unsplash Photos (Scenic / Minimalist)
  {
    id: "photo-mountains",
    title: "Горный туман",
    category: "photo",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "photo-ocean",
    title: "Лазурные волны",
    category: "photo",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "photo-stars",
    title: "Звёздное небо",
    category: "photo",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "photo-dunes",
    title: "Песчаные дюны",
    category: "photo",
    url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "photo-architecture",
    title: "Минимализм",
    category: "photo",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "photo-forest",
    title: "Хвойный лес",
    category: "photo",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80",
  },
]

import { ALL_EMOJIS } from "./all-emojis"

export function getRandomCoverPreset(): CoverPreset {
  const index = Math.floor(Math.random() * COVER_PRESETS.length)
  return COVER_PRESETS[index]
}

export function getRandomEmoji(): string {
  const index = Math.floor(Math.random() * ALL_EMOJIS.length)
  return ALL_EMOJIS[index]
}

