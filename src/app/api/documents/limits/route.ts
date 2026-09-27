import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getUserById } from "@/api/user";
import { getOrgById } from "@/api/org";
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

    const isTargetOrg = targetUserId.startsWith("org_") || isOrgParam;

    const [documentCount, publicDocumentCount, targetUser, targetOrg] = await Promise.all([
      db.document.count({
        where: { userId: targetUserId, isArchived: false },
      }),
      db.document.count({
        where: { userId: targetUserId, isArchived: false, isPublished: true },
      }),
      isTargetOrg ? Promise.resolve(null) : getUserById(targetUserId).catch(() => null),
      isTargetOrg ? getOrgById(targetUserId).catch(() => null) : Promise.resolve(null),
    ]);

    const userPremium = targetUser?.premium ?? targetOrg?.premium ?? 0;
    const premiumLevel = Math.max(userPremium, fallbackPremium) as PremiumLevel;
    const isOrg = isTargetOrg || Boolean(targetOrg);

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
