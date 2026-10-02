import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  FREE_AUDIT_LOG_LIMIT,
  EXTENDED_AUDIT_LOG_LIMIT,
  hasExtendedAuditLog,
  type PremiumLevel,
} from "@/config/const/limits.const";
import { getPlanLimits } from "@/lib/plan-limits";
import { getUserById } from "@/api/user";
import { getOrgById } from "@/api/org";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId, orgId: clerkOrgId } = await auth();
    const { searchParams } = new URL(req.url);
    const requestedOrgId = searchParams.get("orgId");
    const fallbackPremium = Number(searchParams.get("fallbackPremiumLevel")) || 0;

    const targetOrgId = requestedOrgId || clerkOrgId || clerkUserId;
    if (!clerkUserId || !targetOrgId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isOrg =
      targetOrgId.startsWith("org_") || Boolean(clerkOrgId && clerkOrgId === targetOrgId);

    // Verify access
    if (!isOrg && targetOrgId !== clerkUserId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const [orgProfile, userProfile] = await Promise.all([
      isOrg ? getOrgById(targetOrgId).catch(() => null) : Promise.resolve(null),
      getUserById(clerkUserId).catch(() => null),
    ]);

    const userPremium = Math.max(
      Number(orgProfile?.premium ?? 0),
      Number(userProfile?.premium ?? 0)
    );
    const premiumLevel = Math.max(userPremium, fallbackPremium) as PremiumLevel;

    const isExtended = hasExtendedAuditLog(premiumLevel);
    const planLimits = getPlanLimits(premiumLevel, isOrg);
    const takeLimit = isExtended
      ? EXTENDED_AUDIT_LOG_LIMIT
      : FREE_AUDIT_LOG_LIMIT;

    const [auditLogs, totalCount] = await Promise.all([
      db.noteAuditLog.findMany({
        where: {
          orgId: targetOrgId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: takeLimit,
      }),
      db.noteAuditLog.count({
        where: {
          orgId: targetOrgId,
        },
      }),
    ]);

    return NextResponse.json({
      logs: auditLogs,
      isExtended,
      tariffName: planLimits.name,
      totalCount,
    });
  } catch (error) {
    console.error("[AUDIT_LOGS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
