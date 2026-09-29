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

    const [documentCount, documentPublicCount, documentVerifiedCount] =
      await Promise.all([
        db.document.count({
          where: { userId: targetUserId, isArchived: false },
        }),
        db.document.count({
          where: { userId: targetUserId, isArchived: false, isPublished: true },
        }),
        db.document.count({
          where: { userId: targetUserId, isArchived: false, verified: true },
        }),
      ]);

    return NextResponse.json({
      documentCount,
      documentPublicCount,
      documentVerifiedCount,
    });
  } catch (error) {
    console.error("[DOCUMENTS_STATS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
