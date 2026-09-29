import { auth } from "@clerk/nextjs/server";
import { getUserById } from "@/api/user";
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

    const user = await getUserById(targetUserId);
    const retentionDays = user?.archived_settings?.retentionDays ?? 7;

    return NextResponse.json({ userId: targetUserId, retentionDays });
  } catch (error) {
    console.error("[DOCUMENTS_ARCHIVE_SETTINGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
