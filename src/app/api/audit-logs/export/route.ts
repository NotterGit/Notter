import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserById } from "@/api/user";
import { getOrgById } from "@/api/org";
import { isDiamondPlan } from "@/config/const/limits.const";
import { generateAuditLogCsv } from "@/lib/audit-log-csv";
import { format } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    const { userId: clerkUserId, orgId: clerkOrgId } = await auth();

    if (!clerkUserId || !orgId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isOrg =
      orgId.startsWith("org_") || Boolean(clerkOrgId && clerkOrgId === orgId);

    if (!isOrg && orgId !== clerkUserId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const profile = isOrg ? await getOrgById(orgId).catch(() => null) : await getUserById(orgId).catch(() => null);

    if (!isDiamondPlan(profile?.premium)) {
      return new NextResponse(
        "Экспорт журнала аудита доступен только для тарифа Diamond",
        { status: 403 }
      );
    }

    const auditLogs = await db.noteAuditLog.findMany({
      where: {
        orgId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const csvContent = generateAuditLogCsv(auditLogs);
    const dateStr = format(new Date(), "yyyy-MM-dd");
    const filename = `notter-audit-log-${orgId}-${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[AUDIT_LOG_EXPORT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
