/**
 * Cover helpers for the Notter Tiptap Prototype.
 * Background images now live in `public/bg/<collection>/` and are served
 * through the `/api/backgrounds` route (see `src/lib/backgrounds.ts`).
 */

import { ALL_EMOJIS } from "./all-emojis"

export function getRandomEmoji(): string {
  const index = Math.floor(Math.random() * ALL_EMOJIS.length)
  return ALL_EMOJIS[index]
}