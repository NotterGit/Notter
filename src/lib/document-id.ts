const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LEGACY_ID_PATTERN = /^[a-z0-9_-]{10,}$/i;

export function isValidDocumentId(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  const trimmed = value.trim();
  return UUID_PATTERN.test(trimmed) || LEGACY_ID_PATTERN.test(trimmed);
}
