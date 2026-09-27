import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getDocumentLimit, getPublicDocumentLimit } from "@/lib/plan-limits";
import type { PremiumLevel } from "@/config/const/limits.const";

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId, orgId: clerkOrgId } = await auth();
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");
    const fallbackPremium = Number(searchParams.get("fallbackPremiumLevel")) || 0;
    const isOrgParam = searchParams.get("isOrg") === "true";

    const targetUserId = requestedUserId || clerkOrgId || clerkUserId;
    if (!targetUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [documentCount, publicDocumentCount, plan] = await Promise.all([
      db.document.count({
        where: { userId: targetUserId, isArchived: false },
      }),
      db.document.count({
        where: { userId: targetUserId, isArchived: false, isPublished: true },
      }),
      db.workspace.findUnique({
        where: { userId: targetUserId },
      }),
    ]);

    const premiumLevel = Math.max(plan?.premiumLevel ?? 0, fallbackPremium) as PremiumLevel;
    const isOrg = plan?.isOrg ?? isOrgParam ?? targetUserId.startsWith("org_");

    return NextResponse.json({
      documentCount,
      publicDocumentCount,
      premiumLevel,
      documentLimit: getDocumentLimit(premiumLevel, isOrg),
      publicDocumentLimit: getPublicDocumentLimit(premiumLevel, isOrg),
    });
  } catch (error) {
    console.error("[DOCUMENTS_LIMITS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
