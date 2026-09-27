import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId, orgId: clerkOrgId } = await auth();
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    const targetUserId = requestedUserId || clerkOrgId || clerkUserId;
    if (!targetUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const settings = await db.archiveSettings.findUnique({
      where: { userId: targetUserId },
    });

    return NextResponse.json(settings ?? { userId: targetUserId, retentionDays: 7 });
  } catch (error) {
    console.error("[DOCUMENTS_ARCHIVE_SETTINGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
