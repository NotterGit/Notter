const DESKTOP_QUERY_PARAM = "desktop"
const DESKTOP_STORAGE_KEY = "desktop"
const DESKTOP_COOKIE = "desktop"

type DesktopNavigator = Navigator & {
  userAgentData?: {
    brands?: Array<{ brand: string }>
  }
}

type DesktopWindow = Window & {
  __TAURI__?: unknown
  __TAURI_IPC__?: unknown
}

const hasDesktopQueryParam = () => {
  const params = new URLSearchParams(window.location.search)

  return params.get(DESKTOP_QUERY_PARAM) === "true"
}

const hasDesktopRuntime = () => {
  const desktopWindow = window as DesktopWindow
  const desktopNavigator = navigator as DesktopNavigator
  const userAgent = navigator.userAgent.toLowerCase()
  const brands = desktopNavigator.userAgentData?.brands ?? []

  return Boolean(
    desktopWindow.__TAURI__ ||
      desktopWindow.__TAURI_IPC__ ||
      userAgent.includes("tauri") ||
      userAgent.includes("pake") ||
      brands.some(({ brand }) => /tauri|pake/i.test(brand)),
  )
}

const hasDesktopCookie = () =>
  document.cookie
    .split(";")
    .some((cookie) => cookie.trim() === `${DESKTOP_COOKIE}=true`)

export const isDesktopApp = () => {
  if (typeof window === "undefined") return false

  if (
    localStorage.getItem(DESKTOP_STORAGE_KEY) === "true" ||
    hasDesktopCookie()
  ) {
    return true
  }

  if (hasDesktopQueryParam() || hasDesktopRuntime()) {
    localStorage.setItem(DESKTOP_STORAGE_KEY, "true")
    return true
  }

  return false
}
