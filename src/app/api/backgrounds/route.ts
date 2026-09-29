import { NextResponse } from "next/server"
import { getBackgroundCollections } from "@/lib/backgrounds"

export async function GET() {
  try {
    const collections = getBackgroundCollections()
    return NextResponse.json(collections)
  } catch (error) {
    console.error("[BACKGROUNDS_GET_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}