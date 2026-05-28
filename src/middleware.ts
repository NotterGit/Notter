import { NextRequest, NextResponse } from "next/server"

const DESKTOP_QUERY_PARAM = "desktop"
const DESKTOP_COOKIE = "desktop"

const isDesktopRequest = (request: NextRequest) => {
  const userAgent = request.headers.get("user-agent")?.toLowerCase() ?? ""

  return (
    request.nextUrl.searchParams.get(DESKTOP_QUERY_PARAM) === "true" ||
    request.cookies.get(DESKTOP_COOKIE)?.value === "true" ||
    userAgent.includes("tauri") ||
    userAgent.includes("pake")
  )
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/" || !isDesktopRequest(request)) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = "/dashboard"
  url.search = ""

  const response = NextResponse.redirect(url)
  response.cookies.set(DESKTOP_COOKIE, "true", {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  })

  return response
}

export const config = {
  matcher: "/",
}
