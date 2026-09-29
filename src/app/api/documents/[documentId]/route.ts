import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const { userId: clerkUserId, orgId: clerkOrgId } = await auth();
    const { searchParams } = new URL(req.url);
    const alwaysView = searchParams.get("alwaysView") === "true";
    const requestedUserId = searchParams.get("userId");

    const document = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return new NextResponse("Document not found", { status: 404 });
    }

    const isPublic = document.isPublished && !document.isArchived;
    const isOwner =
      Boolean(clerkUserId) &&
      (document.userId === clerkOrgId || document.userId === clerkUserId);
    const isRequestedUserOwner =
      Boolean(requestedUserId) &&
      document.userId === requestedUserId &&
      !document.isArchived;

    if (!isPublic && !isOwner && !alwaysView && !isRequestedUserOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const responseData = {
      ...document,
      _id: document.id,
      isAcrhived: document.isArchived,
      parentDocument: document.parentDocumentId,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[DOCUMENT_BY_ID_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
