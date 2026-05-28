const getAbsoluteUrl = (origin: string, path: string) => `${origin.replace(/\/$/, "")}${path}`

export const pages = {
  ROOT: "/",
  URL: (origin: string) => origin.replace(/\/$/, ""),
  AUTH: "/auth/sign-in",
  BUY: "/buy",
  BUY_CHECK: "/buy/check",
  DASHBOARD: (id?: string) => (id ? `/dashboard/${id}` : "/dashboard"),
  VIEW: (id: string) => `/view/${id}`,
  VIEW_URL: (origin: string, id: string) => getAbsoluteUrl(origin, pages.VIEW(id)),
  VIEW_IFRAME: (id: string) => `${pages.VIEW(id)}/iframe`,
  VIEW_IFRAME_URL: (origin: string, id: string) => getAbsoluteUrl(origin, pages.VIEW_IFRAME(id)),
  DOCUMENT: (id: string, isShort?: boolean, shortId?: string) => (isShort && shortId ? `/${shortId}` : pages.VIEW(id)),
  DOCUMENT_URL: (origin: string, id: string, isShort?: boolean, shortId?: string) =>
    getAbsoluteUrl(origin, pages.DOCUMENT(id, isShort, shortId)),
  DOCUMENT_IFRAME: (id: string, isShort?: boolean, shortId?: string) =>
    `${pages.DOCUMENT(id, isShort, shortId)}/iframe`,
  DOCUMENT_IFRAME_URL: (origin: string, id: string, isShort?: boolean, shortId?: string) =>
    getAbsoluteUrl(origin, pages.DOCUMENT_IFRAME(id, isShort, shortId)),
  PROFILE: (team: boolean, id: string) => (team ? `/profile/org/${id}` : `/profile/${id}`),
  PROFILE_URL: (origin: string, team: boolean, id: string) => getAbsoluteUrl(origin, pages.PROFILE(team, id)),
}
