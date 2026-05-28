import type { Id } from "../../convex/_generated/dataModel"

const CONVEX_ID_PATTERN = /^[a-z0-9]+$/

export function isValidConvexId(value: string): value is Id<"documents"> {
  return value.length >= 16 && CONVEX_ID_PATTERN.test(value)
}
