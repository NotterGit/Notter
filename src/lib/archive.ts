import {
  ARCHIVE_RETENTION_OPTIONS,
  DEFAULT_RETENTION_DAYS,
  type ArchiveRetentionDays,
  type ArchiveRetentionOption,
} from "@/config/const/limits.const"
import { getMaxArchiveRetentionDays, isArchiveRetentionAllowed } from "./plan-limits"

export {
  ARCHIVE_RETENTION_OPTIONS,
  DEFAULT_RETENTION_DAYS,
  getMaxArchiveRetentionDays,
  isArchiveRetentionAllowed,
}
export type { ArchiveRetentionDays, ArchiveRetentionOption }

export interface ArchivableDoc {
  _creationTime: number
  archivedTime?: string
  lastEditTime?: string
}

/**
 * Returns correct Russian plural form based on number
 */
export function pluralize(n: number, one: string, two: string, five: string): string {
  const abs = Math.abs(n) % 100
  const rem = abs % 10
  if (abs > 10 && abs < 20) return five
  if (rem > 1 && rem < 5) return two
  if (rem === 1) return one
  return five
}

/**
 * Resolves the timestamp (in ms) when the document was archived.
 * Falls back to lastEditTime or _creationTime if archivedTime is missing.
 */
export function getDocArchiveTimestamp(doc: ArchivableDoc): number {
  if (doc.archivedTime) {
    const time = new Date(doc.archivedTime).getTime()
    if (!Number.isNaN(time)) return time
  }
  if (doc.lastEditTime) {
    const time = new Date(doc.lastEditTime).getTime()
    if (!Number.isNaN(time)) return time
  }
  return doc._creationTime
}

/**
 * Calculates remaining time in milliseconds before the document expires in archive.
 */
export function getRemainingArchiveTime(
  doc: ArchivableDoc,
  retentionDays: number,
  now = Date.now()
): number {
  const archiveTimestamp = getDocArchiveTimestamp(doc)
  const expirationTime = archiveTimestamp + retentionDays * 24 * 60 * 60 * 1000
  return Math.max(0, expirationTime - now)
}

/**
 * Calculates time in ms until the earliest document in archive is deleted.
 * Returns null if archive is empty.
 */
export function getNextCleanupTime(
  documents: ArchivableDoc[],
  retentionDays: number,
  now = Date.now()
): number | null {
  if (!documents || documents.length === 0) {
    return null
  }

  let minRemaining = Number.POSITIVE_INFINITY
  for (const doc of documents) {
    const remaining = getRemainingArchiveTime(doc, retentionDays, now)
    if (remaining < minRemaining) {
      minRemaining = remaining
    }
  }

  return minRemaining === Number.POSITIVE_INFINITY ? null : minRemaining
}

/**
 * Formats milliseconds remaining into Russian text.
 * e.g., "6 дней 14 ч.", "1 день", "5 часов 30 мин.", "45 минут", "< 1 мин."
 */
export function formatTimeRemaining(ms: number, isCompact = false): string {
  if (ms <= 0) {
    return isCompact ? "< 1 мин." : "менее минуты"
  }

  const totalSeconds = Math.floor(ms / 1000)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const totalHours = Math.floor(totalMinutes / 60)
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  const minutes = totalMinutes % 60

  if (isCompact) {
    if (days > 0) {
      return `${days} дн.`
    }
    if (hours > 0) {
      return `${hours} ч.`
    }
    if (minutes > 0) {
      return `${minutes} мин.`
    }
    return "< 1 мин."
  }

  if (days > 0) {
    const daysStr = `${days} ${pluralize(days, "день", "дня", "дней")}`
    if (hours > 0) {
      return `${daysStr} ${hours} ч.`
    }
    return daysStr
  }

  if (hours > 0) {
    const hoursStr = `${hours} ${pluralize(hours, "час", "часа", "часов")}`
    if (minutes > 0) {
      return `${hoursStr} ${minutes} мин.`
    }
    return hoursStr
  }

  if (minutes > 0) {
    return `${minutes} ${pluralize(minutes, "минута", "минуты", "минут")}`
  }

  return "менее минуты"
}
