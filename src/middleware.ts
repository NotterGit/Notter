import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

const DESKTOP_QUERY_PARAM = "desktop"
const DESKTOP_COOKIE = "desktop"
const REDIRECT_COOKIE = "redirect"

const isDesktopRequest = (request: NextRequest) => {
  const userAgent = request.headers.get("user-agent")?.toLowerCase() ?? ""

  return (
    request.nextUrl.searchParams.get(DESKTOP_QUERY_PARAM) === "true" ||
    request.cookies.get(DESKTOP_COOKIE)?.value === "true" ||
    userAgent.includes("tauri") ||
    userAgent.includes("pake")
  )
}

export default clerkMiddleware(async (auth, request) => {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next()
  }

  const { userId } = await auth()

  if (isDesktopRequest(request)) {
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

  if (request.cookies.get(REDIRECT_COOKIE)?.value === "true" && userId) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: "/",
}
