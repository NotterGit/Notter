import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId, orgId: clerkOrgId } = await auth();
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");
    const publicSorted = searchParams.get("publicSorted") === "true";
    const parentDocument = searchParams.get("parentDocument");

    const targetUserId = requestedUserId || clerkOrgId || clerkUserId;
    if (!targetUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isOwner =
      Boolean(clerkUserId) &&
      (targetUserId === clerkOrgId || targetUserId === clerkUserId);

    const whereClause: {
      userId: string;
      isArchived: boolean;
      isPublished?: boolean;
      isPrivate?: boolean;
      parentDocumentId?: string | null;
    } = {
      userId: targetUserId,
      isArchived: false,
    };

    if (searchParams.has("parentDocument")) {
      whereClause.parentDocumentId =
        !parentDocument || parentDocument === "null" || parentDocument === "undefined"
          ? null
          : parentDocument;
    }

    if (publicSorted) {
      whereClause.isPrivate = false;
      if (!isOwner) {
        whereClause.isPublished = true;
      }
    }

    const documents = await db.document.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        userId: true,
        userName: true,
        creatorName: true,
        shortId: true,
        isShort: true,
        isArchived: true,
        archivedTime: true,
        isPinned: true,
        parentDocumentId: true,
        icon: true,
        coverImage: true,
        isPublished: true,
        isPrivate: true,
        lastEditor: true,
        lastEditTime: true,
        verified: true,
        views: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { isPinned: "desc" },
        { order: "asc" },
        { createdAt: "asc" },
      ],
    });

    const responseData = documents.map((doc) => ({
      ...doc,
      _id: doc.id,
      isAcrhived: doc.isArchived,
      parentDocument: doc.parentDocumentId,
    }));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[DOCUMENTS_SIDEBAR_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
