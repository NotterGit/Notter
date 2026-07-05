import { NextResponse } from "next/server"

const S3_SERVICE = process.env.NEXT_PUBLIC_S3_SERVICE

function isYandexStorageHost(hostname: string): boolean {
  return hostname === "storage.yandexcloud.net" || hostname.endsWith(".storage.yandexcloud.net")
}

function parseS3KeyFromUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl)
    if (!isYandexStorageHost(url.hostname)) {
      return null
    }

    const segments = url.pathname.split("/").filter(Boolean)
    if (url.hostname === "storage.yandexcloud.net") {
      if (segments.length < 2) {
        return null
      }
      return segments.slice(1).join("/")
    }

    return segments.join("/")
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawUrl = searchParams.get("url")
  const key = searchParams.get("key")

  if (!rawUrl && !key) {
    return NextResponse.json({ error: "Missing url or key" }, { status: 400 })
  }

  const fileKey = key ?? parseS3KeyFromUrl(rawUrl!)
  if (!fileKey) {
    return NextResponse.json({ error: "Unable to parse S3 object key" }, { status: 400 })
  }

  if (!S3_SERVICE) {
    return NextResponse.json({ error: "S3 service URL is not configured" }, { status: 500 })
  }

  const downloadUrl = new URL("/download", S3_SERVICE).toString()
  const downloadResponse = await fetch(`${downloadUrl}?key=${encodeURIComponent(fileKey)}`)
  if (!downloadResponse.ok) {
    return NextResponse.json({ error: "Failed to acquire download URL" }, { status: downloadResponse.status })
  }

  const downloadData = await downloadResponse.json()
  const signedUrl = downloadData?.url
  if (!signedUrl) {
    return NextResponse.json({ error: "Download service returned invalid response" }, { status: 500 })
  }

  const imageResponse = await fetch(signedUrl)
  if (!imageResponse.ok) {
    return NextResponse.json({ error: "Failed to fetch image from S3" }, { status: imageResponse.status })
  }

  const headers = new Headers(imageResponse.headers)
  headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=60")

  return new Response(imageResponse.body, {
    status: imageResponse.status,
    headers,
  })
}
