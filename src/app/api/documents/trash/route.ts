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

    const documents = await db.document.findMany({
      where: {
        userId: targetUserId,
        isArchived: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const responseData = documents.map((doc) => ({
      ...doc,
      _id: doc.id,
      isAcrhived: doc.isArchived,
      parentDocument: doc.parentDocumentId,
    }));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[DOCUMENTS_TRASH_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
