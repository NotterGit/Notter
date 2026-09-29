import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  FREE_AUDIT_LOG_LIMIT,
  EXTENDED_AUDIT_LOG_LIMIT,
  hasExtendedAuditLog,
} from "@/config/const/limits.const";
import { getPlanLimits } from "@/lib/plan-limits";
import { getUserById } from "@/api/user";
import { getOrgById } from "@/api/org";

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId, orgId: clerkOrgId } = await auth();
    const { searchParams } = new URL(req.url);
    const requestedOrgId = searchParams.get("orgId");

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

    const profile = isOrg
      ? await getOrgById(targetOrgId).catch(() => null)
      : await getUserById(targetOrgId).catch(() => null);

    const isExtended = hasExtendedAuditLog(profile?.premium);
    const planLimits = getPlanLimits(profile?.premium, isOrg);
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
