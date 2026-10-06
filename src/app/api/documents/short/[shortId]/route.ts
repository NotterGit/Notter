import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const { shortId } = await params;

    const document = await db.document.findUnique({
      where: { shortId },
    });

    if (!document) {
      return new NextResponse("Document not found", { status: 404 });
    }

    if (!document.isPublished || document.isArchived) {
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
    console.error("[DOCUMENT_BY_SHORT_ID_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
