import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NOTE_ENTITY_TYPE } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  FREE_NOTE_AUDIT_LOG_LIMIT,
  EXTENDED_NOTE_AUDIT_LOG_LIMIT,
  hasExtendedAuditLog,
  type PremiumLevel,
} from "@/config/const/limits.const";
import { getUserById } from "@/api/user";
import { getOrgById } from "@/api/org";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const { userId: clerkUserId, orgId: clerkOrgId } = await auth();
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");
    const fallbackPremium = Number(searchParams.get("fallbackPremiumLevel")) || 0;

    const document = await db.document.findUnique({
      where: { id: documentId },
      select: { id: true, userId: true, isPublished: true, isArchived: true },
    });

    if (!document) {
      return new NextResponse("Document not found", { status: 404 });
    }

    const isOwner =
      Boolean(clerkUserId) &&
      (document.userId === clerkOrgId || document.userId === clerkUserId);
    const isRequestedUserOwner =
      Boolean(requestedUserId) &&
      document.userId === requestedUserId &&
      !document.isArchived;

    if (!isOwner && !isRequestedUserOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const orgId = document.userId;
    const isOrg =
      orgId.startsWith("org_") || Boolean(clerkOrgId && clerkOrgId === orgId);
    const [orgProfile, userProfile] = await Promise.all([
      isOrg ? getOrgById(orgId).catch(() => null) : Promise.resolve(null),
      clerkUserId ? getUserById(clerkUserId).catch(() => null) : Promise.resolve(null),
    ]);
    const userPremium = Math.max(
      Number(orgProfile?.premium ?? 0),
      Number(userProfile?.premium ?? 0)
    );
    const premiumLevel = Math.max(userPremium, fallbackPremium) as PremiumLevel;
    const isExtended = hasExtendedAuditLog(premiumLevel);
    const takeLimit = isExtended
      ? EXTENDED_NOTE_AUDIT_LOG_LIMIT
      : FREE_NOTE_AUDIT_LOG_LIMIT;

    const auditLogs = await db.noteAuditLog.findMany({
      where: {
        orgId,
        entityId: documentId,
        entityType: NOTE_ENTITY_TYPE.DOCUMENT,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: takeLimit,
    });

    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error("[DOCUMENT_LOGS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
