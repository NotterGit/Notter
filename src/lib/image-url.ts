export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    if (!parsed.hostname.endsWith("storage.yandexcloud.net")) {
      return url
    }

    const segments = parsed.pathname.split("/").filter(Boolean)
    let key: string | null = null

    if (parsed.hostname === "storage.yandexcloud.net") {
      if (segments.length >= 2) {
        key = segments.slice(1).join("/")
      }
    } else {
      key = segments.join("/")
    }

    if (!key) {
      return url
    }

    return `/api/image?key=${encodeURIComponent(key)}`
  } catch {
    return url
  }
}

export function normalizeContentUrls<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeContentUrls(item)) as unknown as T
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, normalizeContentUrls(val)]),
    ) as T
  }

  if (typeof value === "string") {
    return normalizeImageUrl(value) as unknown as T
  }

  return value
}

